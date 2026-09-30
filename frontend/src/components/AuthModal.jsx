import React, { useState, useEffect } from 'react';

const DEFAULT_GOOGLE_CLIENT_ID = '361479572817-1s040ttad228nt6pm85rm2krlrt9tt17.apps.googleusercontent.com';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, API_BASE_URL, settings }) {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [mpin, setMpin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [gisButtonReady, setGisButtonReady] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setError('');
            setGisButtonReady(false);
            return;
        }

        const clientId = settings?.googleClientId || DEFAULT_GOOGLE_CLIENT_ID;
        if (!clientId) return;

        const renderGisButton = () => {
            if (!window.google?.accounts?.id) return;
            try {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: (response) => {
                        if (response?.credential) {
                            handleGoogleAuth({ credential: response.credential });
                        }
                    },
                    auto_select: false
                });

                const targetEl = document.getElementById('google-btn-rendered');
                if (targetEl) {
                    targetEl.innerHTML = '';
                    const cardEl = document.querySelector('.modern-auth-card');
                    // Dynamic width: leave padding for card
                    const availableWidth = cardEl ? (cardEl.clientWidth - 40) : (window.innerWidth - 60);
                    // Google GIS button width must be between 200 and 400
                    const btnWidth = Math.max(200, Math.min(360, Math.floor(availableWidth)));

                    window.google.accounts.id.renderButton(targetEl, {
                        type: 'standard',
                        theme: 'filled_black',
                        size: 'large',
                        text: isRegister ? 'signup_with' : 'signin_with',
                        shape: 'pill',
                        width: btnWidth.toString(),
                        logo_alignment: 'left'
                    });
                    setGisButtonReady(true);
                }
            } catch (err) {
                console.warn('[Netrave Auth] Google GIS init warning:', err.message);
                setGisButtonReady(false);
            }
        };

        const timer = setTimeout(renderGisButton, 60);
        window.addEventListener('resize', renderGisButton);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', renderGisButton);
        };
    }, [isOpen, settings?.googleClientId, isRegister]);

    if (!isOpen) return null;

    const toggleMode = () => {
        setIsRegister(!isRegister);
        setName('');
        setPhone('');
        setMpin('');
        setError('');
    };

    const handlePhoneChange = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length <= 10) setPhone(val);
    };

    const handleMpinChange = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length <= 6) setMpin(val);
    };

    // Send Google credential/profile to backend
    const handleGoogleAuth = async (payload) => {
        setGoogleLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok && data.success) {
                onAuthSuccess(data.user);
                onClose();
            } else {
                setError(data.error || 'Google authentication failed.');
            }
        } catch (err) {
            console.error('Google Auth network error:', err);
            setError('Could not connect to authentication server.');
        } finally {
            setGoogleLoading(false);
        }
    };

    // Trigger Real Google OAuth 2.0 Popup
    const handleGoogleButtonClick = () => {
        setError('');
        const clientId = settings?.googleClientId || DEFAULT_GOOGLE_CLIENT_ID;

        if (!clientId) {
            setError('Google OAuth Client ID is not configured yet. Go to Admin Panel → Settings → Shop Configurations and add your Google Client ID.');
            return;
        }

        // 1. Google OAuth 2.0 Token Client (Opens official Google accounts.google.com popup)
        if (window.google?.accounts?.oauth2) {
            try {
                setGoogleLoading(true);
                const tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: 'email profile openid',
                    callback: async (tokenResponse) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            try {
                                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                                });
                                const profile = await userInfoRes.json();
                                await handleGoogleAuth({ profile, accessToken: tokenResponse.access_token });
                            } catch (e) {
                                setError('Failed to retrieve user profile from Google.');
                                setGoogleLoading(false);
                            }
                        } else if (tokenResponse?.error) {
                            setError(`Google Sign-In canceled or failed: ${tokenResponse.error}`);
                            setGoogleLoading(false);
                        } else {
                            setGoogleLoading(false);
                        }
                    }
                });

                tokenClient.requestAccessToken({ prompt: 'select_account' });
                return;
            } catch (err) {
                console.warn('Google oauth2 popup error:', err);
                setGoogleLoading(false);
            }
        }

        // 2. Fallback to Google ID prompt
        if (window.google?.accounts?.id) {
            window.google.accounts.id.prompt();
            return;
        }

        setError('Google Identity Services SDK is not loaded yet. Please check your internet connection.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!/^[0-9]{10}$/.test(phone)) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }
        if (mpin.length !== 6) {
            setError('MPIN must be exactly 6 digits.');
            return;
        }
        if (isRegister) {
            if (!name.trim()) {
                setError('Please enter your full name.');
                return;
            }
            if (/\d/.test(name)) {
                setError('Name cannot contain numbers.');
                return;
            }
        }

        setLoading(true);
        const endpoint = isRegister ? '/auth/register' : '/auth/login';
        const payload = isRegister ? { phone, name, mpin } : { phone, mpin };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok && data.success) {
                onAuthSuccess(data.user);
                onClose();
            } else {
                setError(data.error || 'Authentication failed. Please try again.');
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError('Network error. Please check your server connection.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 18px',
        background: '#12141c',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#ffffff',
        borderRadius: '24px',
        fontSize: '13.5px',
        marginTop: '6px',
        outline: 'none',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box'
    };

    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }} style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
            <style>{`
                .modern-auth-card {
                    margin: auto !important;
                    box-sizing: border-box !important;
                }
                #google-btn-rendered {
                    width: 100% !important;
                    max-width: 100% !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    margin: 0 auto 6px !important;
                    overflow: hidden !important;
                    box-sizing: border-box !important;
                }
                #google-btn-rendered > div {
                    max-width: 100% !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    margin: 0 auto !important;
                }
                #google-btn-rendered iframe {
                    max-width: 100% !important;
                    margin: 0 auto !important;
                    border-radius: 24px !important;
                }
                .modern-auth-input:focus {
                    border-color: #f59e0b !important;
                    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15) !important;
                    background: #161924 !important;
                }
                .google-signin-btn {
                    width: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 12px !important;
                    background: #ffffff !important;
                    color: #1f2937 !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 24px !important;
                    padding: 12px 20px !important;
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    cursor: pointer !important;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    box-shadow: 0 3px 12px rgba(0,0,0,0.18) !important;
                    margin-bottom: 8px !important;
                }
                .google-signin-btn:hover:not(:disabled) {
                    background: #f8fafc !important;
                    box-shadow: 0 5px 16px rgba(255,255,255,0.12) !important;
                    transform: translateY(-1.5px) !important;
                }
                .google-signin-btn:active:not(:disabled) {
                    transform: translateY(0) !important;
                }
                .google-signin-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .auth-divider-line {
                    display: flex !important;
                    align-items: center !important;
                    text-align: center !important;
                    margin: 20px 0 !important;
                    color: #64748b !important;
                    font-size: 11px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.8px !important;
                    font-weight: 600 !important;
                }
                .auth-divider-line::before,
                .auth-divider-line::after {
                    content: '' !important;
                    flex: 1 !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
                }
                .auth-divider-line span {
                    padding: 0 10px !important;
                }
                .modern-auth-btn {
                    background: rgba(245, 158, 11, 0.08) !important;
                    color: #f59e0b !important;
                    border: 1px solid rgba(245, 158, 11, 0.4) !important;
                    border-radius: 24px !important;
                    font-weight: 700 !important;
                    font-size: 13.5px !important;
                    padding: 12px 24px !important;
                    cursor: pointer !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    width: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    text-transform: uppercase !important;
                    letter-spacing: 1px !important;
                }
                .modern-auth-btn:hover:not(:disabled) {
                    background: #f59e0b !important;
                    color: #0a0b0e !important;
                    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4) !important;
                    transform: translateY(-2px) !important;
                }
                .modern-auth-btn:active:not(:disabled) {
                    transform: translateY(0) !important;
                }
                .modern-auth-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .auth-close-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: none;
                    border: none;
                    color: #64748b;
                    font-size: 26px;
                    cursor: pointer;
                    line-height: 1;
                    transition: color 0.2s;
                }
                .auth-close-btn:hover {
                    color: #fff;
                }
                @media (max-width: 480px) {
                    .modern-auth-card {
                        padding: 24px 16px !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        border-radius: 16px !important;
                    }
                    .modern-auth-title {
                        font-size: 20px !important;
                    }
                    .modern-auth-sub {
                        font-size: 12px !important;
                    }
                    .google-signin-btn,
                    .modern-auth-btn {
                        font-size: 12.5px !important;
                        padding: 10px 16px !important;
                    }
                }
            `}</style>

            <div className="modal-content modern-auth-card" style={{ 
                maxWidth: '410px', 
                width: '100%',
                padding: '34px 28px', 
                background: 'rgba(10, 11, 14, 0.96)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(245, 158, 11, 0.25)', 
                boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 35px rgba(245,158,11,0.08)',
                borderRadius: '16px',
                position: 'relative'
            }}>
                <button className="auth-close-btn" onClick={onClose}>&times;</button>
                
                {/* Visual Header Icon */}
                <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                    <div style={{ 
                        width: '52px', 
                        height: '52px', 
                        background: 'rgba(245, 158, 11, 0.1)', 
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                        boxShadow: '0 0 15px rgba(245,158,11,0.05)'
                    }}>
                        <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px', fill: '#f59e0b' }}>
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                    </div>

                    <h2 className="modern-auth-title" style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px', color: '#fff', letterSpacing: '0.5px' }}>
                        {isRegister ? 'Register Account' : 'Welcome to Netrave'}
                    </h2>
                    <p className="modern-auth-sub" style={{ color: '#94a3b8', fontSize: '12.5px', margin: 0, lineHeight: '1.4' }}>
                        {isRegister ? 'Sign up with Google or create an account with phone & MPIN' : 'Sign in using your Google account or phone MPIN'}
                    </p>
                </div>

                {/* UNIFIED SINGLE GOOGLE SIGN IN BUTTON */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px', overflow: 'hidden' }}>
                    {/* Official Google GIS Button Render Target (when client ID present) */}
                    <div 
                        id="google-btn-rendered" 
                        style={{ 
                            display: gisButtonReady ? 'flex' : 'none', 
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            maxWidth: '100%',
                            overflow: 'hidden'
                        }}
                    ></div>

                    {/* Official Branded Google OAuth Popup Trigger (shown ONLY if GIS button didn't render) */}
                    {!gisButtonReady && (
                        <button 
                            type="button" 
                            className="google-signin-btn" 
                            onClick={handleGoogleButtonClick}
                            disabled={googleLoading || loading}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18">
                                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
                                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z"/>
                                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
                            </svg>
                            <span>
                                {googleLoading ? 'Connecting to Google...' : (isRegister ? 'Sign up with Google' : 'Sign in with Google')}
                            </span>
                        </button>
                    )}
                </div>

                {/* DIVIDER */}
                <div className="auth-divider-line">
                    <span>or with mobile & MPIN</span>
                </div>

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div style={{ marginBottom: '14px' }}>
                            <label htmlFor="authName" style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name *</label>
                            <input 
                                type="text" 
                                id="authName" 
                                className="modern-auth-input"
                                placeholder="Enter your full name" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={inputStyle}
                                required 
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '14px' }}>
                        <label htmlFor="authPhone" style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mobile Number *</label>
                        <input 
                            type="tel" 
                            id="authPhone" 
                            className="modern-auth-input"
                            placeholder="10-digit mobile number" 
                            value={phone}
                            onChange={handlePhoneChange}
                            style={inputStyle}
                            required 
                        />
                    </div>

                    <div style={{ marginBottom: '18px' }}>
                        <label htmlFor="authMpin" style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>6-Digit MPIN *</label>
                        <input 
                            type="password" 
                            id="authMpin" 
                            className="modern-auth-input"
                            placeholder="••••••" 
                            value={mpin}
                            onChange={handleMpinChange}
                            maxLength={6}
                            style={{ ...inputStyle, letterSpacing: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '15px' }}
                            required 
                        />
                    </div>

                    {error && (
                        <div style={{ 
                            background: 'rgba(239,68,68,0.1)', 
                            color: '#ef4444', 
                            border: '1px solid rgba(239,68,68,0.2)', 
                            padding: '10px 14px', 
                            borderRadius: '8px', 
                            fontSize: '12px', 
                            marginBottom: '16px',
                            textAlign: 'center',
                            fontWeight: '500',
                            lineHeight: '1.4'
                        }}>
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="modern-auth-btn" 
                        disabled={loading || googleLoading}
                    >
                        {loading ? 'Processing...' : (isRegister ? 'Register & Set MPIN' : 'Login & Open Dashboard')}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12.5px' }}>
                        <span style={{ color: '#94a3b8' }}>
                            {isRegister ? 'Already registered? ' : 'New customer? '}
                        </span>
                        <button 
                            type="button" 
                            onClick={toggleMode}
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#f59e0b', 
                                fontWeight: '700', 
                                cursor: 'pointer', 
                                textDecoration: 'none',
                                marginLeft: '4px'
                            }}
                        >
                            {isRegister ? 'Login here' : 'Register here'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
