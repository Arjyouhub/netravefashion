import React, { useState } from 'react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, API_BASE_URL }) {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [mpin, setMpin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
        if (isRegister && !name.trim()) {
            setError('Please enter your full name.');
            return;
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
        padding: '12px 14px',
        background: '#12141c',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#ffffff',
        borderRadius: '8px',
        fontSize: '13.5px',
        marginTop: '6px',
        outline: 'none',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box'
    };

    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }} style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
            {/* Inline styles for interactive premium classes */}
            <style>{`
                .modern-auth-card {
                    margin: auto !important;
                    box-sizing: border-box !important;
                }
                .modern-auth-input:focus {
                    border-color: #f59e0b !important;
                    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15) !important;
                    background: #161924 !important;
                }
                .modern-auth-btn {
                    background: linear-gradient(135deg, #f59e0b, #d97706) !important;
                    color: #0a0b0e !important;
                    border: none !important;
                    border-radius: 8px !important;
                    font-weight: 800 !important;
                    font-size: 14px !important;
                    padding: 13px !important;
                    cursor: pointer !important;
                    transition: all 0.3s ease !important;
                    width: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                }
                .modern-auth-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35) !important;
                }
                .modern-auth-btn:active:not(:disabled) {
                    transform: translateY(0);
                }
                .modern-auth-btn:disabled {
                    opacity: 0.6;
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
                        padding: 28px 20px !important;
                        width: 100% !important;
                        border-radius: 12px !important;
                    }
                    .modern-auth-title {
                        font-size: 20px !important;
                    }
                    .modern-auth-sub {
                        font-size: 12px !important;
                    }
                    .modern-auth-btn {
                        font-size: 13px !important;
                        padding: 12px !important;
                    }
                }
            `}</style>

            <div className="modal-content modern-auth-card" style={{ 
                maxWidth: '400px', 
                width: '100%',
                padding: '36px 28px', 
                background: 'rgba(10, 11, 14, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(245, 158, 11, 0.25)', 
                boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 35px rgba(245,158,11,0.08)',
                borderRadius: '16px',
                position: 'relative'
            }}>
                <button className="auth-close-btn" onClick={onClose}>&times;</button>
                
                {/* Visual Header Icon */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ 
                        width: '56px', 
                        height: '56px', 
                        background: 'rgba(245, 158, 11, 0.1)', 
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        boxShadow: '0 0 15px rgba(245,158,11,0.05)'
                    }}>
                        <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px', fill: '#f59e0b' }}>
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                    </div>

                    <h2 className="modern-auth-title" style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px', color: '#fff', letterSpacing: '0.5px' }}>
                        {isRegister ? 'Register Account' : 'Welcome Back'}
                    </h2>
                    <p className="modern-auth-sub" style={{ color: '#94a3b8', fontSize: '12.5px', margin: 0, lineHeight: '1.4' }}>
                        {isRegister ? 'Set up a custom secure 6-digit login MPIN' : 'Enter your registered phone and 6-digit MPIN'}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div style={{ marginBottom: '16px' }}>
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

                    <div style={{ marginBottom: '16px' }}>
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

                    <div style={{ marginBottom: '20px' }}>
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
                            fontSize: '12.5px', 
                            marginBottom: '16px',
                            textAlign: 'center',
                            fontWeight: '500'
                        }}>
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="modern-auth-btn" 
                        disabled={loading}
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
