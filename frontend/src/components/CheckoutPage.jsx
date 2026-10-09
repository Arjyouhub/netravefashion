import React, { useState } from 'react';

export default function CheckoutPage({
    cart = [],
    user,
    onSubmitBooking,
    onNavigate,
    settings = {},
    API_BASE_URL = 'http://localhost:5001/api'
}) {
    const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
    const [deliverySpeed, setDeliverySpeed] = useState('standard');
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    const [savedAddresses, setSavedAddresses] = useState(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('netrave_addresses'));
            if (stored && stored.length > 0) return stored;
        } catch {}
        return [
            {
                name: user?.name || "Arjun K K",
                phone: user?.phone || "+91 9876543210",
                street: "Perambra, Kozhikode, Kerala",
                pincode: "673525",
                city: "Kozhikode",
                state: "Kerala",
                type: "Home"
            }
        ];
    });

    const [newAddr, setNewAddr] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        street: '',
        city: 'Kozhikode',
        state: 'Kerala',
        pincode: ''
    });

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCharge = deliverySpeed === 'express' ? 99 : 0;
    const totalAmount = subtotal + deliveryCharge;

    const handleSaveAddress = (e) => {
        e.preventDefault();
        if (!newAddr.name || !newAddr.phone || !newAddr.street) return;
        const updated = [...savedAddresses, newAddr];
        setSavedAddresses(updated);
        try {
            localStorage.setItem('netrave_addresses', JSON.stringify(updated));
        } catch {}
        setSelectedAddressIndex(updated.length - 1);
        setIsAddingNewAddress(false);
    };

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

    const handlePlaceOrder = async () => {
        setIsSubmitting(true);
        setPaymentError('');
        const currentAddr = savedAddresses[selectedAddressIndex] || savedAddresses[0];

        const formattedItems = cart.map(item => ({
            id: item.id,
            title: item.title,
            size: item.selectedSize || '8',
            color: item.selectedColor || 'White',
            price: item.price,
            quantity: item.quantity,
            image: item.image || (item.images && item.images[0])
        }));

        const bookingPayload = {
            orderId: 'NTR' + Math.floor(100000 + Math.random() * 900000),
            items: formattedItems,
            customer: {
                name: currentAddr?.name || 'Customer',
                phone: currentAddr?.phone || '+91 9876543210',
                address: currentAddr?.street || 'Kerala',
                district: currentAddr?.city || 'Kozhikode',
                state: currentAddr?.state || 'Kerala',
                pincode: currentAddr?.pincode || '673525'
            },
            paymentMethod: paymentMethod.toUpperCase(),
            deliverySpeed,
            subtotal,
            shippingCharge: deliveryCharge,
            totalAmount,
            status: 'Confirmed',
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        };

        // If Cash on Delivery, complete booking immediately
        if (paymentMethod === 'cod') {
            if (onSubmitBooking) {
                await onSubmitBooking(bookingPayload);
            }
            setIsSubmitting(false);
            return;
        }

        // Online Payment via Razorpay Standard Web Checkout
        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                setPaymentError('Razorpay checkout script failed to load.');
                setIsSubmitting(false);
                return;
            }

            const amountInPaise = Math.max(100, Math.round(Number(totalAmount) * 100));
            const createOrderRes = await fetch(`${API_BASE_URL}/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amountInPaise,
                    currency: 'INR',
                    receipt: `rcpt_${Date.now()}`
                })
            });

            if (!createOrderRes.ok) {
                const errData = await createOrderRes.json().catch(() => ({}));
                setPaymentError(errData.error || 'Failed to initialize payment order on server.');
                setIsSubmitting(false);
                return;
            }

            const orderData = await createOrderRes.json();
            const razorpayKey = orderData.key_id || orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
            const razorpayOrderId = orderData.order_id || orderData.id;

            const options = {
                key: razorpayKey,
                amount: orderData.amount || amountInPaise,
                currency: orderData.currency || 'INR',
                name: 'NETRAVE Fashion Store',
                description: `Order Checkout - ${cart.length} item(s)`,
                image: '/assets/logo.png',
                order_id: razorpayOrderId,
                prefill: {
                    name: currentAddr?.name || '',
                    contact: currentAddr?.phone || '',
                    email: user?.email || ''
                },
                theme: { color: '#f59e0b' },
                handler: async function (response) {
                    try {
                        const verifyRes = await fetch(`${API_BASE_URL}/verify-payment`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                order_id: response.razorpay_order_id,
                                payment_id: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                                customer: bookingPayload.customer,
                                items: bookingPayload.items,
                                subtotal,
                                delivery: deliveryCharge,
                                total: totalAmount
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyRes.ok && verifyData.success !== false) {
                            if (onSubmitBooking) {
                                await onSubmitBooking({
                                    ...bookingPayload,
                                    ...verifyData,
                                    status: 'Confirmed',
                                    paymentMethod: 'RAZORPAY',
                                    paymentStatus: 'Paid'
                                });
                            }
                        } else {
                            setPaymentError(verifyData.error || 'Payment verification failed on server.');
                        }
                    } catch (verifyErr) {
                        console.error('Verification error:', verifyErr);
                        setPaymentError('Network error verifying payment.');
                    } finally {
                        setIsSubmitting(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsSubmitting(false);
                        setPaymentError('Payment checkout was cancelled.');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (resp) {
                setPaymentError(`Payment failed: ${resp.error?.description || 'Transaction unsuccessful'}`);
                setIsSubmitting(false);
            });
            rzp.open();
        } catch (err) {
            console.error('Razorpay checkout error:', err);
            setPaymentError('Failed to launch Razorpay: ' + err.message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="netrave-page-wrapper checkout-mobile-page">
            {/* Top Header */}
            <div className="checkout-top-header">
                <div className="checkout-header-inner">
                    <button 
                        type="button" 
                        className="checkout-back-btn" 
                        onClick={() => onNavigate && onNavigate('cart')}
                        aria-label="Back to Cart"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                        </svg>
                        <span className="checkout-back-text">Back to Cart</span>
                    </button>

                    <div className="checkout-header-brand-wrap" onClick={() => onNavigate && onNavigate('home')}>
                        <img src="/assets/logo.png" alt="NETRAVE" className="checkout-header-logo-img" />
                        <div className="checkout-brand-text">
                            <span className="checkout-brand-net">Net</span>
                            <span className="checkout-brand-rave">rave</span>
                        </div>
                    </div>

                    <div className="checkout-header-right">
                        <div className="checkout-secure-badge-desktop">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <span>100% Secure Checkout</span>
                        </div>
                        <div className="checkout-cart-icon-wrap" onClick={() => onNavigate && onNavigate('cart')} title="Cart">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                            </svg>
                            <span className="cart-badge-yellow">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="netrave-container checkout-container-layout">
                {/* 3-Step Progress Indicator */}
                <div className="checkout-steps-pill-bar">
                    <div className="checkout-step-item done">
                        <span className="step-circle">✓</span>
                        <span className="step-name">1 Cart</span>
                    </div>
                    <div className="step-connector active"></div>
                    <div className="checkout-step-item active">
                        <span className="step-circle">2</span>
                        <span className="step-name">2 Address</span>
                    </div>
                    <div className="step-connector"></div>
                    <div className="checkout-step-item">
                        <span className="step-circle">3</span>
                        <span className="step-name">3 Payment</span>
                    </div>
                </div>

                {/* 2-Column Responsive Body */}
                <div className="checkout-columns-wrapper">
                    {/* LEFT COLUMN: Shipping + Delivery + Payment */}
                    <div className="checkout-left-column">
                        {/* 1. Shipping Address Section */}
                        <div className="checkout-card-box">
                            <div className="checkout-card-header">
                                <h3>Shipping Address</h3>
                                <button type="button" className="btn-link-yellow" onClick={() => setIsAddingNewAddress(true)}>
                                    Change
                                </button>
                            </div>

                            {!isAddingNewAddress ? (
                                <div className="saved-address-active-row">
                                    <span className="address-yellow-radio">●</span>
                                    <div className="address-text-block">
                                        <strong>{savedAddresses[selectedAddressIndex]?.name}</strong>
                                        <p>{savedAddresses[selectedAddressIndex]?.street}</p>
                                        <p className="phone-line">{savedAddresses[selectedAddressIndex]?.phone}</p>
                                    </div>
                                </div>
                            ) : (
                                <form className="inline-add-addr-form" onSubmit={handleSaveAddress}>
                                    <input 
                                        type="text" 
                                        placeholder="Full Name" 
                                        required 
                                        value={newAddr.name}
                                        onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                                    />
                                    <input 
                                        type="tel" 
                                        placeholder="Phone Number" 
                                        required 
                                        value={newAddr.phone}
                                        onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Street Address, Area" 
                                        required 
                                        value={newAddr.street}
                                        onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                                    />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button type="button" className="btn-secondary" onClick={() => setIsAddingNewAddress(false)}>Cancel</button>
                                        <button type="submit" className="btn-primary-yellow">Save Address</button>
                                    </div>
                                </form>
                            )}

                            {!isAddingNewAddress && (
                                <button type="button" className="btn-add-addr-link" onClick={() => setIsAddingNewAddress(true)}>
                                    + Add New Address
                                </button>
                            )}
                        </div>

                        {/* 2. Delivery Method Section */}
                        <div className="checkout-card-box">
                            <div className="checkout-card-header">
                                <h3>Delivery Method</h3>
                            </div>

                            <div className="delivery-methods-list">
                                <label className={`delivery-method-row ${deliverySpeed === 'standard' ? 'selected' : ''}`}>
                                    <div className="delivery-method-left">
                                        <input 
                                            type="radio" 
                                            name="delMethod" 
                                            checked={deliverySpeed === 'standard'} 
                                            onChange={() => setDeliverySpeed('standard')} 
                                        />
                                        <div>
                                            <strong>Standard Delivery</strong>
                                            <p>5-7 business days</p>
                                        </div>
                                    </div>
                                    <span className="delivery-cost-tag text-green-bold">Free</span>
                                </label>

                                <label className={`delivery-method-row ${deliverySpeed === 'express' ? 'selected' : ''}`}>
                                    <div className="delivery-method-left">
                                        <input 
                                            type="radio" 
                                            name="delMethod" 
                                            checked={deliverySpeed === 'express'} 
                                            onChange={() => setDeliverySpeed('express')} 
                                        />
                                        <div>
                                            <strong>Express Delivery</strong>
                                            <p>1-3 business days</p>
                                        </div>
                                    </div>
                                    <span className="delivery-cost-tag">₹99</span>
                                </label>
                            </div>
                        </div>

                        {/* 3. Payment Method Section */}
                        <div className="checkout-card-box">
                            <div className="checkout-card-header">
                                <h3>Payment Method</h3>
                            </div>

                            <div className="payment-methods-mobile-list">
                                {[
                                    { key: 'upi', label: 'UPI (Google Pay, PhonePe, Paytm, QR)', icon: '🟢', badge: 'Fastest' },
                                    { key: 'card', label: 'Credit / Debit Card (Visa, MasterCard, RuPay)', icon: '💳' },
                                    { key: 'netbanking', label: 'Net Banking (All Indian Banks)', icon: '🏦' },
                                    { key: 'cod', label: 'Cash on Delivery (COD)', icon: '💵' }
                                ].map(m => (
                                    <label key={m.key} className={`payment-method-row ${paymentMethod === m.key ? 'selected' : ''}`}>
                                        <div className="payment-left-item">
                                            <input 
                                                type="radio" 
                                                name="paymentMethod" 
                                                checked={paymentMethod === m.key} 
                                                onChange={() => setPaymentMethod(m.key)} 
                                            />
                                            <span className="payment-method-label-text">
                                                <span>{m.icon}</span> {m.label}
                                            </span>
                                        </div>
                                        {m.badge && (
                                            <span className="payment-option-badge">{m.badge}</span>
                                        )}
                                    </label>
                                ))}
                            </div>

                            {paymentMethod !== 'cod' && (
                                <div className="checkout-razorpay-notice-box">
                                    <span className="razorpay-badge-shield">⚡</span>
                                    <span>Powered by Razorpay Standard Checkout • Verified &amp; Encrypted</span>
                                </div>
                            )}

                            {paymentError && (
                                <div className="checkout-error-banner">
                                    <span>⚠️</span>
                                    <span>{paymentError}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Laptop / Desktop): Order Summary + Place Order CTA */}
                    <div className="checkout-right-column">
                        <div className="checkout-summary-card">
                            <div className="checkout-summary-header">
                                <h3>Order Summary</h3>
                                <span className="checkout-item-count-badge">
                                    {cart.reduce((s, i) => s + i.quantity, 0)} {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? 'Item' : 'Items'}
                                </span>
                            </div>

                            {/* Cart Item Preview List */}
                            <div className="checkout-items-preview-list">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="checkout-item-mini-row">
                                        <img 
                                            src={item.image || (item.images && item.images[0]) || '/assets/logo.png'} 
                                            alt={item.title} 
                                            className="checkout-item-mini-thumb" 
                                            onError={(e) => { e.target.src = '/assets/logo.png'; }}
                                        />
                                        <div className="checkout-item-mini-info">
                                            <div className="checkout-item-mini-title">{item.title}</div>
                                            <div className="checkout-item-mini-meta">
                                                <span>Size: {item.selectedSize || item.size || 'Free'}</span>
                                                <span>Qty: {item.quantity}</span>
                                            </div>
                                        </div>
                                        <div className="checkout-item-mini-price">
                                            ₹{(item.price * item.quantity).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Price Breakdown */}
                            <div className="checkout-price-breakdown">
                                <div className="checkout-price-row">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="checkout-price-row">
                                    <span>Shipping ({deliverySpeed === 'express' ? 'Express' : 'Standard'})</span>
                                    <span className={deliveryCharge === 0 ? 'text-green-bold' : ''}>
                                        {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                                    </span>
                                </div>
                                <div className="checkout-price-divider"></div>
                                <div className="checkout-price-row total-row">
                                    <strong>Total Payable</strong>
                                    <strong className="checkout-total-price">₹{totalAmount.toLocaleString()}</strong>
                                </div>
                            </div>

                            {/* Desktop Place Order Button */}
                            <button 
                                type="button" 
                                className="btn-place-order-desktop"
                                onClick={handlePlaceOrder}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span>Processing Order...</span>
                                ) : (
                                    <span>
                                        {paymentMethod === 'cod' ? 'Place Order (COD)' : `Pay ₹${totalAmount.toLocaleString()} via Razorpay`} →
                                    </span>
                                )}
                            </button>

                            {/* Trust & Guarantee Badges */}
                            <div className="checkout-trust-badges">
                                <div className="trust-badge-item">
                                    <span>🔒</span>
                                    <span>256-Bit SSL Encrypted &amp; Razorpay Secured</span>
                                </div>
                                <div className="trust-badge-item">
                                    <span>🚚</span>
                                    <span>Fast Delivery with Live WhatsApp Updates</span>
                                </div>
                                <div className="trust-badge-item">
                                    <span>🛡️</span>
                                    <span>100% Genuine Netrave Official Merchandise</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Mobile Checkout Bar: Total ₹... + [Place Order] (Visible only on Mobile) */}
                <div className="checkout-sticky-footer-bar">
                    <div className="checkout-footer-total">
                        <span className="footer-total-label">Total</span>
                        <strong className="footer-total-amount">₹{totalAmount.toLocaleString()}</strong>
                    </div>

                    <button 
                        type="button" 
                        className="btn-place-order-yellow"
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Placing Order...' : 'Place Order'}
                    </button>
                </div>
            </div>
        </div>
    );
}
