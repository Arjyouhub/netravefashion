import React, { useState, useEffect } from 'react';

export default function CheckoutModal({ isOpen, cart, onClose, onSubmitBooking }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [address, setAddress] = useState('');
    const [district, setDistrict] = useState('');
    const [pincode, setPincode] = useState('');
    const [payment, setPayment] = useState('COD');
    const [termsCheck, setTermsCheck] = useState(false);
    const [sameAsPhone, setSameAsPhone] = useState(false);
    const [errors, setErrors] = useState({});
    const [validated, setValidated] = useState(false);

    // Reset validations on modal load
    useEffect(() => {
        setName('');
        setPhone('');
        setWhatsapp('');
        setAddress('');
        setDistrict('');
        setPincode('');
        setPayment('COD');
        setTermsCheck(false);
        setSameAsPhone(false);
        setErrors({});
        setValidated(false);
    }, [isOpen]);

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
    const delivery = subtotal >= 999 ? 0 : 60;
    const total = subtotal + delivery;

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
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setValidated(true);

        if (validateForm()) {
            onSubmitBooking({
                name,
                phone,
                whatsapp,
                address,
                district,
                pincode,
                payment
            });
        }
    };

    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }}>
            <div className="modal-content checkout-modal-content">
                <button className="close-btn modal-close" onClick={onClose}>&times;</button>
                
                <div className="checkout-grid">
                    {/* Left: Booking Form */}
                    <div className="checkout-form-container">
                        <h2 className="form-title">Delivery & Booking Details</h2>
                        <p className="form-subtitle">Complete your shipping information to place your order.</p>

                        <form onSubmit={handleSubmit} className={`booking-form ${validated ? 'was-validated' : ''}`} noValidate>
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
                                <label htmlFor="termsCheck">I agree that this is a booking. I will verify details on WhatsApp to confirm delivery.</label>
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

                        <div className="checkout-pricing">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal}</span>
                            </div>
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

                        <button 
                            type="button" 
                            className="cta-btn primary-cta place-order-btn" 
                            onClick={handleSubmit}
                        >
                            Place Booking & WhatsApp Receipt
                        </button>
                        <p className="whatsapp-disclaimer">ℹ️ Placing booking opens WhatsApp to secure confirmation with the seller.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
