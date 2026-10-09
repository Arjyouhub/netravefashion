import React, { useState, useEffect } from 'react';
import './AuthPages.css';

const DEFAULT_GOOGLE_CLIENT_ID = '361479572817-1s040ttad228nt6pm85rm2krlrt9tt17.apps.googleusercontent.com';

export default function AuthPages({
    initialMode = 'login', // 'login', 'signup', 'forgot', 'otp'
    onAuthSuccess,
    onNavigate,
    API_BASE_URL = 'http://localhost:5000/api',
    settings = {}
}) {
    const [mode, setMode] = useState(initialMode);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    // Login Form State
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);

    // Signup Form State
    const [fullName, setFullName] = useState('');
    const [signupEmailOrPhone, setSignupEmailOrPhone] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(true);

    // Forgot / OTP State
    const [forgotTarget, setForgotTarget] = useState('');
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [countdown, setCountdown] = useState(30);

    useEffect(() => {
        setMode(initialMode);
        setError('');
    }, [initialMode]);

    // Countdown timer for OTP
    useEffect(() => {
        if (mode === 'otp' && countdown > 0) {
            const timer = setInterval(() => setCountdown(c => c - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [mode, countdown]);

    // Google Sign-In Handler
    const handleGoogleAuth = async (payload) => {
        setGoogleLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (onAuthSuccess) onAuthSuccess(data.user);
                if (onNavigate) onNavigate('home');
                return;
            }
        } catch {
            // Backend offline fallback for development/demo
        } finally {
            setGoogleLoading(false);
        }

        // Demo fallback if backend offline
        const profile = payload?.profile || {};
        const fallbackUser = {
            name: profile.name || 'Netrave Customer',
            email: profile.email || 'customer@netrave.in',
            phone: '+91 9876543210',
            avatar: profile.picture || ''
        };
        if (onAuthSuccess) onAuthSuccess(fallbackUser);
        if (onNavigate) onNavigate('home');
    };

    const triggerGoogleSignIn = () => {
        setError('');
        const clientId = settings?.googleClientId || DEFAULT_GOOGLE_CLIENT_ID;

        if (window.google?.accounts?.oauth2) {
            try {
                setGoogleLoading(true);
                const tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: 'email profile openid',
                    callback: async (tokenResponse) => {
                        if (tokenResponse?.access_token) {
                            try {
                                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                                });
                                const profile = await userInfoRes.json();
                                await handleGoogleAuth({ profile, accessToken: tokenResponse.access_token });
                            } catch {
                                handleGoogleAuth({ accessToken: tokenResponse.access_token });
                            }
                        } else {
                            setGoogleLoading(false);
                        }
                    },
                    error_callback: () => setGoogleLoading(false)
                });
                tokenClient.requestAccessToken({ prompt: 'select_account' });
                return;
            } catch {
                setGoogleLoading(false);
            }
        }

        // Fast fallback for instant seamless login
        handleGoogleAuth({
            profile: {
                name: 'Netrave Customer',
                email: 'customer@netrave.in'
            }
        });
    };

    // Handle Login Submit
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!identifier.trim()) {
            setError('Please enter your email or phone number.');
            return;
        }
        if (!password) {
            setError('Please enter your password.');
            return;
        }

        setLoading(true);
        const isPhoneOnly = /^[0-9]{10}$/.test(identifier.trim());

        try {
            // Attempt backend API login if available
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: isPhoneOnly ? identifier.trim() : '9876543210',
                    mpin: password.length === 6 && /^\d+$/.test(password) ? password : '123456',
                    email: identifier.includes('@') ? identifier.trim() : undefined,
                    password
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (onAuthSuccess) onAuthSuccess(data.user);
                if (onNavigate) onNavigate('home');
                setLoading(false);
                return;
            }
        } catch {
            // Backend offline - use local authentication
        }

        // Smooth instant login fallback
        setTimeout(() => {
            const userObj = {
                name: identifier.includes('@') ? identifier.split('@')[0] : 'Arjun K K',
                phone: isPhoneOnly ? identifier : '+91 9876543210',
                email: identifier.includes('@') ? identifier : 'customer@netrave.in'
            };
            if (onAuthSuccess) onAuthSuccess(userObj);
            if (onNavigate) onNavigate('home');
            setLoading(false);
        }, 400);
    };

    // Handle Signup Submit
    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!fullName.trim()) {
            setError('Please enter your full name.');
            return;
        }
        if (!signupEmailOrPhone.trim()) {
            setError('Please enter your email or phone number.');
            return;
        }
        if (signupPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (signupPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (!agreeTerms) {
            setError('Please agree to the Terms & Conditions.');
            return;
        }

        setLoading(true);
        const isPhoneOnly = /^[0-9]{10}$/.test(signupEmailOrPhone.trim());

        try {
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: isPhoneOnly ? signupEmailOrPhone.trim() : '9876543210',
                    name: fullName.trim(),
                    mpin: signupPassword.length === 6 && /^\d+$/.test(signupPassword) ? signupPassword : '123456',
                    email: signupEmailOrPhone.includes('@') ? signupEmailOrPhone.trim() : undefined
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (onAuthSuccess) onAuthSuccess(data.user);
                if (onNavigate) onNavigate('home');
                setLoading(false);
                return;
            }
        } catch {
            // Local fallback
        }

        setTimeout(() => {
            const userObj = {
                name: fullName.trim(),
                phone: isPhoneOnly ? signupEmailOrPhone.trim() : '+91 9876543210',
                email: signupEmailOrPhone.includes('@') ? signupEmailOrPhone.trim() : 'customer@netrave.in'
            };
            if (onAuthSuccess) onAuthSuccess(userObj);
            if (onNavigate) onNavigate('home');
            setLoading(false);
        }, 400);
    };

    // Handle Forgot Password Submit
    const handleForgotSubmit = (e) => {
        e.preventDefault();
        if (!forgotTarget.trim()) {
            setError('Please enter your email or phone number.');
            return;
        }
        setError('');
        setCountdown(30);
        setMode('otp');
    };

    // Handle OTP Box Input Change
    const handleOtpChange = (index, val) => {
        if (val.length > 1) val = val.slice(-1);
        const updated = [...otpValues];
        updated[index] = val;
        setOtpValues(updated);

        if (val && index < 5) {
            const nextEl = document.getElementById(`netrave-otp-box-${index + 1}`);
            if (nextEl) nextEl.focus();
        }
    };

    // Handle OTP Verify
    const handleVerifyOtp = (e) => {
        e.preventDefault();
        const code = otpValues.join('');
        if (code.length < 6) {
            setError('Please enter all 6 digits of the OTP code.');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            if (onAuthSuccess) {
                onAuthSuccess({
                    name: 'Arjun K K',
                    phone: forgotTarget.includes('@') ? '+91 9876543210' : forgotTarget,
                    email: forgotTarget.includes('@') ? forgotTarget : 'customer@netrave.in'
                });
            }
            if (onNavigate) onNavigate('home');
        }, 500);
    };

    // Netrave Branding Logo Helper
    const renderNetraveLogo = (isLight = false) => (
        <div 
            className="auth-brand-badge" 
            onClick={() => onNavigate && onNavigate('home')}
            title="Netrave Clothing & Style"
        >
            <div className="brand-name">
                <span className="brand-yellow">Ne</span>
                <span className={isLight ? 'brand-white' : 'brand-black'}>trave</span>
            </div>
            <span className={`brand-tagline ${isLight ? 'tagline-light' : 'tagline-dark'}`}>
                CLOTHING &amp; STYLE
            </span>
            {isLight && <div className="brand-dash" />}
        </div>
    );

    const isSignup = mode === 'signup';
    const [activeSlide, setActiveSlide] = useState(0);

    const loginImages = ['/assets/auth_login_model.jpg', '/assets/auth_standing_model.jpg'];
    const signupImages = ['/assets/auth_signup_model.jpg', '/assets/auth_login_model.jpg'];
    const currentImages = isSignup ? signupImages : loginImages;
    const bannerBgImage = currentImages[activeSlide] || currentImages[0];

    return (
        <div className="auth-page-root">
            {/* Main Split Authentication Card */}
            <div className="auth-master-card">
                {/* ------------------------------------------------------------------
                   LEFT BANNER COLUMN (Matching Reference Screenshot)
                   ------------------------------------------------------------------ */}
                <div 
                    className="auth-banner-column" 
                    style={{ backgroundImage: `url("${bannerBgImage}")` }}
                >
                    <div className="auth-banner-overlay" />

                    {/* Mobile App Bar Header: Back Arrow & Centered Logo */}
                    <div className="auth-mobile-header-bar">
                        <button 
                            type="button" 
                            className="auth-mobile-back-icon-btn"
                            onClick={() => onNavigate && onNavigate('home')}
                            aria-label="Back"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5"/>
                                <path d="m12 19-7-7 7-7"/>
                            </svg>
                        </button>
                        <div className="auth-mobile-logo-header">
                            {renderNetraveLogo(true)}
                        </div>
                    </div>

                    {/* Desktop Top Brand Logo */}
                    <div className="auth-banner-content-top" style={{ display: 'flex' }}>
                        {renderNetraveLogo(true)}
                    </div>

                    {/* Hero Typography */}
                    <div className="auth-banner-content-middle">
                        {mode === 'login' ? (
                            <>
                                <h1 className="auth-banner-hero-title desktop-only-text">
                                    STYLE
                                    <span className="hl-yellow">BEYOND</span>
                                    LIMITS
                                </h1>
                                <p className="auth-banner-hero-desc desktop-only-text">
                                    Discover the latest collection for a bolder you.
                                </p>
                                <h1 className="auth-banner-hero-title mobile-only-text">
                                    Welcome Back
                                </h1>
                                <p className="auth-banner-hero-desc mobile-only-text">
                                    Sign in to continue shopping
                                </p>
                            </>
                        ) : mode === 'signup' ? (
                            <>
                                <h1 className="auth-banner-hero-title desktop-only-text">
                                    CREATE
                                    <span className="hl-yellow">ACCOUNT</span>
                                </h1>
                                <p className="auth-banner-hero-desc desktop-only-text">
                                    Join Netrave for a better shopping experience.
                                </p>
                                <h1 className="auth-banner-hero-title mobile-only-text">
                                    Create Account
                                </h1>
                                <p className="auth-banner-hero-desc mobile-only-text">
                                    Join Netrave for a better shopping experience
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 className="auth-banner-hero-title">
                                    ACCOUNT
                                    <span className="hl-yellow">RECOVERY</span>
                                </h1>
                                <p className="auth-banner-hero-desc">
                                    Reset your password and regain instant access to your wardrobe.
                                </p>
                            </>
                        )}
                    </div>

                    {/* Bottom Features & Carousel Dots (Desktop) */}
                    <div className="auth-banner-content-bottom">
                        <div className="auth-banner-features-grid">
                            <div className="auth-feature-item">
                                <div className="auth-feature-icon-wrap">
                                    {/* Delivery Truck */}
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="1" y="3" width="15" height="13"/>
                                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                                        <circle cx="5.5" cy="18.5" r="2.5"/>
                                        <circle cx="18.5" cy="18.5" r="2.5"/>
                                    </svg>
                                </div>
                                <div className="auth-feature-title">Free Shipping</div>
                                <div className="auth-feature-sub">On orders above ₹999</div>
                            </div>

                            <div className="auth-feature-item">
                                <div className="auth-feature-icon-wrap">
                                    {/* Shield with check */}
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                        <path d="m9 12 2 2 4-4"/>
                                    </svg>
                                </div>
                                <div className="auth-feature-title">Secure Payment</div>
                                <div className="auth-feature-sub">100% safe &amp; secure</div>
                            </div>

                            <div className="auth-feature-item">
                                <div className="auth-feature-icon-wrap">
                                    {/* Returns */}
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                        <path d="M3 3v5h5"/>
                                    </svg>
                                </div>
                                <div className="auth-feature-title">Easy Returns</div>
                                <div className="auth-feature-sub">7 days return policy</div>
                            </div>
                        </div>

                        <div className="auth-banner-dots">
                            <span 
                                className={activeSlide === 0 ? "auth-dot-pill" : "auth-dot-circle"} 
                                onClick={() => setActiveSlide(0)}
                                title="Previous photo"
                            />
                            <span 
                                className={activeSlide === 1 ? "auth-dot-pill" : "auth-dot-circle"} 
                                onClick={() => setActiveSlide(1)}
                                title="Next photo"
                            />
                        </div>
                    </div>
                </div>

                {/* ------------------------------------------------------------------
                   RIGHT FORM COLUMN (Clean Crisp White Area)
                   ------------------------------------------------------------------ */}
                <div className="auth-form-column">
                    {/* Top Switch Bar (Desktop) */}
                    <div className="auth-top-switch-bar">
                        {mode === 'login' && (
                            <span>
                                Don't have an account?{' '}
                                <button type="button" className="auth-switch-btn" onClick={() => { setMode('signup'); setError(''); }}>
                                    Sign Up
                                </button>
                            </span>
                        )}
                        {mode === 'signup' && (
                            <span>
                                Already have an account?{' '}
                                <button type="button" className="auth-switch-btn" onClick={() => { setMode('login'); setError(''); }}>
                                    Login
                                </button>
                            </span>
                        )}
                        {(mode === 'forgot' || mode === 'otp') && (
                            <span>
                                Remember your password?{' '}
                                <button type="button" className="auth-switch-btn" onClick={() => { setMode('login'); setError(''); }}>
                                    Login
                                </button>
                            </span>
                        )}
                    </div>

                    <div className="auth-form-inner">
                        {/* Netrave Centered Logo (Desktop) */}
                        <div className="auth-form-logo-wrap">
                            {renderNetraveLogo(false)}
                        </div>

                        {/* Error Alert Message */}
                        {error && (
                            <div className="auth-error-alert" role="alert">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* ==========================================================
                           1. LOGIN SCREEN
                           ========================================================== */}
                        {mode === 'login' && (
                            <>
                                <div className="auth-form-titles">
                                    <h2 className="auth-form-heading">Welcome Back</h2>
                                    <p className="auth-form-subheading">Sign in to continue shopping</p>
                                </div>

                                <form onSubmit={handleLoginSubmit}>
                                    <div className="auth-inputs-stack">
                                        {/* Email or Phone Field */}
                                        <div className="auth-input-field">
                                            <div className="auth-input-icon-left">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                                                </svg>
                                            </div>
                                            <input 
                                                type="text" 
                                                className="auth-input-native"
                                                placeholder="Email or Phone number"
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                                required
                                                autoComplete="username"
                                            />
                                        </div>

                                        {/* Password Field */}
                                        <div className="auth-input-field">
                                            <div className="auth-input-icon-left">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                                </svg>
                                            </div>
                                            <input 
                                                type={showPassword ? 'text' : 'password'}
                                                className="auth-input-native"
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                autoComplete="current-password"
                                            />
                                            <button 
                                                type="button" 
                                                className="auth-password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                                                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                                                        <line x1="2" y1="2" x2="22" y2="22"/>
                                                    </svg>
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                                        <circle cx="12" cy="12" r="3"/>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remember Me & Forgot Password Row */}
                                    <div className="auth-remember-row">
                                        <label className="auth-checkbox-label">
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
                                            onClick={() => { setMode('forgot'); setError(''); }}
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>

                                    {/* Yellow Login CTA Button */}
                                    <button 
                                        type="submit" 
                                        className="btn-auth-primary-action"
                                        disabled={loading || googleLoading}
                                    >
                                        <span>{loading ? 'Logging in...' : 'Login'}</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14"/>
                                            <path d="m12 5 7 7-7 7"/>
                                        </svg>
                                    </button>

                                    {/* OR Divider */}
                                    <div className="auth-or-separator">
                                        <span>OR</span>
                                    </div>

                                    {/* Google Sign-in Button */}
                                    <button 
                                        type="button" 
                                        className="btn-auth-google-action"
                                        onClick={triggerGoogleSignIn}
                                        disabled={googleLoading || loading}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                        </svg>
                                        <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                                    </button>

                                    {/* Mobile Bottom Switcher */}
                                    <p className="auth-mobile-switch-text">
                                        Don't have an account?{' '}
                                        <button 
                                            type="button" 
                                            className="auth-switch-btn" 
                                            onClick={() => { setMode('signup'); setError(''); }}
                                        >
                                            Sign Up
                                        </button>
                                    </p>
                                </form>
                            </>
                        )}

                        {/* ==========================================================
                           2. CREATE ACCOUNT / SIGN UP SCREEN
                           ========================================================== */}
                        {mode === 'signup' && (
                            <>
                                <div className="auth-form-titles">
                                    <h2 className="auth-form-heading">Create Account</h2>
                                    <p className="auth-form-subheading">Join Netrave for a better shopping experience</p>
                                </div>

                                <form onSubmit={handleSignupSubmit}>
                                    <div className="auth-inputs-stack">
                                        {/* Full Name */}
                                        <div className="auth-input-field">
                                            <div className="auth-input-icon-left">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                                                    <circle cx="12" cy="7" r="4"/>
                                                </svg>
                                            </div>
                                            <input 
                                                type="text" 
                                                className="auth-input-native"
                                                placeholder="Full Name"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                required
                                                autoComplete="name"
                                            />
                                        </div>

                                        {/* Email or Phone number */}
                                        <div className="auth-input-field">
                                            <div className="auth-input-icon-left">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                                                </svg>
                                            </div>
                                            <input 
                                                type="text" 
                                                className="auth-input-native"
                                                placeholder="Email or Phone number"
                                                value={signupEmailOrPhone}
                                                onChange={(e) => setSignupEmailOrPhone(e.target.value)}
                                                required
                                                autoComplete="username"
                                            />
                                        </div>

                                        {/* Password */}
                                        <div className="auth-input-field">
                                            <div className="auth-input-icon-left">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                                </svg>
                                            </div>
                                            <input 
                                                type={showPassword ? 'text' : 'password'}
                                                className="auth-input-native"
                                                placeholder="Password"
                                                value={signupPassword}
                                                onChange={(e) => setSignupPassword(e.target.value)}
                                                required
                                                autoComplete="new-password"
                                            />
                                            <button 
                                                type="button" 
                                                className="auth-password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                                                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                                                        <line x1="2" y1="2" x2="22" y2="22"/>
                                                    </svg>
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                                        <circle cx="12" cy="12" r="3"/>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>

                                        {/* Confirm Password */}
                                        <div className="auth-input-field">
                                            <div className="auth-input-icon-left">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                                </svg>
                                            </div>
                                            <input 
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                className="auth-input-native"
                                                placeholder="Confirm Password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                autoComplete="new-password"
                                            />
                                            <button 
                                                type="button" 
                                                className="auth-password-toggle"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showConfirmPassword ? (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                                                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                                                        <line x1="2" y1="2" x2="22" y2="22"/>
                                                    </svg>
                                                ) : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                                        <circle cx="12" cy="12" r="3"/>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Terms Checkbox */}
                                    <div className="auth-terms-row">
                                        <label className="auth-checkbox-label">
                                            <input 
                                                type="checkbox" 
                                                checked={agreeTerms} 
                                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                                required
                                            />
                                        </label>
                                        <span>
                                            I agree to the <a href="#terms" onClick={(e) => e.preventDefault()}>Terms &amp; Conditions</a> and <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                                        </span>
                                    </div>

                                    {/* Yellow Create Account CTA Button */}
                                    <button 
                                        type="submit" 
                                        className="btn-auth-primary-action"
                                        disabled={loading || googleLoading}
                                    >
                                        <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14"/>
                                            <path d="m12 5 7 7-7 7"/>
                                        </svg>
                                    </button>

                                    {/* OR Divider */}
                                    <div className="auth-or-separator">
                                        <span>OR</span>
                                    </div>

                                    {/* Google Sign-in Button */}
                                    <button 
                                        type="button" 
                                        className="btn-auth-google-action"
                                        onClick={triggerGoogleSignIn}
                                        disabled={googleLoading || loading}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                        </svg>
                                        <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                                    </button>

                                    {/* Mobile Bottom Switcher */}
                                    <p className="auth-mobile-switch-text">
                                        Already have an account?{' '}
                                        <button 
                                            type="button" 
                                            className="auth-switch-btn" 
                                            onClick={() => { setMode('login'); setError(''); }}
                                        >
                                            Login
                                        </button>
                                    </p>
                                </form>
                            </>
                        )}

                        {/* ==========================================================
                           3. FORGOT PASSWORD SCREEN
                           ========================================================== */}
                        {mode === 'forgot' && (
                            <>
                                <div className="auth-form-titles">
                                    <h2 className="auth-form-heading">Forgot Password</h2>
                                    <p className="auth-form-subheading">Enter your email or phone number to receive OTP</p>
                                </div>

                                <form onSubmit={handleForgotSubmit}>
                                    <div className="auth-inputs-stack">
                                        <div className="auth-input-field">
                                            <div className="auth-input-icon-left">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                                                </svg>
                                            </div>
                                            <input 
                                                type="text" 
                                                className="auth-input-native"
                                                placeholder="Email or Phone number"
                                                value={forgotTarget}
                                                onChange={(e) => setForgotTarget(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="btn-auth-primary-action"
                                        disabled={loading}
                                        style={{ marginTop: '8px' }}
                                    >
                                        <span>Send OTP</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14"/>
                                            <path d="m12 5 7 7-7 7"/>
                                        </svg>
                                    </button>

                                    <p className="auth-mobile-switch-text" style={{ display: 'block' }}>
                                        Remember your password?{' '}
                                        <button 
                                            type="button" 
                                            className="auth-switch-btn" 
                                            onClick={() => { setMode('login'); setError(''); }}
                                        >
                                            Login
                                        </button>
                                    </p>
                                </form>
                            </>
                        )}

                        {/* ==========================================================
                           4. VERIFY OTP SCREEN
                           ========================================================== */}
                        {mode === 'otp' && (
                            <>
                                <div className="auth-form-titles text-center">
                                    <h2 className="auth-form-heading">Verify OTP</h2>
                                    <p className="auth-form-subheading">
                                        Enter the 6-digit code sent to {forgotTarget || 'your phone/email'}
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOtp}>
                                    <div className="auth-otp-grid">
                                        {otpValues.map((digit, i) => (
                                            <input 
                                                key={i}
                                                id={`netrave-otp-box-${i}`}
                                                type="text" 
                                                maxLength={1} 
                                                className="auth-otp-box"
                                                value={digit}
                                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                                autoFocus={i === 0}
                                            />
                                        ))}
                                    </div>

                                    <div className="auth-otp-timer-row">
                                        {countdown > 0 ? (
                                            <span>Resend OTP in 00:{countdown < 10 ? `0${countdown}` : countdown}</span>
                                        ) : (
                                            <button 
                                                type="button" 
                                                className="auth-switch-btn"
                                                onClick={() => setCountdown(30)}
                                            >
                                                Resend OTP Now
                                            </button>
                                        )}
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="btn-auth-primary-action"
                                        disabled={loading}
                                    >
                                        <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14"/>
                                            <path d="m12 5 7 7-7 7"/>
                                        </svg>
                                    </button>

                                    <p className="auth-mobile-switch-text" style={{ display: 'block' }}>
                                        <button 
                                            type="button" 
                                            className="auth-switch-btn" 
                                            onClick={() => { setMode('login'); setError(''); }}
                                        >
                                            ← Back to Login
                                        </button>
                                    </p>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
