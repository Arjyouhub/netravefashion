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
    const [state, setState] = useState('Kerala');
    const [district, setDistrict] = useState('');
    const [pincode, setPincode] = useState('');
    const [termsCheck, setTermsCheck] = useState(false);
    const [sameAsPhone, setSameAsPhone] = useState(false);
    const [errors, setErrors] = useState({});
    const [validated, setValidated] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [razorpayError, setRazorpayError] = useState('');
    const [showTestSimulator, setShowTestSimulator] = useState(false);
    const [simulatedMethod, setSimulatedMethod] = useState('UPI');

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');

    // Reset validations and prefill user on modal load
    useEffect(() => {
        if (!isOpen) return;
        setName(user?.name || '');
        setPhone(user?.phone || '');
        setWhatsapp(user?.whatsapp || user?.phone || '');
        setAddress(user?.address || '');
        setState(user?.state && ALL_INDIA_STATES.includes(user.state) ? user.state : 'Kerala');
        setDistrict(user?.district || '');
        setPincode(user?.pincode || '');
        setTermsCheck(false);
        setSameAsPhone(user?.whatsapp === user?.phone || !user?.whatsapp);
        setErrors({});
        setValidated(false);
        setCouponCode('');
        setAppliedCoupon(null);
        setCouponError('');
        setRazorpayError('');
        setIsProcessingPayment(false);
        setShowTestSimulator(false);
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
                setCouponError(data.error || 'Invalid or expired coupon code.');
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

    const validateForm = () => {
        const tempErrors = {};
        if (!name.trim()) tempErrors.name = 'Please enter your full name.';
        
        if (!/^[0-9]{10}$/.test(phone)) {
            tempErrors.phone = 'Enter a valid 10-digit calling number.';
        }
        
        if (!/^[0-9]{10}$/.test(whatsapp)) {
            tempErrors.whatsapp = 'Enter a valid 10-digit WhatsApp number.';
        }
        
        if (!address.trim()) tempErrors.address = 'Please enter complete house name/street address.';
        if (!state) tempErrors.state = 'Please select your state.';
        if (!district) tempErrors.district = 'Please select your delivery district.';
        
        if (!/^[0-9]{6}$/.test(pincode)) {
            tempErrors.pincode = 'Enter a valid 6-digit postal pincode.';
        }
        
        if (!termsCheck) tempErrors.terms = 'Please accept order confirmation terms.';

        setErrors(tempErrors);
        return {
            isValid: Object.keys(tempErrors).length === 0,
            errorsMap: tempErrors
        };
    };

    // Completes test payment verification on backend
    const executePaymentSuccess = async (paymentDetails) => {
        setIsProcessingPayment(true);
        setRazorpayError('');

        try {
            const verifyRes = await fetch(`${API_BASE_URL}/razorpay/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpay_order_id: paymentDetails.order_id || `order_sim_${Date.now()}`,
                    razorpay_payment_id: paymentDetails.payment_id || `pay_test_${Date.now()}`,
                    razorpay_signature: paymentDetails.signature || 'simulated_test_signature',
                    customer: {
                        name: name.trim(),
                        phone: phone.trim(),
                        whatsapp: whatsapp.trim(),
                        address: address.trim(),
                        state: state.trim(),
                        district: district.trim(),
                        pincode: pincode.trim(),
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
                setShowTestSimulator(false);
                if (onRazorpaySuccess) {
                    onRazorpaySuccess(confirmedBooking);
                } else if (onSubmitBooking) {
                    onSubmitBooking({
                        name,
                        phone,
                        whatsapp,
                        address,
                        state,
                        district,
                        pincode,
                        payment: 'Razorpay Online',
                        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
                        discount: discountAmount
                    });
                }
            } else {
                const errData = await verifyRes.json();
                setRazorpayError(errData.error || 'Payment verification failed. Please try again.');
            }
        } catch (verifyErr) {
            console.error('Payment verification error:', verifyErr);
            setRazorpayError('Network error while recording verified payment.');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handleRazorpayPayment = async (e) => {
        if (e) e.preventDefault();
        setValidated(true);
        setRazorpayError('');

        const { isValid, errorsMap } = validateForm();
        if (!isValid) {
            const firstErrorKey = Object.keys(errorsMap)[0];
            const elementIdMap = {
                name: 'custName',
                phone: 'custPhone',
                whatsapp: 'custWhatsApp',
                address: 'custAddress',
                state: 'custState',
                district: 'custDistrict',
                pincode: 'custPincode',
                terms: 'termsCheck'
            };
            const elementId = elementIdMap[firstErrorKey];
            if (elementId) {
                const element = document.getElementById(elementId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => element.focus({ preventScroll: true }), 250);
                }
            }
            return;
        }

        setIsProcessingPayment(true);

        try {
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
                setRazorpayError(errData.error || 'Failed to initialize payment gateway.');
                setIsProcessingPayment(false);
                return;
            }

            const orderData = await orderRes.json();

            // When live Razorpay merchant credentials are not configured, directly open the Razorpay Test Gateway!
            // This prevents Razorpay's dead iframe error ("Oops! Something went wrong") on live domains
            const isPlaceholderKey = !orderData.keyId || 
                orderData.keyId.includes('1DP5mmOlF5G5ag') || 
                orderData.keyId.includes('placeholder') || 
                orderData.isMock || 
                !orderData.isLive;

            if (isPlaceholderKey) {
                setIsProcessingPayment(false);
                setShowTestSimulator(true);
                return;
            }

            // 2. Load Razorpay script
            const isScriptLoaded = await loadRazorpayScript();
            if (!isScriptLoaded || !window.Razorpay) {
                setIsProcessingPayment(false);
                setShowTestSimulator(true);
                return;
            }

            // 3. Open official Razorpay Checkout modal
            const options = {
                key: orderData.keyId || settings?.razorpayKeyId || 'rzp_test_TiZL1iB3f5bTHJ',
                amount: orderData.amount,
                currency: orderData.currency || 'INR',
                name: 'NETRAVE Fashion Store',
                description: `Checkout for ${cart.length} item(s) • Test Mode`,
                order_id: orderData.isMock ? undefined : orderData.id,
                prefill: {
                    name: name,
                    contact: phone,
                    email: user?.email || 'customer@netravefashion.com'
                },
                theme: {
                    color: '#f59e0b'
                },
                handler: async function (response) {
                    await executePaymentSuccess({
                        order_id: response.razorpay_order_id || orderData.id,
                        payment_id: response.razorpay_payment_id,
                        signature: response.razorpay_signature
                    });
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessingPayment(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                console.error('Razorpay payment failed:', response.error);
                setRazorpayError(`Payment unsuccessful: ${response.error?.description || 'Gateway error'}. You can try the 1-Click Test Simulator below.`);
                setIsProcessingPayment(false);
            });
            rzp.open();
        } catch (err) {
            console.error('Razorpay launch exception:', err);
            setIsProcessingPayment(false);
            // Open test simulator on error so testing is never blocked
            setShowTestSimulator(true);
        }
    };

    return (
        <div className="modal open checkout-modern-modal-overlay" onClick={(e) => { if (e.target.classList.contains('checkout-modern-modal-overlay')) onClose(); }}>
            <style>{`
                .checkout-modern-modal-overlay {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background: rgba(4, 5, 8, 0.88) !important;
                    backdrop-filter: blur(12px) !important;
                    z-index: 1050 !important;
                    padding: 16px !important;
                }
                .modern-checkout-card {
                    max-width: 1040px !important;
                    width: 100% !important;
                    background: rgba(11, 13, 18, 0.98) !important;
                    border: 1px solid rgba(245, 158, 11, 0.22) !important;
                    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.7), 0 0 35px rgba(245, 158, 11, 0.05) !important;
                    border-radius: 20px !important;
                    position: relative !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                    max-height: 92vh !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                .checkout-main-grid {
                    display: grid !important;
                    grid-template-columns: 1.25fr 1fr !important;
                    height: 100% !important;
                    overflow: hidden !important;
                }
                .checkout-left-form {
                    padding: 32px 36px !important;
                    overflow-y: auto !important;
                    max-height: 92vh !important;
                }
                .checkout-right-summary {
                    background: rgba(16, 18, 26, 0.95) !important;
                    border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
                    padding: 32px 30px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    overflow-y: auto !important;
                    max-height: 92vh !important;
                }
                .checkout-badge-pill {
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                    background: rgba(245, 158, 11, 0.1) !important;
                    border: 1px solid rgba(245, 158, 11, 0.3) !important;
                    color: #f59e0b !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    padding: 4px 10px !important;
                    border-radius: 20px !important;
                    letter-spacing: 0.5px !important;
                    text-transform: uppercase !important;
                    margin-bottom: 12px !important;
                }
                .checkout-section-box {
                    background: rgba(255, 255, 255, 0.02) !important;
                    border: 1px solid rgba(255, 255, 255, 0.06) !important;
                    border-radius: 14px !important;
                    padding: 18px 20px !important;
                    margin-bottom: 18px !important;
                }
                .checkout-section-heading {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    font-size: 13.5px !important;
                    font-weight: 700 !important;
                    color: #ffffff !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                    margin-bottom: 14px !important;
                }
                .modern-field-label {
                    display: block !important;
                    font-size: 11px !important;
                    font-weight: 600 !important;
                    color: #94a3b8 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.6px !important;
                    margin-bottom: 6px !important;
                }
                .modern-form-input, 
                .modern-form-select, 
                .modern-form-textarea {
                    width: 100% !important;
                    background: #12141c !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 10px !important;
                    padding: 11px 14px !important;
                    color: #ffffff !important;
                    font-size: 13.5px !important;
                    outline: none !important;
                    transition: all 0.25s ease !important;
                    box-sizing: border-box !important;
                    font-family: inherit !important;
                }
                .modern-form-input:focus, 
                .modern-form-select:focus, 
                .modern-form-textarea:focus {
                    border-color: #f59e0b !important;
                    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15) !important;
                    background: #151824 !important;
                }
                .razorpay-active-card {
                    background: linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(14, 165, 233, 0.03) 100%) !important;
                    border: 1.5px solid #0284c7 !important;
                    border-radius: 14px !important;
                    padding: 18px 20px !important;
                    box-shadow: 0 4px 18px rgba(2, 132, 199, 0.15) !important;
                }
                .razorpay-brand-row {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    flex-wrap: wrap !important;
                    gap: 10px !important;
                    margin-bottom: 10px !important;
                }
                .razorpay-test-banner {
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    background: rgba(245, 158, 11, 0.1) !important;
                    border: 1px dashed rgba(245, 158, 11, 0.4) !important;
                    padding: 8px 12px !important;
                    border-radius: 8px !important;
                    font-size: 12px !important;
                    color: #fde68a !important;
                    margin-top: 10px !important;
                    line-height: 1.4 !important;
                }
                .order-summary-item {
                    display: flex !important;
                    align-items: center !important;
                    gap: 12px !important;
                    padding: 10px 0 !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                }
                .summary-item-img {
                    width: 48px !important;
                    height: 48px !important;
                    border-radius: 8px !important;
                    object-fit: cover !important;
                    background: #1e2230 !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    flex-shrink: 0 !important;
                }
                .checkout-pay-btn {
                    width: 100% !important;
                    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
                    color: #ffffff !important;
                    border: none !important;
                    border-radius: 12px !important;
                    padding: 14px 20px !important;
                    font-size: 15px !important;
                    font-weight: 700 !important;
                    cursor: pointer !important;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    box-shadow: 0 4px 18px rgba(2, 132, 199, 0.35) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 10px !important;
                    margin-top: 16px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                }
                .checkout-pay-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important;
                    box-shadow: 0 6px 24px rgba(2, 132, 199, 0.5) !important;
                    transform: translateY(-1.5px) !important;
                }
                .checkout-pay-btn:disabled {
                    opacity: 0.6 !important;
                    cursor: not-allowed !important;
                }
                .test-simulator-btn {
                    width: 100% !important;
                    background: rgba(245, 158, 11, 0.1) !important;
                    border: 1px solid rgba(245, 158, 11, 0.3) !important;
                    color: #f59e0b !important;
                    font-size: 12.5px !important;
                    font-weight: 600 !important;
                    padding: 9px 14px !important;
                    border-radius: 8px !important;
                    cursor: pointer !important;
                    margin-top: 10px !important;
                    transition: all 0.2s ease !important;
                }
                .test-simulator-btn:hover {
                    background: rgba(245, 158, 11, 0.2) !important;
                    border-color: #f59e0b !important;
                }
                @media (max-width: 820px) {
                    .checkout-main-grid {
                        grid-template-columns: 1fr !important;
                        overflow-y: auto !important;
                    }
                    .modern-checkout-card {
                        max-height: 94vh !important;
                    }
                    .checkout-left-form, 
                    .checkout-right-summary {
                        max-height: none !important;
                        padding: 24px 20px !important;
                        border-left: none !important;
                    }
                    .checkout-right-summary {
                        border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
                    }
                }
            `}</style>

            <div className="modern-checkout-card" onClick={(e) => e.stopPropagation()}>
                <button className="auth-close-btn" onClick={onClose} aria-label="Close Checkout">&times;</button>

                <div className="checkout-main-grid">
                    {/* LEFT COLUMN: CUSTOMER & DELIVERY DETAILS */}
                    <div className="checkout-left-form">
                        <div className="checkout-badge-pill">
                            <span>🔒 256-Bit SSL Encrypted Checkout</span>
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px', color: '#ffffff', letterSpacing: '0.4px' }}>
                            Place Order
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px', lineHeight: '1.4' }}>
                            Provide your delivery details below to proceed to verified Razorpay payment.
                        </p>

                        <form onSubmit={handleRazorpayPayment} noValidate>
                            {/* SECTION 1: CONTACT DETAILS */}
                            <div className="checkout-section-box">
                                <div className="checkout-section-heading">
                                    <span>1. Contact Details</span>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Step 1 of 2</span>
                                </div>

                                <div style={{ marginBottom: '14px' }}>
                                    <label htmlFor="custName" className="modern-field-label">Full Name *</label>
                                    <input 
                                        type="text" 
                                        id="custName" 
                                        className="modern-form-input"
                                        placeholder="e.g. Rahul Sharma" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required 
                                    />
                                    {errors.name && <span className="validation-err">{errors.name}</span>}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                                    <div>
                                        <label htmlFor="custPhone" className="modern-field-label">Mobile Number (Calling) *</label>
                                        <input 
                                            type="tel" 
                                            id="custPhone" 
                                            className="modern-form-input"
                                            placeholder="10-digit number" 
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                                            maxLength={10}
                                            required 
                                        />
                                        {errors.phone && <span className="validation-err">{errors.phone}</span>}
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <label htmlFor="custWhatsApp" className="modern-field-label">WhatsApp Number *</label>
                                            <label style={{ fontSize: '11px', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={sameAsPhone}
                                                    onChange={(e) => handleSameAsPhoneToggle(e.target.checked)}
                                                    style={{ accentColor: '#f59e0b' }}
                                                />
                                                Same as Mobile
                                            </label>
                                        </div>
                                        <input 
                                            type="tel" 
                                            id="custWhatsApp" 
                                            className="modern-form-input"
                                            placeholder="10-digit WhatsApp number" 
                                            value={whatsapp}
                                            onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                                            readOnly={sameAsPhone}
                                            maxLength={10}
                                            required 
                                        />
                                        {errors.whatsapp && <span className="validation-err">{errors.whatsapp}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: SHIPPING ADDRESS */}
                            <div className="checkout-section-box">
                                <div className="checkout-section-heading">
                                    <span>2. Delivery Address</span>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Step 2 of 2</span>
                                </div>

                                <div style={{ marginBottom: '14px' }}>
                                    <label htmlFor="custAddress" className="modern-field-label">Street / House Address *</label>
                                    <textarea 
                                        id="custAddress" 
                                        className="modern-form-textarea"
                                        rows="2" 
                                        placeholder="House Name / Flat No., Street, Landmark, Town / City" 
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        required
                                    />
                                    {errors.address && <span className="validation-err">{errors.address}</span>}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                                    {/* STATE DROPDOWN (ALL INDIA) */}
                                    <div>
                                        <label htmlFor="custState" className="modern-field-label">State / UT (All India) *</label>
                                        <select 
                                            id="custState" 
                                            className="modern-form-select"
                                            value={state}
                                            onChange={(e) => {
                                                const newState = e.target.value;
                                                setState(newState);
                                                setDistrict('');
                                                if (errors.state) setErrors(prev => ({ ...prev, state: '' }));
                                            }}
                                            required
                                        >
                                            <option value="" disabled>Select State</option>
                                            {ALL_INDIA_STATES.map((st) => (
                                                <option key={st} value={st}>{st}</option>
                                            ))}
                                        </select>
                                        {errors.state && <span className="validation-err">{errors.state}</span>}
                                    </div>

                                    {/* DISTRICT DROPDOWN (DEPENDENT ON STATE) */}
                                    <div>
                                        <label htmlFor="custDistrict" className="modern-field-label">District *</label>
                                        <select 
                                            id="custDistrict" 
                                            className="modern-form-select"
                                            value={district}
                                            onChange={(e) => {
                                                setDistrict(e.target.value);
                                                if (errors.district) setErrors(prev => ({ ...prev, district: '' }));
                                            }}
                                            required
                                            disabled={!state}
                                        >
                                            <option value="" disabled>{state ? `Select District (${state})` : 'Select State First'}</option>
                                            {(getDistrictsForState(state) || []).map((dist) => (
                                                <option key={dist} value={dist}>{dist}</option>
                                            ))}
                                            <option value="Other District">Other District</option>
                                        </select>
                                        {errors.district && <span className="validation-err">{errors.district}</span>}
                                    </div>

                                    {/* PINCODE */}
                                    <div>
                                        <label htmlFor="custPincode" className="modern-field-label">Pincode *</label>
                                        <input 
                                            type="text" 
                                            id="custPincode" 
                                            className="modern-form-input"
                                            placeholder="6-digit pincode" 
                                            value={pincode}
                                            onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                            maxLength={6}
                                            required 
                                        />
                                        {errors.pincode && <span className="validation-err">{errors.pincode}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: PAYMENT METHOD (COD REMOVED - RAZORPAY TEST MODE ONLY) */}
                            <div className="checkout-section-box" style={{ borderColor: 'rgba(2, 132, 199, 0.3)' }}>
                                <div className="checkout-section-heading">
                                    <span>3. Payment Gateway</span>
                                    <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>ONLINE ONLY</span>
                                </div>

                                <div className="razorpay-active-card">
                                    <div className="razorpay-brand-row">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '16px' }}>⚡</span>
                                            <div>
                                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>Razorpay Online Payment</span>
                                                <div style={{ fontSize: '11px', color: '#38bdf8' }}>UPI • Google Pay • PhonePe • Cards • NetBanking</div>
                                            </div>
                                        </div>
                                        <span style={{ background: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '800' }}>
                                            ✓ VERIFIED GATEWAY
                                        </span>
                                    </div>

                                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                                        Instant automated payment confirmation. Your order receipt & tracking link will be sent to WhatsApp.
                                    </p>

                                    <div className="razorpay-test-banner">
                                        <span>🧪</span>
                                        <span>
                                            <strong>Test Mode Active:</strong> You can test payments safely with any test UPI ID (e.g. <code>success@razorpay</code>) or test cards. No real money will be charged.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* TERMS CHECKBOX */}
                            <div style={{ marginTop: '14px', marginBottom: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer', lineHeight: '1.4' }}>
                                    <input 
                                        type="checkbox" 
                                        id="termsCheck" 
                                        checked={termsCheck}
                                        onChange={(e) => setTermsCheck(e.target.checked)}
                                        style={{ accentColor: '#f59e0b', marginTop: '2px' }}
                                        required 
                                    />
                                    <span>I agree that this is a confirmed order. Order tracking updates and WhatsApp invoice will be sent to my mobile number.</span>
                                </label>
                                {errors.terms && <span className="validation-err">{errors.terms}</span>}
                            </div>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: ORDER SUMMARY SIDEBAR */}
                    <div className="checkout-right-summary">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                                Order Summary
                            </h3>
                            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '10px', color: '#cbd5e1' }}>
                                {cart.length} item{cart.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* ITEMS LIST */}
                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
                            {cart.map((item, idx) => (
                                <div className="order-summary-item" key={`${item.id}-${item.size}-${idx}`}>
                                    <img 
                                        src={item.image || '/assets/logo.png'} 
                                        alt={item.title} 
                                        className="summary-item-img"
                                        onError={(e) => { e.target.src = '/assets/logo.png'; }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.title}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', display: 'flex', gap: '8px' }}>
                                            <span>Size: <strong style={{ color: '#f59e0b' }}>{item.size || 'M'}</strong></span>
                                            <span>•</span>
                                            <span>Qty: <strong>{item.quantity}</strong></span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#ffffff' }}>
                                        ₹{item.price * item.quantity}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* COUPON INPUT */}
                        <div style={{ marginBottom: '18px' }}>
                            {appliedCoupon ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '8px 12px', borderRadius: '10px' }}>
                                    <div>
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#4ade80' }}>
                                            ✓ {appliedCoupon.code} applied!
                                        </span>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                            Saved ₹{discountAmount} on this order
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={handleRemoveCoupon}
                                        style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Enter Promo / Coupon Code" 
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            className="modern-form-input"
                                            style={{ textTransform: 'uppercase', fontSize: '12.5px', padding: '9px 12px' }}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleApplyCoupon}
                                            style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#f59e0b', borderRadius: '10px', padding: '0 16px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                    {couponError && <span className="validation-err" style={{ marginTop: '4px' }}>{couponError}</span>}
                                </div>
                            )}
                        </div>

                        {/* PRICE BREAKDOWN */}
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#cbd5e1', marginBottom: '8px' }}>
                                <span>Subtotal</span>
                                <span>₹{subtotal}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4ade80', marginBottom: '8px' }}>
                                    <span>Discount ({appliedCoupon?.code})</span>
                                    <span>-₹{discountAmount}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#cbd5e1', marginBottom: '10px' }}>
                                <span>Delivery Fee</span>
                                <span style={{ color: delivery === 0 ? '#4ade80' : '#ffffff', fontWeight: '700' }}>
                                    {delivery === 0 ? 'FREE' : `₹${delivery}`}
                                </span>
                            </div>
                            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>Grand Total</span>
                                <span style={{ fontSize: '22px', fontWeight: '800', color: '#f59e0b' }}>₹{total}</span>
                            </div>
                        </div>

                        {razorpayError && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', marginBottom: '12px', lineHeight: '1.4' }}>
                                ⚠️ {razorpayError}
                            </div>
                        )}

                        {/* CTA PAY BUTTON */}
                        <button 
                            type="button" 
                            className="checkout-pay-btn" 
                            onClick={handleRazorpayPayment}
                            disabled={isProcessingPayment}
                        >
                            {isProcessingPayment ? (
                                <>
                                    <span style={{ width: '18px', height: '18px', border: '2.5px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }}></span>
                                    Connecting to Razorpay...
                                </>
                            ) : (
                                <>
                                    <span>🔒 Pay with Razorpay • ₹{total}</span>
                                </>
                            )}
                        </button>

                        {/* TEST PAYMENT SIMULATOR BUTTON (OPTIONAL CONVENIENCE) */}
                        <button 
                            type="button" 
                            className="test-simulator-btn"
                            onClick={() => {
                                const { isValid } = validateForm();
                                if (isValid) {
                                    setShowTestSimulator(true);
                                } else {
                                    handleRazorpayPayment();
                                }
                            }}
                        >
                            🧪 Open 1-Click Razorpay Test Simulator
                        </button>

                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>🛡️</span>
                                <span>100% Buyer Protection & Official Netrave Guarantee</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>⚡</span>
                                <span>Instant WhatsApp Order Confirmation & Tracking ID</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* IN-APP RAZORPAY TEST SIMULATOR MODAL (FOR SEAMLESS TEST ENVIRONMENT) */}
            {showTestSimulator && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ maxWidth: '420px', width: '100%', background: '#0e1118', border: '1px solid rgba(2, 132, 199, 0.4)', borderRadius: '18px', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', position: 'relative' }}>
                        <button 
                            type="button" 
                            onClick={() => setShowTestSimulator(false)} 
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '22px', cursor: 'pointer' }}
                        >
                            &times;
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ width: '48px', height: '48px', background: 'rgba(2, 132, 199, 0.12)', border: '1px solid #0284c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '22px' }}>
                                ⚡
                            </div>
                            <h3 style={{ margin: '0 0 6px', fontSize: '19px', fontWeight: '800', color: '#ffffff' }}>
                                Razorpay Test Gateway
                            </h3>
                            <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8' }}>
                                Simulated sandbox environment for Netrave Fashion Store
                            </p>
                        </div>

                        <div style={{ background: '#161a24', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', marginBottom: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                                <span>Amount to Pay</span>
                                <strong style={{ color: '#ffffff', fontSize: '16px' }}>₹{total}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                                <span>Customer</span>
                                <span style={{ color: '#cbd5e1' }}>{name} ({phone})</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px' }}>
                                Select Test Payment Channel
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    { id: 'UPI', title: 'UPI / Google Pay (success@razorpay)', icon: '📱' },
                                    { id: 'Card', title: 'Test Card (Visa / Mastercard 4111...)', icon: '💳' },
                                    { id: 'NetBanking', title: 'NetBanking Test Simulator (SBI / HDFC)', icon: '🏦' }
                                ].map((channel) => (
                                    <label 
                                        key={channel.id} 
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '10px', 
                                            padding: '10px 14px', 
                                            borderRadius: '10px', 
                                            background: simulatedMethod === channel.id ? 'rgba(2, 132, 199, 0.15)' : '#12141c',
                                            border: simulatedMethod === channel.id ? '1px solid #0284c7' : '1px solid rgba(255,255,255,0.06)',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            color: '#ffffff'
                                        }}
                                    >
                                        <input 
                                            type="radio" 
                                            name="simChannel" 
                                            value={channel.id} 
                                            checked={simulatedMethod === channel.id}
                                            onChange={() => setSimulatedMethod(channel.id)}
                                            style={{ accentColor: '#0284c7' }}
                                        />
                                        <span>{channel.icon}</span>
                                        <span>{channel.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button 
                            type="button" 
                            onClick={() => executePaymentSuccess({
                                order_id: `order_sim_${Date.now()}`,
                                payment_id: `pay_test_${simulatedMethod.toLowerCase()}_${Date.now()}`,
                                signature: 'simulated_sig_success'
                            })}
                            disabled={isProcessingPayment}
                            style={{ 
                                width: '100%', 
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                color: '#ffffff', 
                                border: 'none', 
                                borderRadius: '12px', 
                                padding: '13px', 
                                fontWeight: '800', 
                                fontSize: '14px', 
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {isProcessingPayment ? 'Processing...' : `✓ Complete Test Payment (₹${total})`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
