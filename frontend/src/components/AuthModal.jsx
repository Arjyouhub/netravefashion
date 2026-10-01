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

    useEffect(() => {
        if (!isOpen) {
            setError('');
            return;
        }

        const clientId = settings?.googleClientId || DEFAULT_GOOGLE_CLIENT_ID;
        if (!clientId) return;

        // Initialize Google Identity Services in case One Tap is available
        if (window.google?.accounts?.id) {
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
            } catch (err) {
                console.warn('[Netrave Auth] Google GIS init warning:', err.message);
            }
        }
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
                            if (tokenResponse.error !== 'popup_closed_by_user' && tokenResponse.error !== 'access_denied') {
                                setError(`Google Sign-In canceled or failed: ${tokenResponse.error}`);
                            }
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
                .google-auth-container {
                    width: 100% !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    margin-bottom: 6px !important;
                }
                .modern-google-btn {
                    width: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 12px !important;
                    background: #ffffff !important;
                    color: #1e293b !important;
                    border: 1px solid rgba(255, 255, 255, 0.25) !important;
                    border-radius: 24px !important;
                    padding: 12px 20px !important;
                    min-height: 48px !important;
                    font-size: 14.5px !important;
                    font-weight: 600 !important;
                    font-family: inherit !important;
                    letter-spacing: 0.2px !important;
                    cursor: pointer !important;
                    box-sizing: border-box !important;
                    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.15) !important;
                    position: relative !important;
                    outline: none !important;
                    user-select: none !important;
                    -webkit-tap-highlight-color: transparent !important;
                }
                .modern-google-btn:hover:not(:disabled) {
                    background: #f8fafc !important;
                    color: #0f172a !important;
                    box-shadow: 0 6px 22px rgba(255, 255, 255, 0.18), 0 3px 8px rgba(0, 0, 0, 0.3) !important;
                    transform: translateY(-1.5px) !important;
                }
                .modern-google-btn:active:not(:disabled) {
                    transform: scale(0.99) translateY(0) !important;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25) !important;
                }
                .modern-google-btn:focus-visible {
                    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.45), 0 4px 12px rgba(0, 0, 0, 0.25) !important;
                }
                .modern-google-btn:disabled {
                    opacity: 0.65 !important;
                    cursor: not-allowed !important;
                    transform: none !important;
                }
                .google-icon-wrapper {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    width: 22px !important;
                    height: 22px !important;
                    flex-shrink: 0 !important;
                }
                .google-svg-icon {
                    width: 20px !important;
                    height: 20px !important;
                    display: block !important;
                }
                .google-spinner {
                    width: 18px !important;
                    height: 18px !important;
                    border: 2.5px solid #cbd5e1 !important;
                    border-top-color: #4285F4 !important;
                    border-radius: 50% !important;
                    animation: googleSpin 0.7s linear infinite !important;
                }
                @keyframes googleSpin {
                    to { transform: rotate(360deg); }
                }
                .google-btn-text {
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                }
                .modern-auth-input:focus {
                    border-color: #f59e0b !important;
                    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15) !important;
                    background: #161924 !important;
                }
                .auth-divider-line {
                    display: flex !important;
                    align-items: center !important;
                    text-align: center !important;
                    margin: 18px 0 !important;
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
                    min-height: 48px !important;
                    cursor: pointer !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    width: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    text-transform: uppercase !important;
                    letter-spacing: 1px !important;
                    box-sizing: border-box !important;
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
                        padding: 24px 18px !important;
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
                    .modern-google-btn {
                        font-size: 13.5px !important;
                        padding: 11px 14px !important;
                        min-height: 46px !important;
                        gap: 10px !important;
                    }
                    .modern-auth-btn {
                        font-size: 12.5px !important;
                        padding: 11px 16px !important;
                        min-height: 46px !important;
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

                {/* MODERN RESPONSIVE GOOGLE SIGN IN BUTTON */}
                <div className="google-auth-container">
                    <button 
                        type="button" 
                        id="google-signin-action-btn"
                        className="modern-google-btn" 
                        onClick={handleGoogleButtonClick}
                        disabled={googleLoading || loading}
                        aria-label={isRegister ? 'Sign up with Google' : 'Sign in with Google'}
                    >
                        <div className="google-icon-wrapper">
                            {googleLoading ? (
                                <div className="google-spinner"></div>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" className="google-svg-icon" focusable="false" aria-hidden="true">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                </svg>
                            )}
                        </div>
                        <span className="google-btn-text">
                            {googleLoading ? 'Connecting to Google...' : (isRegister ? 'Sign up with Google' : 'Sign in with Google')}
                        </span>
                    </button>
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
