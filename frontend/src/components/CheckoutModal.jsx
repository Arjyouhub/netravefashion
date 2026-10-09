import React, { useState, useEffect } from 'react';
import { ALL_INDIA_STATES, getDistrictsForState } from '../utils/indiaStatesDistricts';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function CheckoutModal({ 
    isOpen, 
    cart = [], 
    onClose, 
    onSubmitBooking, 
    user, 
    API_BASE_URL,
    settings,
    onRazorpaySuccess 
}) {
    // Stepper State: 1 = Customer Info, 2 = Address, 3 = Summary, 4 = Payment, 5 = Confirmation
    const [currentStep, setCurrentStep] = useState(1);

    // Step 1: Customer Information
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [email, setEmail] = useState('');
    const [sameAsPhone, setSameAsPhone] = useState(false);

    // Step 2: Delivery Address
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('Kerala');
    const [district, setDistrict] = useState('');
    const [pincode, setPincode] = useState('');

    // Step 3: Coupon & Summary
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);

    // Step 4: Payment & Processing
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [razorpayError, setRazorpayError] = useState('');
    const [showTestSimulator, setShowTestSimulator] = useState(false);
    const [simulatedMethod, setSimulatedMethod] = useState('UPI');

    // Step 5: Confirmation Record
    const [confirmedOrder, setConfirmedOrder] = useState(null);

    // Errors map
    const [errors, setErrors] = useState({});

    const cleanApiBase = (API_BASE_URL || '').replace(/\/api$/, '');

    // Reset validations and prefill user on modal open
    useEffect(() => {
        if (!isOpen) return;
        setCurrentStep(1);
        setName(user?.name || '');
        setPhone(user?.phone || '');
        setWhatsapp(user?.whatsapp || user?.phone || '');
        setEmail(user?.email || '');
        setAddress(user?.address || '');
        setCity(user?.city || '');
        setState(user?.state && ALL_INDIA_STATES.includes(user.state) ? user.state : 'Kerala');
        setDistrict(user?.district || '');
        setPincode(user?.pincode || '');
        setSameAsPhone(user?.whatsapp === user?.phone || !user?.whatsapp);
        setErrors({});
        setCouponCode('');
        setAppliedCoupon(null);
        setCouponError('');
        setRazorpayError('');
        setIsProcessingPayment(false);
        setShowTestSimulator(false);
        setConfirmedOrder(null);
    }, [isOpen, user]);

    // Handle same as phone copy toggle
    const handleSameAsPhoneToggle = (checked) => {
        setSameAsPhone(checked);
        if (checked) {
            setWhatsapp(phone);
            if (errors.whatsapp) setErrors(prev => ({ ...prev, whatsapp: '' }));
        }
    };

    useEffect(() => {
        if (sameAsPhone) {
            setWhatsapp(phone);
        }
    }, [phone, sameAsPhone]);

    if (!isOpen) return null;

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * item.quantity), 0);
    let discountAmount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.discountType === 'percentage') {
            discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
        } else {
            discountAmount = appliedCoupon.discountValue;
        }
    }
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const delivery = subtotalAfterDiscount >= 999 ? 0 : 60;
    const total = subtotalAfterDiscount + delivery;

    // Validation for Step 1
    const validateStep1 = () => {
        const errs = {};
        if (!name.trim()) errs.name = 'Full name is required.';
        if (/\d/.test(name)) errs.name = 'Name cannot contain numbers.';
        if (!/^[0-9]{10}$/.test(phone)) errs.phone = 'Enter valid 10-digit mobile number.';
        if (!/^[0-9]{10}$/.test(whatsapp)) errs.whatsapp = 'Enter valid 10-digit WhatsApp number.';
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errs.email = 'Valid email address is required (e.g. name@example.com).';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Validation for Step 2
    const validateStep2 = () => {
        const errs = {};
        if (!address.trim()) errs.address = 'House/Street address is required.';
        if (!city.trim()) errs.city = 'City / Town is required.';
        if (!state) errs.state = 'Select delivery state.';
        if (!district) errs.district = 'Select delivery district.';
        if (!/^[0-9]{6}$/.test(pincode)) errs.pincode = 'Enter valid 6-digit postal pincode.';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleApplyCoupon = async () => {
        setCouponError('');
        if (!couponCode.trim()) return;
        setCouponLoading(true);

        try {
            const response = await fetch(`${cleanApiBase}/api/coupons/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode.trim(), subtotal })
            });
            const data = await response.json();
            if (response.ok && data.valid) {
                setAppliedCoupon(data);
                setCouponCode('');
            } else {
                setCouponError(data.error || 'Invalid or expired coupon code.');
            }
        } catch (err) {
            setCouponError('Network error validating coupon.');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    // Completes payment verification and booking creation on backend
    const executePaymentSuccess = async (paymentDetails) => {
        setIsProcessingPayment(true);
        setRazorpayError('');

        try {
            const verifyRes = await fetch(`${cleanApiBase}/api/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpay_order_id: paymentDetails.order_id,
                    razorpay_payment_id: paymentDetails.payment_id,
                    razorpay_signature: paymentDetails.signature,
                    order_id: paymentDetails.order_id,
                    payment_id: paymentDetails.payment_id,
                    signature: paymentDetails.signature,
                    customer: {
                        name: name.trim(),
                        phone: phone.trim(),
                        whatsapp: whatsapp.trim(),
                        email: email.trim(),
                        address: address.trim(),
                        city: city.trim(),
                        state: state.trim(),
                        district: district.trim(),
                        pincode: pincode.trim(),
                        payment: 'Razorpay Online'
                    },
                    items: cart,
                    subtotal: subtotalAfterDiscount,
                    delivery,
                    total,
                    couponCode: appliedCoupon ? appliedCoupon.code : undefined,
                    discount: discountAmount
                })
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success !== false) {
                setConfirmedOrder(verifyData);
                setCurrentStep(5); // Go to Order Confirmation step
                if (onRazorpaySuccess) {
                    onRazorpaySuccess(verifyData);
                } else if (onSubmitBooking) {
                    onSubmitBooking(verifyData);
                }
            } else {
                setRazorpayError(verifyData.error || 'Payment verification failed on server.');
            }
        } catch (err) {
            console.error('Payment verification error:', err);
            setRazorpayError('Network error verifying payment.');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // Initiate Razorpay checkout flow
    const handleInitiateRazorpay = async () => {
        setIsProcessingPayment(true);
        setRazorpayError('');

        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                setRazorpayError('Razorpay checkout SDK failed to load. Please check your internet connection.');
                setIsProcessingPayment(false);
                return;
            }

            // Amount in paise (minimum 100 paise = 1 INR)
            const amountInPaise = Math.max(100, Math.round(Number(total) * 100));

            const orderRes = await fetch(`${cleanApiBase}/api/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    amount: amountInPaise, 
                    currency: 'INR', 
                    receipt: `rcpt_${Date.now()}` 
                })
            });

            if (!orderRes.ok) {
                const errData = await orderRes.json().catch(() => ({}));
                setRazorpayError(errData.error || 'Failed to initialize Razorpay order on server.');
                setIsProcessingPayment(false);
                return;
            }

            const orderData = await orderRes.json();

            const razorpayKey = orderData.key_id || orderData.keyId || (settings && settings.razorpayKeyId) || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TlpkVGUFJvf2lv';
            const razorpayOrderId = orderData.order_id || orderData.id;

            if (!window.Razorpay) {
                setRazorpayError('Razorpay SDK is not available in browser window.');
                setIsProcessingPayment(false);
                return;
            }

            const options = {
                key: razorpayKey,
                amount: orderData.amount || amountInPaise,
                currency: orderData.currency || 'INR',
                name: 'NETRAVE Fashion Store',
                description: `Payment for ${cart.length} item(s)`,
                image: '/assets/logo.png',
                order_id: razorpayOrderId,
                prefill: {
                    name: name.trim(),
                    contact: phone.trim(),
                    email: email.trim()
                },
                theme: { color: '#f59e0b' },
                handler: function (response) {
                    executePaymentSuccess({
                        order_id: response.razorpay_order_id,
                        payment_id: response.razorpay_payment_id,
                        signature: response.razorpay_signature
                    });
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessingPayment(false);
                        setRazorpayError('Payment was cancelled by user.');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setRazorpayError(`Payment failed: ${response.error?.description || 'Payment unsuccessful'}`);
                setIsProcessingPayment(false);
            });
            rzp.open();
        } catch (err) {
            console.error('Razorpay initialization error:', err);
            setRazorpayError('Failed to launch Razorpay checkout modal: ' + err.message);
            setIsProcessingPayment(false);
        }
    };

    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }} style={{ zIndex: 1100 }}>
            <div className="modal-content checkout-modal-content" style={{
                maxWidth: '680px',
                width: '100%',
                background: 'linear-gradient(180deg, #111422 0%, #090b10 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                padding: '28px',
                position: 'relative',
                maxHeight: '94vh',
                overflowY: 'auto'
            }}>
                {/* Close Button */}
                <button className="close-btn modal-close" onClick={onClose} aria-label="Close Modal">&times;</button>

                {/* Stepper Progress Bar */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                        {[
                            { step: 1, label: 'Customer' },
                            { step: 2, label: 'Address' },
                            { step: 3, label: 'Summary' },
                            { step: 4, label: 'Payment' },
                            { step: 5, label: 'Confirmed' }
                        ].map((s) => (
                            <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: currentStep >= s.step ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#1a1f30',
                                    color: currentStep >= s.step ? '#000' : '#94a3b8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '900',
                                    fontSize: '13px',
                                    border: currentStep === s.step ? '2px solid #fff' : 'none',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {currentStep > s.step ? '✓' : s.step}
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: currentStep >= s.step ? '#fff' : '#64748b', marginTop: '4px' }}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* STEP 1: CUSTOMER INFORMATION */}
                {/* ========================================================================= */}
                {currentStep === 1 && (
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '0 0 6px' }}>
                            Step 1: Customer Contact Information
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>
                            Enter your contact details for order notifications and dispatch tracking updates.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={labelStyle}>Full Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Rahul Varma"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
                                    style={inputStyle}
                                />
                                {errors.name && <span style={errorStyle}>{errors.name}</span>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>Calling Phone Number (10 Digits) *</label>
                                    <input
                                        type="tel"
                                        maxLength="10"
                                        placeholder="e.g. 9847123456"
                                        value={phone}
                                        onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setErrors(prev => ({ ...prev, phone: '' })); }}
                                        style={inputStyle}
                                    />
                                    {errors.phone && <span style={errorStyle}>{errors.phone}</span>}
                                </div>
                                <div>
                                    <label style={labelStyle}>WhatsApp Number *</label>
                                    <input
                                        type="tel"
                                        maxLength="10"
                                        placeholder="e.g. 9847123456"
                                        value={whatsapp}
                                        onChange={(e) => { setWhatsapp(e.target.value.replace(/\D/g, '')); setErrors(prev => ({ ...prev, whatsapp: '' })); }}
                                        disabled={sameAsPhone}
                                        style={{ ...inputStyle, opacity: sameAsPhone ? 0.7 : 1 }}
                                    />
                                    {errors.whatsapp && <span style={errorStyle}>{errors.whatsapp}</span>}
                                </div>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={sameAsPhone}
                                    onChange={(e) => handleSameAsPhoneToggle(e.target.checked)}
                                    style={{ accentColor: 'var(--primary)' }}
                                />
                                WhatsApp number is the same as calling number
                            </label>

                            <div>
                                <label style={labelStyle}>Email Address (For Tax Invoice & Tracking) *</label>
                                <input
                                    type="email"
                                    placeholder="e.g. rahul@example.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                                    style={inputStyle}
                                />
                                {errors.email && <span style={errorStyle}>{errors.email}</span>}
                            </div>

                            <button
                                type="button"
                                className="cta-btn primary-cta"
                                onClick={() => {
                                    if (validateStep1()) setCurrentStep(2);
                                }}
                                style={{ marginTop: '10px', padding: '12px', borderRadius: '10px', fontWeight: '800' }}
                            >
                                Continue to Delivery Address →
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 2: DELIVERY ADDRESS */}
                {/* ========================================================================= */}
                {currentStep === 2 && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                            >
                                ← Back
                            </button>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>
                                Step 2: Delivery Address
                            </h2>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>
                            Provide exact doorstep delivery destination for courier dispatch.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={labelStyle}>Complete Street Address / House Name / Flat *</label>
                                <textarea
                                    rows="2"
                                    placeholder="House Name/No., Street, Landmark..."
                                    value={address}
                                    onChange={(e) => { setAddress(e.target.value); setErrors(prev => ({ ...prev, address: '' })); }}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                                {errors.address && <span style={errorStyle}>{errors.address}</span>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>City / Town *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Kozhikode"
                                        value={city}
                                        onChange={(e) => { setCity(e.target.value); setErrors(prev => ({ ...prev, city: '' })); }}
                                        style={inputStyle}
                                    />
                                    {errors.city && <span style={errorStyle}>{errors.city}</span>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Postal Pincode (6 Digits) *</label>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        placeholder="e.g. 673001"
                                        value={pincode}
                                        onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '')); setErrors(prev => ({ ...prev, pincode: '' })); }}
                                        style={inputStyle}
                                    />
                                    {errors.pincode && <span style={errorStyle}>{errors.pincode}</span>}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>State *</label>
                                    <select
                                        value={state}
                                        onChange={(e) => { setState(e.target.value); setDistrict(''); }}
                                        style={inputStyle}
                                    >
                                        {ALL_INDIA_STATES.map(st => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                    {errors.state && <span style={errorStyle}>{errors.state}</span>}
                                </div>
                                <div>
                                    <label style={labelStyle}>District *</label>
                                    <select
                                        value={district}
                                        onChange={(e) => { setDistrict(e.target.value); setErrors(prev => ({ ...prev, district: '' })); }}
                                        style={inputStyle}
                                    >
                                        <option value="">Select District</option>
                                        {getDistrictsForState(state).map(dist => (
                                            <option key={dist} value={dist}>{dist}</option>
                                        ))}
                                    </select>
                                    {errors.district && <span style={errorStyle}>{errors.district}</span>}
                                </div>
                            </div>

                            <button
                                type="button"
                                className="cta-btn primary-cta"
                                onClick={() => {
                                    if (validateStep2()) setCurrentStep(3);
                                }}
                                style={{ marginTop: '10px', padding: '12px', borderRadius: '10px', fontWeight: '800' }}
                            >
                                Review Order Summary →
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 3: ORDER SUMMARY */}
                {/* ========================================================================= */}
                {currentStep === 3 && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                            >
                                ← Back
                            </button>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>
                                Step 3: Order Summary & Review
                            </h2>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px' }}>
                            Please review the ordered products, delivery address, and pricing details.
                        </p>

                        {/* Order Items Review */}
                        <div style={{ background: '#0e121e', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '12px', marginBottom: '16px', maxHeight: '180px', overflowY: 'auto' }}>
                            {cart.map((it, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: idx < cart.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                                    <img src={it.image} alt={it.title} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                            Qty: {it.quantity} • {it.size ? `Size: ${it.size}` : ''} {it.color ? `• Color: ${it.color}` : ''}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>
                                        ₹{it.price * it.quantity}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Delivery Address Snapshot */}
                        <div style={{ background: '#090b10', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', marginBottom: '16px', fontSize: '12px' }}>
                            <div style={{ color: 'var(--primary)', fontWeight: '700', marginBottom: '4px' }}>
                                📍 Delivering to: {name} ({phone})
                            </div>
                            <div style={{ color: '#cbd5e1' }}>
                                {address}, {city}, {district}, {state} - {pincode}
                            </div>
                        </div>

                        {/* Coupon Section */}
                        <div style={{ marginBottom: '16px' }}>
                            {appliedCoupon ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '8px 12px', borderRadius: '8px', color: '#10b981', fontSize: '12.5px', fontWeight: '700' }}>
                                    <span>Coupon <strong>{appliedCoupon.code}</strong> Applied (-₹{discountAmount})</span>
                                    <button type="button" onClick={handleRemoveCoupon} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}>
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter coupon code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        style={{ ...inputStyle, textTransform: 'uppercase' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyCoupon}
                                        disabled={couponLoading || !couponCode.trim()}
                                        style={{ background: 'var(--primary)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: '800', padding: '8px 16px', cursor: 'pointer' }}
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}
                            {couponError && <span style={errorStyle}>{couponError}</span>}
                        </div>

                        {/* Price Breakdown */}
                        <div style={{ background: '#0e121e', borderRadius: '12px', padding: '14px', marginBottom: '18px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                                <span>Cart Subtotal</span>
                                <span>₹{subtotal}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: '700' }}>
                                    <span>Coupon Savings</span>
                                    <span>-₹{discountAmount}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                                <span>Express Delivery</span>
                                <span>{delivery === 0 ? <strong style={{ color: '#10b981' }}>FREE</strong> : `₹${delivery}`}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '16px', fontWeight: '900', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <span>Grand Total</span>
                                <span style={{ color: 'var(--primary)' }}>₹{total}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="cta-btn primary-cta"
                            onClick={() => setCurrentStep(4)}
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '800' }}
                        >
                            Proceed to Payment →
                        </button>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 4: PAYMENT */}
                {/* ========================================================================= */}
                {currentStep === 4 && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <button
                                type="button"
                                onClick={() => setCurrentStep(3)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                            >
                                ← Back
                            </button>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>
                                Step 4: Secure Payment Gateway
                            </h2>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>
                            Amount to Pay: <strong style={{ color: 'var(--primary)', fontSize: '16px' }}>₹{total}</strong>
                        </p>

                        {/* Razorpay Online Gateway Card */}
                        <div style={{
                            background: '#0e121e',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '14px',
                            padding: '16px',
                            marginBottom: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '24px' }}>⚡</span>
                                    <div>
                                        <div style={{ fontWeight: '800', color: '#fff', fontSize: '14px' }}>
                                            Razorpay Express Online Checkout
                                        </div>
                                        <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                                            UPI (GPay / PhonePe / Paytm), Debit/Credit Cards, Net Banking
                                        </div>
                                    </div>
                                </div>
                                <span style={{ background: '#10b981', color: '#000', fontSize: '10px', fontWeight: '900', padding: '2px 6px', borderRadius: '4px' }}>
                                    100% SECURE
                                </span>
                            </div>

                            <button
                                type="button"
                                className="cta-btn primary-cta"
                                onClick={handleInitiateRazorpay}
                                disabled={isProcessingPayment}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    fontWeight: '800',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isProcessingPayment ? 'Connecting Payment Gateway...' : `Pay ₹${total} via Razorpay`}
                            </button>
                        </div>

                        {/* Test Payment Simulator (for Sandbox Testing) */}
                        <div style={{
                            background: '#090b10',
                            border: '1px dashed rgba(255, 255, 255, 0.15)',
                            borderRadius: '12px',
                            padding: '14px',
                            marginBottom: '16px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1' }}>
                                    🧪 Sandbox Test Payment Simulator
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowTestSimulator(!showTestSimulator)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    {showTestSimulator ? 'Hide' : 'Simulate Test Payment'}
                                </button>
                            </div>

                            {showTestSimulator && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {['UPI', 'Card', 'NetBanking'].map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setSimulatedMethod(m)}
                                                style={{
                                                    background: simulatedMethod === m ? 'var(--primary)' : '#141828',
                                                    color: simulatedMethod === m ? '#000' : '#fff',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '6px 12px',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            executePaymentSuccess({
                                                order_id: `sim_order_${Date.now()}`,
                                                payment_id: `sim_pay_${Date.now()}`,
                                                signature: 'simulated_success'
                                            });
                                        }}
                                        disabled={isProcessingPayment}
                                        style={{
                                            background: '#10b981',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#000',
                                            fontWeight: '800',
                                            padding: '10px',
                                            fontSize: '12.5px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ✓ Complete Test Payment ({simulatedMethod})
                                    </button>
                                </div>
                            )}
                        </div>

                        {razorpayError && (
                            <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: '700', marginBottom: '10px' }}>
                                ⚠️ {razorpayError}
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 5: ORDER CONFIRMATION */}
                {/* ========================================================================= */}
                {currentStep === 5 && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎉</div>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', margin: '0 0 6px' }}>
                            Order Placed Successfully!
                        </h2>
                        <p style={{ color: '#cbd5e1', fontSize: '13.5px', margin: '0 0 20px' }}>
                            Thank you, <strong>{name}</strong>! Your order has been registered and is being prepared for express dispatch.
                        </p>

                        {confirmedOrder && (
                            <div style={{
                                background: '#0e121e',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '14px',
                                padding: '16px',
                                maxWidth: '420px',
                                margin: '0 auto 24px',
                                textAlign: 'left',
                                fontSize: '13px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Order ID:</span>
                                    <strong style={{ color: 'var(--primary)' }}>{confirmedOrder.orderId}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Amount Paid:</span>
                                    <strong style={{ color: '#fff' }}>₹{confirmedOrder.total}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Courier Partner:</span>
                                    <strong style={{ color: '#fff' }}>{confirmedOrder.courierPartner || 'Delhivery Express'}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>AWB Tracking:</span>
                                    <strong style={{ color: '#10b981' }}>{confirmedOrder.awbNumber || 'Assigned in 12h'}</strong>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                type="button"
                                className="cta-btn primary-cta"
                                onClick={onClose}
                                style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: '800' }}
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: '6px'
};

const inputStyle = {
    width: '100%',
    background: '#131826',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit'
};

const errorStyle = {
    color: '#ef4444',
    fontSize: '11px',
    fontWeight: '700',
    marginTop: '4px',
    display: 'block'
};
