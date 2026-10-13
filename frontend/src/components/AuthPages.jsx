import React, { useState, useEffect } from 'react';
import './AuthPages.css';

const DEFAULT_GOOGLE_CLIENT_ID = '361479572817-1s040ttad228nt6pm85rm2krlrt9tt17.apps.googleusercontent.com';

export default function AuthPages({
    initialMode = 'login', // 'login', 'signup', 'forgot', 'verify-signup-otp', 'verify-forgot-otp', 'reset-password'
    onAuthSuccess,
    onNavigate,
    API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? 'http://localhost:5001/api'
        : 'https://netravefashion.onrender.com/api',
    settings = {}
}) {
    const [mode, setMode] = useState(initialMode);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Login Form State
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);

    // Signup Form State
    const [fullName, setFullName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPhone, setSignupPhone] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(true);

    // Forgot Password & Reset State
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // OTP Verification State
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        setMode(initialMode);
        setError('');
        setSuccessMessage('');
    }, [initialMode]);

    // Resend countdown timer for OTP screens
    useEffect(() => {
        let timer;
        if ((mode === 'verify-signup-otp' || mode === 'verify-forgot-otp') && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [mode, countdown]);

    // Helper to validate email format
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
    };

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
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                if (onAuthSuccess) onAuthSuccess(data.user);
                if (onNavigate) onNavigate('home');
                return;
            } else {
                setError(data.error || 'Google sign-in failed. Please try again.');
            }
        } catch {
            setError('Unable to reach server for Google sign-in. Please check your connection.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const triggerGoogleSignIn = () => {
        setError('');
        setSuccessMessage('');
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

        setError('Google Sign-In is unavailable or popup was closed. Please sign in with your credentials.');
        setGoogleLoading(false);
    };

    // 1. Handle Login Submit
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!identifier.trim()) {
            setError('Please enter your email, phone number or username.');
            return;
        }
        if (!password) {
            setError('Please enter your password.');
            return;
        }

        setLoading(true);
        const cleanIdentifier = identifier.trim();
        const digitsOnly = cleanIdentifier.replace(/\D/g, '');
        const isPhoneOnly = digitsOnly.length === 10 || (digitsOnly.length === 12 && digitsOnly.startsWith('91'));
        const phoneFormatted = digitsOnly.length === 12 && digitsOnly.startsWith('91') ? digitsOnly.slice(2) : digitsOnly;

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: cleanIdentifier,
                    phone: isPhoneOnly ? phoneFormatted : undefined,
                    email: cleanIdentifier.includes('@') ? cleanIdentifier : undefined,
                    username: cleanIdentifier,
                    password: password,
                    mpin: password
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                if (onAuthSuccess) onAuthSuccess(data.user);
                if (onNavigate) onNavigate('home');
                setLoading(false);
                return;
            } else {
                setError(data.error || 'Invalid credentials. Please check your username and password.');
                setLoading(false);
                return;
            }
        } catch {
            setError('Unable to reach server. Please check your network connection.');
            setLoading(false);
            return;
        }
    };

    // 2. Handle Initial Signup Form Submit -> Send Email OTP
    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const cleanName = fullName.trim();
        const cleanEmail = signupEmail.trim().toLowerCase();
        const cleanPhone = signupPhone.trim();

        if (!cleanName) {
            setError('Please enter your full name.');
            return;
        }
        if (!cleanEmail) {
            setError('Please enter your email address.');
            return;
        }
        if (!isValidEmail(cleanEmail)) {
            setError('Please enter a valid email address (e.g. name@domain.com).');
            return;
        }
        if (cleanPhone) {
            const digitsOnly = cleanPhone.replace(/\D/g, '');
            if (digitsOnly.length < 10) {
                setError('Please enter a valid 10-digit mobile number.');
                return;
            }
        }
        if (signupPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (signupPassword !== confirmPassword) {
            setError('Passwords do not match. Please re-enter.');
            return;
        }
        if (!agreeTerms) {
            setError('Please agree to the Terms & Conditions and Privacy Policy.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/send-registration-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: cleanName,
                    email: cleanEmail,
                    phone: cleanPhone || undefined,
                    password: signupPassword
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                setOtpValues(['', '', '', '', '', '']);
                setCountdown(60);
                setMode('verify-signup-otp');
                setSuccessMessage(`A 6-digit verification code has been sent to ${cleanEmail}.`);
            } else {
                setError(data.error || 'Failed to send verification code. Please check your email.');
            }
        } catch {
            setError('Unable to reach server. Please check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    // 3. Handle Verify Registration OTP Submit
    const handleVerifyRegistrationOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const code = otpValues.join('');
        if (code.length < 6) {
            setError('Please enter the complete 6-digit verification code.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/verify-registration-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: signupEmail.trim().toLowerCase(),
                    otp: code
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                setSuccessMessage('Email verified successfully! Welcome to Netrave.');
                setTimeout(() => {
                    if (onAuthSuccess) onAuthSuccess(data.user);
                    if (onNavigate) onNavigate('home');
                }, 800);
            } else {
                setError(data.error || 'Verification code is invalid or expired.');
            }
        } catch {
            setError('Network error during verification. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // 4. Handle Resend Registration OTP
    const handleResendRegistrationOtp = async () => {
        if (countdown > 0 || resendLoading) return;
        setError('');
        setSuccessMessage('');
        setResendLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/send-registration-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: fullName.trim(),
                    email: signupEmail.trim().toLowerCase(),
                    phone: signupPhone.trim() || undefined,
                    password: signupPassword
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                setCountdown(60);
                setOtpValues(['', '', '', '', '', '']);
                setSuccessMessage(`A new 6-digit verification code was sent to ${signupEmail.trim()}.`);
            } else {
                setError(data.error || 'Could not resend OTP. Please wait a moment and try again.');
            }
        } catch {
            setError('Network error while resending code. Please check your connection.');
        } finally {
            setResendLoading(false);
        }
    };

    // 5. Handle Forgot Password Submit -> Send Reset OTP
    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const cleanEmail = forgotEmail.trim().toLowerCase();
        if (!cleanEmail) {
            setError('Please enter your registered email address.');
            return;
        }
        if (!isValidEmail(cleanEmail)) {
            setError('Please enter a valid email address (e.g. name@domain.com).');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/send-forgot-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: cleanEmail })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                setOtpValues(['', '', '', '', '', '']);
                setCountdown(60);
                setMode('verify-forgot-otp');
                setSuccessMessage(`If an account exists for ${cleanEmail}, a 6-digit reset code has been sent.`);
            } else {
                setError(data.error || 'Failed to send reset code. Please try again.');
            }
        } catch {
            setError('Network error. Unable to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    // 6. Handle Verify Forgot OTP Submit
    const handleVerifyForgotOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const code = otpValues.join('');
        if (code.length < 6) {
            setError('Please enter the complete 6-digit reset code.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/verify-forgot-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: forgotEmail.trim().toLowerCase(),
                    otp: code
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success && data.resetToken) {
                setResetToken(data.resetToken);
                setMode('reset-password');
                setSuccessMessage('Code verified successfully. Please choose a new password.');
            } else {
                setError(data.error || 'Invalid or expired code. Please try again.');
            }
        } catch {
            setError('Network error during verification. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // 7. Handle Resend Forgot OTP
    const handleResendForgotOtp = async () => {
        if (countdown > 0 || resendLoading) return;
        setError('');
        setSuccessMessage('');
        setResendLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/send-forgot-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                setCountdown(60);
                setOtpValues(['', '', '', '', '', '']);
                setSuccessMessage(`A new 6-digit code has been sent to ${forgotEmail.trim()}.`);
            } else {
                setError(data.error || 'Could not resend code. Please wait a moment.');
            }
        } catch {
            setError('Network error while resending code.');
        } finally {
            setResendLoading(false);
        }
    };

    // 8. Handle Create New Password Submit
    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setError('Passwords do not match. Please verify both fields.');
            return;
        }
        if (!resetToken) {
            setError('Reset session expired. Please restart the forgot password process.');
            setMode('forgot');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: forgotEmail.trim().toLowerCase(),
                    resetToken: resetToken,
                    newPassword: newPassword
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                setSuccessMessage('Password reset successfully! You can now log in with your new password.');
                setIdentifier(forgotEmail.trim().toLowerCase());
                setPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setResetToken('');
                setTimeout(() => {
                    setMode('login');
                }, 1200);
            } else {
                setError(data.error || 'Failed to update password. Please try again.');
            }
        } catch {
            setError('Network error while updating password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // OTP Box Input & Keyboard Handling
    const handleOtpChange = (index, val) => {
        const cleaned = val.replace(/\D/g, '');
        const singleChar = cleaned.length > 1 ? cleaned.slice(-1) : cleaned;
        
        const updated = [...otpValues];
        updated[index] = singleChar;
        setOtpValues(updated);

        if (singleChar && index < 5) {
            const nextEl = document.getElementById(`netrave-otp-box-${index + 1}`);
            if (nextEl) nextEl.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
            const prevEl = document.getElementById(`netrave-otp-box-${index - 1}`);
            if (prevEl) {
                prevEl.focus();
                const updated = [...otpValues];
                updated[index - 1] = '';
                setOtpValues(updated);
            }
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted) {
            const updated = [...otpValues];
            for (let i = 0; i < 6; i++) {
                updated[i] = pasted[i] || '';
            }
            setOtpValues(updated);
            const nextFocusIndex = Math.min(pasted.length, 5);
            const targetEl = document.getElementById(`netrave-otp-box-${nextFocusIndex}`);
            if (targetEl) targetEl.focus();
        }
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

    const isSignupFlow = mode === 'signup' || mode === 'verify-signup-otp';
    const [activeSlide, setActiveSlide] = useState(0);

    const loginImages = ['/assets/auth_login_model.jpg', '/assets/auth_standing_model.jpg'];
    const signupImages = ['/assets/auth_signup_model.jpg', '/assets/auth_login_model.jpg'];
    const currentImages = isSignupFlow ? signupImages : loginImages;
    const bannerBgImage = currentImages[activeSlide] || currentImages[0];

    return (
        <div className="auth-page-root">
            {/* Main Split Authentication Card */}
            <div className="auth-master-card">
                {/* ------------------------------------------------------------------
                   LEFT BANNER COLUMN (Matching Netrave Editorial Layout)
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
                            onClick={() => {
                                if (mode === 'verify-signup-otp') {
                                    setMode('signup');
                                } else if (mode === 'verify-forgot-otp' || mode === 'reset-password') {
                                    setMode('forgot');
                                } else if (onNavigate) {
                                    onNavigate('home');
                                }
                            }}
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
                                    Join Netrave for a premium, seamless wardrobe experience.
                                </p>
                                <h1 className="auth-banner-hero-title mobile-only-text">
                                    Create Account
                                </h1>
                                <p className="auth-banner-hero-desc mobile-only-text">
                                    Join Netrave for a better shopping experience
                                </p>
                            </>
                        ) : mode === 'verify-signup-otp' ? (
                            <>
                                <h1 className="auth-banner-hero-title desktop-only-text">
                                    VERIFY
                                    <span className="hl-yellow">EMAIL</span>
                                </h1>
                                <p className="auth-banner-hero-desc desktop-only-text">
                                    One last step to unlock your personal Netrave wardrobe.
                                </p>
                                <h1 className="auth-banner-hero-title mobile-only-text">
                                    Verify Email
                                </h1>
                                <p className="auth-banner-hero-desc mobile-only-text">
                                    Enter 6-digit code sent to your email
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
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="1" y="3" width="15" height="13"/>
                                        <polygon points="16 8 20 8 23 11 23 16 16 16 8"/>
                                        <circle cx="5.5" cy="18.5" r="2.5"/>
                                        <circle cx="18.5" cy="18.5" r="2.5"/>
                                    </svg>
                                </div>
                                <div className="auth-feature-title">Free Shipping</div>
                                <div className="auth-feature-sub">On orders above ₹999</div>
                            </div>

                            <div className="auth-feature-item">
                                <div className="auth-feature-icon-wrap">
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
                   RIGHT FORM COLUMN
                   ------------------------------------------------------------------ */}
                <div className="auth-form-column">
                    {/* Top Switch Bar (Desktop) */}
                    <div className="auth-top-switch-bar">
                        {mode === 'login' && (
                            <span>
                                Don't have an account?{' '}
                                <button type="button" className="auth-switch-btn" onClick={() => { setMode('signup'); setError(''); setSuccessMessage(''); }}>
                                    Sign Up
                                </button>
                            </span>
                        )}
                        {mode === 'signup' && (
                            <span>
                                Already have an account?{' '}
                                <button type="button" className="auth-switch-btn" onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}>
                                    Login
                                </button>
                            </span>
                        )}
                        {mode === 'verify-signup-otp' && (
                            <span>
                                Want to edit registration details?{' '}
                                <button type="button" className="auth-switch-btn" onClick={() => { setMode('signup'); setError(''); setSuccessMessage(''); }}>
                                    Edit Details
                                </button>
                            </span>
                        )}
                        {(mode === 'forgot' || mode === 'verify-forgot-otp' || mode === 'reset-password') && (
                            <span>
                                Remember your password?{' '}
                                <button type="button" className="auth-switch-btn" onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}>
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
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Success Alert Message */}
                        {successMessage && (
                            <div className="auth-success-alert" role="status">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>
                                <span>{successMessage}</span>
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
                                            onClick={() => { setMode('forgot'); setError(''); setSuccessMessage(''); }}
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
                                            onClick={() => { setMode('signup'); setError(''); setSuccessMessage(''); }}
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
                                    <p className="auth-form-subheading">Email verification OTP required to complete signup</p>
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

                                        {/* Email Address */}
                                        <div className="auth-input-field">
                                            <div className="auth-input-icon-left">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                                                </svg>
                                            </div>
                                            <input 
                                                type="email" 
                                                className="auth-input-native"
                                                placeholder="Email Address (OTP will be sent here)"
                                                value={signupEmail}
                                                onChange={(e) => setSignupEmail(e.target.value)}
                                                required
                                                autoComplete="email"
                                            />
                                        </div>

                                        {/* Phone Number (Optional) */}
                                        <div className="auth-input-field">
                                            <div className="auth-input-icon-left">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                                </svg>
                                            </div>
                                            <input 
                                                type="tel" 
                                                className="auth-input-native"
                                                placeholder="Mobile Number (Optional)"
                                                value={signupPhone}
                                                onChange={(e) => setSignupPhone(e.target.value)}
                                                autoComplete="tel"
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
                                                placeholder="Password (Min. 6 characters)"
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
                                        <span>{loading ? 'Sending Verification Code...' : 'Continue & Verify Email'}</span>
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
                                            onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
                                        >
                                            Login
                                        </button>
                                    </p>
                                </form>
                            </>
                        )}

                        {/* ==========================================================
                           3. VERIFY REGISTRATION EMAIL OTP SCREEN
                           ========================================================== */}
                        {mode === 'verify-signup-otp' && (
                            <>
                                <div className="auth-form-titles">
                                    <h2 className="auth-form-heading">Verify Your Email</h2>
                                    <p className="auth-form-subheading">
                                        Code sent to <strong>{signupEmail}</strong>
                                    </p>
                                </div>

                                <p className="auth-sub-instruction">
                                    Please enter the 6-digit verification code sent to <strong>{signupEmail}</strong>. Code expires in 5 minutes.
                                </p>

                                <form onSubmit={handleVerifyRegistrationOtp}>
                                    <div className="auth-otp-grid" onPaste={handleOtpPaste}>
                                        {otpValues.map((digit, i) => (
                                            <input 
                                                key={i}
                                                id={`netrave-otp-box-${i}`}
                                                type="text" 
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={1} 
                                                className="auth-otp-box"
                                                value={digit}
                                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                autoFocus={i === 0}
                                                autoComplete="one-time-code"
                                            />
                                        ))}
                                    </div>

                                    <div className="auth-otp-timer-row">
                                        {countdown > 0 ? (
                                            <span>Resend code in 00:{countdown < 10 ? `0${countdown}` : countdown}</span>
                                        ) : (
                                            <button 
                                                type="button" 
                                                className="auth-switch-btn"
                                                onClick={handleResendRegistrationOtp}
                                                disabled={resendLoading}
                                            >
                                                {resendLoading ? 'Sending...' : 'Resend Code Now'}
                                            </button>
                                        )}
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="btn-auth-primary-action"
                                        disabled={loading}
                                    >
                                        <span>{loading ? 'Verifying...' : 'Verify & Complete Registration'}</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14"/>
                                            <path d="m12 5 7 7-7 7"/>
                                        </svg>
                                    </button>

                                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                        <button 
                                            type="button" 
                                            className="auth-link-forgot"
                                            onClick={() => { setMode('signup'); setError(''); setSuccessMessage(''); }}
                                        >
                                            ← Edit registration details
                                        </button>
                                    </div>

                                    <p className="auth-mobile-switch-text" style={{ display: 'block' }}>
                                        Already have an account?{' '}
                                        <button 
                                            type="button" 
                                            className="auth-switch-btn" 
                                            onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
                                        >
                                            Login
                                        </button>
                                    </p>
                                </form>
                            </>
                        )}

                        {/* ==========================================================
                           4. FORGOT PASSWORD SCREEN
                           ========================================================== */}
                        {mode === 'forgot' && (
                            <>
                                <div className="auth-form-titles">
                                    <h2 className="auth-form-heading">Forgot Password</h2>
                                    <p className="auth-form-subheading">Enter your email to receive a 6-digit reset code</p>
                                </div>

                                <p className="auth-sub-instruction">
                                    Enter your registered email address below. We'll send you a secure 6-digit code to reset your password.
                                </p>

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
                                                type="email" 
                                                className="auth-input-native"
                                                placeholder="Enter your registered email"
                                                value={forgotEmail}
                                                onChange={(e) => setForgotEmail(e.target.value)}
                                                required
                                                autoComplete="email"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="btn-auth-primary-action"
                                        disabled={loading}
                                        style={{ marginTop: '8px' }}
                                    >
                                        <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
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
                                            onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
                                        >
                                            Login
                                        </button>
                                    </p>
                                </form>
                            </>
                        )}

                        {/* ==========================================================
                           5. VERIFY FORGOT PASSWORD OTP SCREEN
                           ========================================================== */}
                        {mode === 'verify-forgot-otp' && (
                            <>
                                <div className="auth-form-titles">
                                    <h2 className="auth-form-heading">Verify Reset Code</h2>
                                    <p className="auth-form-subheading">
                                        Code sent to <strong>{forgotEmail}</strong>
                                    </p>
                                </div>

                                <p className="auth-sub-instruction">
                                    Enter the 6-digit verification code sent to <strong>{forgotEmail}</strong> to verify your identity.
                                </p>

                                <form onSubmit={handleVerifyForgotOtp}>
                                    <div className="auth-otp-grid" onPaste={handleOtpPaste}>
                                        {otpValues.map((digit, i) => (
                                            <input 
                                                key={i}
                                                id={`netrave-otp-box-${i}`}
                                                type="text" 
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={1} 
                                                className="auth-otp-box"
                                                value={digit}
                                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                autoFocus={i === 0}
                                                autoComplete="one-time-code"
                                            />
                                        ))}
                                    </div>

                                    <div className="auth-otp-timer-row">
                                        {countdown > 0 ? (
                                            <span>Resend code in 00:{countdown < 10 ? `0${countdown}` : countdown}</span>
                                        ) : (
                                            <button 
                                                type="button" 
                                                className="auth-switch-btn"
                                                onClick={handleResendForgotOtp}
                                                disabled={resendLoading}
                                            >
                                                {resendLoading ? 'Sending...' : 'Resend Code Now'}
                                            </button>
                                        )}
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="btn-auth-primary-action"
                                        disabled={loading}
                                    >
                                        <span>{loading ? 'Verifying...' : 'Verify Code & Proceed'}</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14"/>
                                            <path d="m12 5 7 7-7 7"/>
                                        </svg>
                                    </button>

                                    <p className="auth-mobile-switch-text" style={{ display: 'block' }}>
                                        <button 
                                            type="button" 
                                            className="auth-switch-btn" 
                                            onClick={() => { setMode('forgot'); setError(''); setSuccessMessage(''); }}
                                        >
                                            ← Change Email Address
                                        </button>
                                    </p>
                                </form>
                            </>
                        )}

                        {/* ==========================================================
                           6. CREATE NEW PASSWORD SCREEN
                           ========================================================== */}
                        {mode === 'reset-password' && (
                            <>
                                <div className="auth-form-titles">
                                    <h2 className="auth-form-heading">Create New Password</h2>
                                    <p className="auth-form-subheading">Choose a secure password for your account</p>
                                </div>

                                <p className="auth-sub-instruction">
                                    Identity verified! Enter your new password below to secure your Netrave account.
                                </p>

                                <form onSubmit={handleResetPasswordSubmit}>
                                    <div className="auth-inputs-stack">
                                        {/* New Password */}
                                        <div className="auth-input-field">
                                            <div className="auth-input-icon-left">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                                </svg>
                                            </div>
                                            <input 
                                                type={showNewPassword ? 'text' : 'password'}
                                                className="auth-input-native"
                                                placeholder="New Password (Min. 6 characters)"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                autoComplete="new-password"
                                                autoFocus
                                            />
                                            <button 
                                                type="button" 
                                                className="auth-password-toggle"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showNewPassword ? (
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

                                        {/* Confirm New Password */}
                                        <div className="auth-input-field">
                                            <div className="auth-input-icon-left">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                                </svg>
                                            </div>
                                            <input 
                                                type={showConfirmNewPassword ? 'text' : 'password'}
                                                className="auth-input-native"
                                                placeholder="Confirm New Password"
                                                value={confirmNewPassword}
                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                required
                                                autoComplete="new-password"
                                            />
                                            <button 
                                                type="button" 
                                                className="auth-password-toggle"
                                                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                                aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showConfirmNewPassword ? (
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

                                    <button 
                                        type="submit" 
                                        className="btn-auth-primary-action"
                                        disabled={loading}
                                        style={{ marginTop: '8px' }}
                                    >
                                        <span>{loading ? 'Updating Password...' : 'Save New Password & Login'}</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14"/>
                                            <path d="m12 5 7 7-7 7"/>
                                        </svg>
                                    </button>

                                    <p className="auth-mobile-switch-text" style={{ display: 'block' }}>
                                        Back to{' '}
                                        <button 
                                            type="button" 
                                            className="auth-switch-btn" 
                                            onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
                                        >
                                            Login
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
