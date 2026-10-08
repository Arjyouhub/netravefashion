import React, { useState, useEffect } from 'react';

export default function AuthPages({
    initialMode = 'login', // 'login', 'signup', 'forgot', 'otp'
    onAuthSuccess,
    onNavigate,
    API_BASE_URL
}) {
    const [mode, setMode] = useState(initialMode);
    const [showPassword, setShowPassword] = useState(false);
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [countdown, setCountdown] = useState(30);

    // Form states
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);

    const [fullName, setFullName] = useState('');
    const [signupEmailOrPhone, setSignupEmailOrPhone] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(true);

    const [forgotTarget, setForgotTarget] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    // Countdown for OTP
    useEffect(() => {
        if (mode === 'otp' && countdown > 0) {
            const timer = setInterval(() => setCountdown(c => c - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [mode, countdown]);

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            const userObj = {
                name: identifier.includes('@') ? identifier.split('@')[0] : 'Arjun K K',
                phone: identifier.includes('@') ? '+91 9876543210' : identifier,
                email: identifier.includes('@') ? identifier : 'arjun@netrave.in'
            };
            if (onAuthSuccess) onAuthSuccess(userObj);
            if (onNavigate) onNavigate('home');
            setLoading(false);
        }, 500);
    };

    const handleSignupSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            const userObj = {
                name: fullName || 'Arjun K K',
                phone: signupEmailOrPhone.includes('@') ? '+91 9876543210' : signupEmailOrPhone,
                email: signupEmailOrPhone.includes('@') ? signupEmailOrPhone : 'user@netrave.in'
            };
            if (onAuthSuccess) onAuthSuccess(userObj);
            if (onNavigate) onNavigate('home');
            setLoading(false);
        }, 500);
    };

    const handleSendOtp = (e) => {
        e.preventDefault();
        setCountdown(30);
        setMode('otp');
    };

    const handleOtpChange = (index, val) => {
        if (val.length > 1) val = val.slice(-1);
        const updated = [...otpValues];
        updated[index] = val;
        setOtpValues(updated);

        // Auto move to next input box
        if (val && index < 5) {
            const nextEl = document.getElementById(`otp-box-input-${index + 1}`);
            if (nextEl) nextEl.focus();
        }
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            if (onAuthSuccess) {
                onAuthSuccess({
                    name: 'Arjun K K',
                    phone: forgotTarget || '+91 9876543210',
                    email: 'arjun@netrave.in'
                });
            }
            if (onNavigate) onNavigate('home');
        }, 600);
    };

    return (
        <div className="netrave-page-wrapper auth-mobile-view">
            {/* Top Bar with [<] Back button */}
            <div className="auth-mobile-top-bar">
                <button 
                    type="button" 
                    className="auth-mobile-back-btn" 
                    onClick={() => onNavigate && onNavigate('home')}
                    aria-label="Back"
                >
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                </button>
            </div>

            <div className="auth-mobile-card-container">
                {/* PRESERVED EXACT NETRAVE LOGO */}
                <div className="auth-mobile-logo-wrap" onClick={() => onNavigate && onNavigate('home')}>
                    <img src="/assets/logo.png" alt="NETRAVE Logo" className="auth-mobile-logo-img" />
                    <div className="header-brand-title" style={{ fontSize: '24px' }}>
                        <span className="logo-net">Net</span>
                        <span className="logo-rave" style={{ color: 'var(--netrave-yellow, #FFD400)' }}>rave</span>
                    </div>
                    <span className="header-brand-sub" style={{ color: 'var(--netrave-yellow, #FFD400)', fontSize: '8px' }}>
                        CLOTHING & STYLE
                    </span>
                </div>

                {/* 1. LOGIN SCREEN */}
                {mode === 'login' && (
                    <div className="auth-mobile-form-box">
                        <h1 className="auth-mobile-screen-title">Welcome Back</h1>
                        <p className="auth-mobile-screen-sub">Sign in to continue shopping</p>

                        <form onSubmit={handleLoginSubmit}>
                            <div className="auth-field-item">
                                <label>Email / Phone</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Enter your email or phone"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                />
                            </div>

                            <div className="auth-field-item">
                                <label>Password</label>
                                <div className="auth-password-wrapper">
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        required 
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button 
                                        type="button" 
                                        className="btn-toggle-eye" 
                                        onClick={() => setShowPassword(p => !p)}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>

                            <div className="auth-row-options">
                                <label className="auth-remember-check">
                                    <input 
                                        type="checkbox" 
                                        checked={rememberMe} 
                                        onChange={(e) => setRememberMe(e.target.checked)} 
                                    />
                                    <span>Remember me</span>
                                </label>

                                <button 
                                    type="button" 
                                    className="auth-link-forgot"
                                    onClick={() => setMode('forgot')}
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            <button type="submit" className="btn-auth-submit-yellow" disabled={loading}>
                                {loading ? 'Logging in...' : 'Login'}
                            </button>

                            <div className="auth-or-divider">
                                <span>OR</span>
                            </div>

                            <div className="auth-social-stack">
                                <button type="button" className="auth-social-btn" onClick={handleLoginSubmit}>
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                    </svg>
                                    <span>Continue with Google</span>
                                </button>

                                <button type="button" className="auth-social-btn" onClick={handleLoginSubmit}>
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="#1877F2">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                    <span>Continue with Facebook</span>
                                </button>
                            </div>

                            <p className="auth-switch-link-sub">
                                Don't have an account?{' '}
                                <button type="button" className="btn-switch-text" onClick={() => setMode('signup')}>
                                    Sign Up
                                </button>
                            </p>
                        </form>
                    </div>
                )}

                {/* 2. SIGNUP SCREEN */}
                {mode === 'signup' && (
                    <div className="auth-mobile-form-box">
                        <h1 className="auth-mobile-screen-title">Create Account</h1>
                        <p className="auth-mobile-screen-sub">Join Netrave for a better shopping experience</p>

                        <form onSubmit={handleSignupSubmit}>
                            <div className="auth-field-item">
                                <label>Full Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Enter your name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>

                            <div className="auth-field-item">
                                <label>Email or Phone</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Enter your email or phone"
                                    value={signupEmailOrPhone}
                                    onChange={(e) => setSignupEmailOrPhone(e.target.value)}
                                />
                            </div>

                            <div className="auth-field-item">
                                <label>Password</label>
                                <input 
                                    type="password" 
                                    required 
                                    placeholder="Enter password"
                                    value={signupPassword}
                                    onChange={(e) => setSignupPassword(e.target.value)}
                                />
                            </div>

                            <div className="auth-field-item">
                                <label>Confirm Password</label>
                                <input 
                                    type="password" 
                                    required 
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <label className="auth-terms-checkbox">
                                <input 
                                    type="checkbox" 
                                    required 
                                    checked={agreeTerms} 
                                    onChange={(e) => setAgreeTerms(e.target.checked)} 
                                />
                                <span>I agree to the Terms & Conditions</span>
                            </label>

                            <button type="submit" className="btn-auth-submit-yellow" disabled={loading}>
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>

                            <div className="auth-or-divider">
                                <span>OR</span>
                            </div>

                            <div className="auth-social-stack">
                                <button type="button" className="auth-social-btn" onClick={handleSignupSubmit}>
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                    </svg>
                                    <span>Continue with Google</span>
                                </button>
                                <button type="button" className="auth-social-btn" onClick={handleSignupSubmit}>
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="#1877F2">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                    <span>Continue with Facebook</span>
                                </button>
                            </div>

                            <p className="auth-switch-link-sub">
                                Already have an account?{' '}
                                <button type="button" className="btn-switch-text" onClick={() => setMode('login')}>
                                    Login
                                </button>
                            </p>
                        </form>
                    </div>
                )}

                {/* 3. FORGOT PASSWORD SCREEN */}
                {mode === 'forgot' && (
                    <div className="auth-mobile-form-box">
                        <h1 className="auth-mobile-screen-title">Forgot Password</h1>
                        <p className="auth-mobile-screen-sub">Enter your email or phone number to receive OTP</p>

                        <form onSubmit={handleSendOtp}>
                            <div className="auth-field-item">
                                <label>Email or Phone</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Enter your email or phone"
                                    value={forgotTarget}
                                    onChange={(e) => setForgotTarget(e.target.value)}
                                />
                            </div>

                            <button type="submit" className="btn-auth-submit-yellow">
                                Send OTP
                            </button>

                            {/* Envelope with OTP Tag Illustration */}
                            <div className="auth-envelope-art-wrap">
                                <div className="envelope-illustration">
                                    <span className="envelope-emoji">✉️</span>
                                    <span className="otp-badge-tag">OTP</span>
                                </div>
                                <p className="envelope-subtext">We will send a 6-digit OTP to your email or phone number</p>
                            </div>

                            <p className="auth-switch-link-sub">
                                Remember password?{' '}
                                <button type="button" className="btn-switch-text" onClick={() => setMode('login')}>
                                    Login
                                </button>
                            </p>
                        </form>
                    </div>
                )}

                {/* 4. VERIFY OTP SCREEN (6 Boxes) */}
                {mode === 'otp' && (
                    <div className="auth-mobile-form-box">
                        <h1 className="auth-mobile-screen-title">Verify OTP</h1>
                        <p className="auth-mobile-screen-sub">Enter the 6-digit code sent to your email or phone</p>

                        <form onSubmit={handleVerifyOtp}>
                            <div className="otp-six-boxes-row">
                                {otpValues.map((digit, i) => (
                                    <input 
                                        key={i}
                                        id={`otp-box-input-${i}`}
                                        type="text" 
                                        maxLength={1} 
                                        className="otp-square-box"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                    />
                                ))}
                            </div>

                            <div className="otp-countdown-text">
                                {countdown > 0 ? (
                                    <span>Resend OTP in 00:{countdown < 10 ? `0${countdown}` : countdown}</span>
                                ) : (
                                    <button 
                                        type="button" 
                                        className="btn-resend-otp-active"
                                        onClick={() => setCountdown(30)}
                                    >
                                        Resend OTP Now
                                    </button>
                                )}
                            </div>

                            <button type="submit" className="btn-auth-submit-yellow" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
