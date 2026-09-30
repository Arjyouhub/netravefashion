import React, { useState, useEffect } from 'react';

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
    cart, 
    onClose, 
    onSubmitBooking, 
    user, 
    API_BASE_URL,
    settings,
    onRazorpaySuccess 
}) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [address, setAddress] = useState('');
    const [district, setDistrict] = useState('');
    const [pincode, setPincode] = useState('');
    const [payment, setPayment] = useState('Razorpay');
    const [termsCheck, setTermsCheck] = useState(false);
    const [sameAsPhone, setSameAsPhone] = useState(false);
    const [errors, setErrors] = useState({});
    const [validated, setValidated] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [razorpayError, setRazorpayError] = useState('');

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');

    // Reset validations and prefill user on modal load
    useEffect(() => {
        setName(user?.name || '');
        setPhone(user?.phone || '');
        setWhatsapp(user?.whatsapp || user?.phone || '');
        setAddress(user?.address || '');
        setDistrict(user?.district || '');
        setPincode(user?.pincode || '');
        setPayment('COD');
        setTermsCheck(false);
        setSameAsPhone(user?.whatsapp === user?.phone || !user?.whatsapp);
        setErrors({});
        setValidated(false);
        setCouponCode('');
        setAppliedCoupon(null);
        setCouponError('');
    }, [isOpen, user]);

    // Handle same as phone copy toggle
    const handleSameAsPhoneToggle = (checked) => {
        setSameAsPhone(checked);
        if (checked) {
            setWhatsapp(phone);
            if (errors.whatsapp) {
                setErrors(prev => ({ ...prev, whatsapp: '' }));
            }
        }
    };

    // Keep WhatsApp updated if SameAsPhone is checked
    useEffect(() => {
        if (sameAsPhone) {
            setWhatsapp(phone);
        }
    }, [phone, sameAsPhone]);

    const handleApplyCoupon = async () => {
        setCouponError('');
        if (!couponCode.trim()) return;

        try {
            const response = await fetch(`${API_BASE_URL}/coupons/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, subtotal })
            });
            const data = await response.json();
            if (response.ok && data.valid) {
                setAppliedCoupon(data);
            } else {
                setCouponError(data.error || 'Failed to validate coupon.');
            }
        } catch (err) {
            setCouponError('Network error validating coupon.');
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    if (!isOpen) return null;

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
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

    const validateForm = () => {
        const tempErrors = {};
        if (!name.trim()) tempErrors.name = 'Please enter your name.';
        
        if (!/^[0-9]{10}$/.test(phone)) {
            tempErrors.phone = 'Enter a valid 10-digit mobile number.';
        }
        
        if (!/^[0-9]{10}$/.test(whatsapp)) {
            tempErrors.whatsapp = 'Enter a valid 10-digit WhatsApp number.';
        }
        
        if (!address.trim()) tempErrors.address = 'Please enter your complete address.';
        if (!district) tempErrors.district = 'Please select a district.';
        
        if (!/^[0-9]{6}$/.test(pincode)) {
            tempErrors.pincode = 'Enter a valid 6-digit Pincode.';
        }
        
        if (!termsCheck) tempErrors.terms = 'You must agree to the terms.';

        setErrors(tempErrors);
        return {
            isValid: Object.keys(tempErrors).length === 0,
            errorsMap: tempErrors
        };
    };

    const handleRazorpayPayment = async (e) => {
        if (e) e.preventDefault();
        setValidated(true);
        setRazorpayError('');

        const { isValid, errorsMap } = validateForm();
        if (!isValid) {
            const firstErrorKey = Object.keys(errorsMap)[0];
            let elementId = '';
            if (firstErrorKey === 'name') elementId = 'custName';
            else if (firstErrorKey === 'phone') elementId = 'custPhone';
            else if (firstErrorKey === 'whatsapp') elementId = 'custWhatsApp';
            else if (firstErrorKey === 'address') elementId = 'custAddress';
            else if (firstErrorKey === 'district') elementId = 'custDistrict';
            else if (firstErrorKey === 'pincode') elementId = 'custPincode';
            else if (firstErrorKey === 'terms') elementId = 'termsCheck';

            if (elementId) {
                const element = document.getElementById(elementId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => element.focus({ preventScroll: true }), 300);
                }
            }
            return;
        }

        setIsProcessingPayment(true);
        try {
            const isScriptLoaded = await loadRazorpayScript();
            if (!isScriptLoaded) {
                setRazorpayError('Could not load Razorpay SDK. Please verify your connection.');
                setIsProcessingPayment(false);
                return;
            }

            // 1. Create order on backend
            const orderRes = await fetch(`${API_BASE_URL}/razorpay/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: total,
                    receipt: `netrave_${Date.now()}`
                })
            });

            if (!orderRes.ok) {
                const errData = await orderRes.json();
                setRazorpayError(errData.error || 'Failed to initiate Razorpay order.');
                setIsProcessingPayment(false);
                return;
            }

            const orderData = await orderRes.json();

            // 2. Open Razorpay Checkout modal
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency || 'INR',
                name: 'NETRAVE Fashion Store',
                description: `Order checkout for ${cart.length} item(s)`,
                order_id: orderData.isMock ? undefined : orderData.id,
                prefill: {
                    name: name,
                    contact: phone,
                    email: user?.email || ''
                },
                theme: {
                    color: '#f59e0b'
                },
                handler: async function (response) {
                    setIsProcessingPayment(true);
                    try {
                        const verifyRes = await fetch(`${API_BASE_URL}/razorpay/verify-payment`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id || orderData.id,
                                razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                                razorpay_signature: response.razorpay_signature || 'simulated_sig',
                                customer: {
                                    name,
                                    phone,
                                    whatsapp,
                                    address,
                                    district,
                                    pincode,
                                    payment: 'Razorpay Online'
                                },
                                items: cart,
                                subtotal,
                                delivery,
                                total,
                                couponCode: appliedCoupon ? appliedCoupon.code : undefined,
                                discount: discountAmount
                            })
                        });

                        if (verifyRes.ok) {
                            const confirmedBooking = await verifyRes.json();
                            if (onRazorpaySuccess) {
                                onRazorpaySuccess(confirmedBooking);
                            } else {
                                onSubmitBooking({
                                    name,
                                    phone,
                                    whatsapp,
                                    address,
                                    district,
                                    pincode,
                                    payment: 'Razorpay Online',
                                    couponCode: appliedCoupon ? appliedCoupon.code : undefined,
                                    discount: discountAmount
                                });
                            }
                        } else {
                            const errData = await verifyRes.json();
                            setRazorpayError(errData.error || 'Payment verification failed.');
                        }
                    } catch (verifyErr) {
                        console.error('Payment verification error:', verifyErr);
                        setRazorpayError('Network error while verifying payment.');
                    } finally {
                        setIsProcessingPayment(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessingPayment(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                console.error('Payment failed:', response.error);
                setRazorpayError(`Payment failed: ${response.error.description || 'Transaction unsuccessful'}`);
                setIsProcessingPayment(false);
            });
            rzp.open();
        } catch (err) {
            console.error('Razorpay launch error:', err);
            setRazorpayError('Could not launch payment gateway. Please try again.');
            setIsProcessingPayment(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (payment === 'Razorpay') {
            handleRazorpayPayment(e);
            return;
        }

        setValidated(true);

        const { isValid, errorsMap } = validateForm();

        if (isValid) {
            onSubmitBooking({
                name,
                phone,
                whatsapp,
                address,
                district,
                pincode,
                payment,
                couponCode: appliedCoupon ? appliedCoupon.code : undefined,
                discount: discountAmount
            });
        } else {
            // Scroll to the first error element
            const firstErrorKey = Object.keys(errorsMap)[0];
            let elementId = '';
            if (firstErrorKey === 'name') elementId = 'custName';
            else if (firstErrorKey === 'phone') elementId = 'custPhone';
            else if (firstErrorKey === 'whatsapp') elementId = 'custWhatsApp';
            else if (firstErrorKey === 'address') elementId = 'custAddress';
            else if (firstErrorKey === 'district') elementId = 'custDistrict';
            else if (firstErrorKey === 'pincode') elementId = 'custPincode';
            else if (firstErrorKey === 'terms') elementId = 'termsCheck';

            if (elementId) {
                const element = document.getElementById(elementId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        element.focus({ preventScroll: true });
                    }, 300);
                }
            }
        }
    };

    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }}>
            <div className="modal-content checkout-modal-content" style={{ overflowY: 'auto', maxHeight: '90vh' }}>
                <button className="close-btn modal-close" onClick={onClose}>&times;</button>
                
                <div className="checkout-grid">
                    {/* Left: Booking Form */}
                    <div className="checkout-form-container">
                        <h2 className="form-title">Delivery & Booking Details</h2>
                        <p className="form-subtitle">Complete your shipping information to place your order.</p>

                        <form onSubmit={payment === 'Razorpay' ? handleRazorpayPayment : handleSubmit} className={`booking-form ${validated ? 'was-validated' : ''}`} noValidate>
                            <div className="form-group">
                                <label htmlFor="custName">Full Name *</label>
                                <input 
                                    type="text" 
                                    id="custName" 
                                    placeholder="Enter your full name" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required 
                                />
                                {errors.name && <span className="validation-err">{errors.name}</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="custPhone">Mobile Number (Calling) *</label>
                                    <input 
                                        type="tel" 
                                        id="custPhone" 
                                        placeholder="10-digit mobile number" 
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required 
                                    />
                                    {errors.phone && <span className="validation-err">{errors.phone}</span>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="custWhatsApp">WhatsApp Number *</label>
                                    <input 
                                        type="tel" 
                                        id="custWhatsApp" 
                                        placeholder="10-digit WhatsApp number" 
                                        value={whatsapp}
                                        onChange={(e) => setWhatsapp(e.target.value)}
                                        readOnly={sameAsPhone}
                                        required 
                                    />
                                    {errors.whatsapp && <span className="validation-err">{errors.whatsapp}</span>}
                                    <div className="same-as-checkbox">
                                        <input 
                                            type="checkbox" 
                                            id="sameAsPhone" 
                                            checked={sameAsPhone}
                                            onChange={(e) => handleSameAsPhoneToggle(e.target.checked)}
                                        />
                                        <label htmlFor="sameAsPhone">Same as Mobile Number</label>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="custAddress">Delivery Address *</label>
                                <textarea 
                                    id="custAddress" 
                                    rows="3" 
                                    placeholder="House name, street, local landmark, town/village" 
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                />
                                {errors.address && <span className="validation-err">{errors.address}</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="custDistrict">District *</label>
                                    <select 
                                        id="custDistrict" 
                                        value={district}
                                        onChange={(e) => setDistrict(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Select District</option>
                                        <option value="Kasaragod">Kasaragod</option>
                                        <option value="Kannur">Kannur</option>
                                        <option value="Wayanad">Wayanad</option>
                                        <option value="Kozhikode">Kozhikode</option>
                                        <option value="Malappuram">Malappuram</option>
                                        <option value="Palakkad">Palakkad</option>
                                        <option value="Thrissur">Thrissur</option>
                                        <option value="Ernakulam">Ernakulam</option>
                                        <option value="Idukki">Idukki</option>
                                        <option value="Kottayam">Kottayam</option>
                                        <option value="Alappuzha">Alappuzha</option>
                                        <option value="Pathanamthitta">Pathanamthitta</option>
                                        <option value="Kollam">Kollam</option>
                                        <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                                    </select>
                                    {errors.district && <span className="validation-err">{errors.district}</span>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="custPincode">Pincode *</label>
                                    <input 
                                        type="text" 
                                        id="custPincode" 
                                        placeholder="6-digit pincode" 
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value)}
                                        required 
                                    />
                                    {errors.pincode && <span className="validation-err">{errors.pincode}</span>}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Payment Method *</label>
                                <div className="payment-options">
                                    <label className={`payment-card ${payment === 'Razorpay' ? 'active' : ''}`} style={{ border: payment === 'Razorpay' ? '1.5px solid #0284c7' : '1px solid var(--border-color)', background: payment === 'Razorpay' ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-surface)' }}>
                                        <input 
                                            type="radio" 
                                            name="paymentMethod" 
                                            value="Razorpay" 
                                            checked={payment === 'Razorpay'}
                                            onChange={() => setPayment('Razorpay')}
                                        />
                                        <span className="payment-card-content">
                                            <span className="method-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
                                                    ⚡ Razorpay Online Payment
                                                </span>
                                                <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                                                    UPI • GPay • Cards • NetBanking
                                                </span>
                                            </span>
                                            <span className="method-desc">Instant online payment with official receipt & zero COD fees.</span>
                                        </span>
                                    </label>
                                    <label className={`payment-card ${payment === 'COD' ? 'active' : ''}`}>
                                        <input 
                                            type="radio" 
                                            name="paymentMethod" 
                                            value="COD" 
                                            checked={payment === 'COD'}
                                            onChange={() => setPayment('COD')}
                                        />
                                        <span className="payment-card-content">
                                            <span className="method-title">Cash on Delivery (COD)</span>
                                            <span className="method-desc">Pay cash when you receive the product.</span>
                                        </span>
                                    </label>
                                    <label className={`payment-card ${payment === 'UPI' ? 'active' : ''}`}>
                                        <input 
                                            type="radio" 
                                            name="paymentMethod" 
                                            value="UPI" 
                                            checked={payment === 'UPI'}
                                            onChange={() => setPayment('UPI')}
                                        />
                                        <span className="payment-card-content">
                                            <span className="method-title">UPI Booking Confirmation</span>
                                            <span className="method-desc">Pay via GPay/PhonePe upon order approval on WhatsApp.</span>
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="terms-check">
                                <input 
                                    type="checkbox" 
                                    id="termsCheck" 
                                    checked={termsCheck}
                                    onChange={(e) => setTermsCheck(e.target.checked)}
                                    required 
                                />
                                <label htmlFor="termsCheck">I agree that this is a confirmed order. Delivery details and updates will be sent via WhatsApp.</label>
                                {errors.terms && <span className="validation-err" style={{ display: 'block' }}>{errors.terms}</span>}
                            </div>
                        </form>
                    </div>

                    {/* Right: Checkout Sidebar */}
                    <div className="checkout-sidebar">
                        <h3 className="sidebar-title">Order Summary</h3>
                        
                        <div className="checkout-items-list">
                            {cart.map((item, idx) => (
                                <div className="checkout-item-row" key={`${item.id}-${item.size}-${idx}`}>
                                    <div className="checkout-item-title-box">
                                        <span className="checkout-item-name">{item.title}</span>
                                        <span className="checkout-item-details">Size: {item.size} | Qty: {item.quantity}</span>
                                    </div>
                                    <span className="checkout-item-price-box">₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>

                        {/* Coupon Code Section */}
                        <div className="coupon-section">
                            <label className="coupon-label">Have a Coupon Code?</label>
                            <div className="coupon-input-group">
                                <input 
                                    type="text" 
                                    placeholder="ENTER CODE" 
                                    value={couponCode} 
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    className="coupon-input"
                                    disabled={appliedCoupon !== null}
                                />
                                {appliedCoupon ? (
                                    <button 
                                        type="button" 
                                        className="cta-btn secondary-cta coupon-btn" 
                                        onClick={handleRemoveCoupon}
                                    >
                                        Remove
                                    </button>
                                ) : (
                                    <button 
                                        type="button" 
                                        className="cta-btn primary-cta coupon-btn" 
                                        onClick={handleApplyCoupon}
                                    >
                                        Apply
                                    </button>
                                )}
                            </div>
                            {couponError && <span className="validation-err" style={{ display: 'block', marginTop: '6px' }}>{couponError}</span>}
                            {appliedCoupon && (
                                <span style={{ display: 'block', color: 'var(--primary)', fontSize: '12px', fontWeight: '600', marginTop: '6px' }}>
                                    🎉 Coupon Applied! Saved ₹{discountAmount}
                                </span>
                            )}
                        </div>

                        <div className="checkout-pricing">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="summary-row" style={{ color: 'var(--primary)' }}>
                                    <span>Discount</span>
                                    <span>-₹{discountAmount}</span>
                                </div>
                            )}
                            <div className="summary-row">
                                <span>Delivery</span>
                                <span className={delivery === 0 ? 'free-delivery' : ''}>
                                    {delivery === 0 ? 'FREE' : `₹${delivery}`}
                                </span>
                            </div>
                            <hr className="summary-divider" />
                            <div className="summary-row total-row">
                                <span>Grand Total</span>
                                <span>₹{total}</span>
                            </div>
                        </div>

                        {razorpayError && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', lineHeight: '1.4' }}>
                                ⚠️ {razorpayError}
                            </div>
                        )}

                        {payment === 'Razorpay' ? (
                            <button 
                                type="button" 
                                className="cta-btn primary-cta place-order-btn" 
                                onClick={handleRazorpayPayment}
                                disabled={isProcessingPayment}
                                style={{
                                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                    color: '#ffffff',
                                    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isProcessingPayment ? (
                                    <>
                                        <span className="spinner-border" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderRightColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }}></span>
                                        Connecting Razorpay...
                                    </>
                                ) : (
                                    <>
                                        <span>🔒 Pay with Razorpay • ₹{total}</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <button 
                                type="button" 
                                className="cta-btn primary-cta place-order-btn" 
                                onClick={handleSubmit}
                            >
                                Place Booking & WhatsApp Receipt
                            </button>
                        )}

                        <p className="whatsapp-disclaimer">
                            {payment === 'Razorpay' 
                                ? '🔒 100% Encrypted & Secure Razorpay checkout with instant confirmation.' 
                                : 'ℹ️ Placing booking opens WhatsApp to secure confirmation with the seller.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
