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

    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }}>
            <div className="modal-content checkout-modal-content" style={{ maxWidth: '420px', padding: '30px' }}>
                <button className="close-btn modal-close" onClick={onClose}>&times;</button>
                
                <h2 style={{ fontSize: '24px', marginBottom: '6px', textAlign: 'center', color: '#fff' }}>
                    {isRegister ? 'Register Account' : 'Sign In / My Orders'}
                </h2>
                <p className="form-subtitle" style={{ textAlign: 'center', marginBottom: '24px' }}>
                    {isRegister ? 'Set up your 6-digit login MPIN' : 'Enter your registered mobile & MPIN'}
                </p>

                <form onSubmit={handleSubmit} className="booking-form">
                    {isRegister && (
                        <div className="form-group">
                            <label htmlFor="authName">Full Name *</label>
                            <input 
                                type="text" 
                                id="authName" 
                                placeholder="Enter your full name" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required 
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="authPhone">Mobile Number *</label>
                        <input 
                            type="tel" 
                            id="authPhone" 
                            placeholder="10-digit mobile number" 
                            value={phone}
                            onChange={handlePhoneChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="authMpin">6-Digit MPIN *</label>
                        <input 
                            type="password" 
                            id="authMpin" 
                            placeholder="Enter 6-digit MPIN" 
                            value={mpin}
                            onChange={handleMpinChange}
                            maxLength={6}
                            style={{ letterSpacing: '4px', textAlign: 'center' }}
                            required 
                        />
                    </div>

                    {error && (
                        <div className="validation-err" style={{ display: 'block', textAlign: 'center', marginTop: '10px' }}>
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="cta-btn primary-cta" 
                        disabled={loading}
                        style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
                    >
                        {loading ? 'Processing...' : (isRegister ? 'Set MPIN & Register' : 'Login & View Orders')}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>
                            {isRegister ? 'Already registered? ' : 'New customer? '}
                        </span>
                        <button 
                            type="button" 
                            onClick={toggleMode}
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: 'var(--primary)', 
                                fontWeight: '600', 
                                cursor: 'pointer', 
                                textDecoration: 'underline' 
                            }}
                        >
                            {isRegister ? 'Login here' : 'Register with MPIN'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
