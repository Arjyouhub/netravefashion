import React, { useState } from 'react';

export default function CartPage({
    cart = [],
    onUpdateQuantity,
    onRemoveItem,
    onProceedToCheckout,
    onMoveToWishlist,
    onNavigate
}) {
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(0);
    const [couponMsg, setCouponMsg] = useState(null);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCharge = subtotal >= 999 || subtotal === 0 ? 0 : 100;
    const finalTotal = Math.max(0, subtotal - appliedDiscount + shippingCharge);
    const totalItemsCount = cart.reduce((s, i) => s + i.quantity, 0);

    const handleApplyCoupon = (e) => {
        e.preventDefault();
        const code = couponCode.trim().toUpperCase();
        if (code === 'NETRAVE10' || code === 'SAVE10') {
            const disc = Math.round(subtotal * 0.10);
            setAppliedDiscount(disc);
            setCouponMsg({ type: 'success', text: `Coupon '${code}' applied! Saved ₹${disc}` });
        } else if (code === 'FESTIVE70') {
            const disc = Math.round(subtotal * 0.20);
            setAppliedDiscount(disc);
            setCouponMsg({ type: 'success', text: `Festive coupon '${code}' applied! Saved ₹${disc}` });
        } else {
            setCouponMsg({ type: 'error', text: 'Invalid coupon code. Try FESTIVE70 or NETRAVE10' });
        }
    };

    const handleClearAll = () => {
        cart.forEach(item => {
            onRemoveItem(item.id, item.selectedSize);
        });
    };

    if (cart.length === 0) {
        return (
            <div className="netrave-page-wrapper empty-cart-mobile">
                <div className="netrave-container">
                    <div className="empty-cart-card">
                        <div className="empty-icon-art">🛒</div>
                        <h2>Your Cart is Empty</h2>
                        <p>Looks like you haven't added anything to your cart yet.</p>
                        <button 
                            type="button" 
                            className="btn-primary-yellow"
                            onClick={() => onNavigate && onNavigate('category', { category: 'all' })}
                        >
                            Start Shopping →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="netrave-page-wrapper cart-mobile-page">
            <div className="netrave-container">
                {/* Header Title Row: My Cart (3 items) | Clear All */}
                <div className="cart-mobile-header-row">
                    <h1 className="cart-mobile-heading">
                        My Cart <span className="cart-count-sub">({totalItemsCount} items)</span>
                    </h1>
                    <button type="button" className="cart-clear-all-btn" onClick={handleClearAll}>
                        Clear All
                    </button>
                </div>

                {/* Cart Items List */}
                <div className="cart-items-mobile-list">
                    {cart.map((item, idx) => (
                        <div key={`${item.id}-${item.selectedSize}-${idx}`} className="cart-item-mobile-card">
                            <img 
                                src={item.image || (item.images && item.images[0])} 
                                alt={item.title} 
                                className="cart-item-mobile-img" 
                            />
                            <div className="cart-item-mobile-info">
                                <div className="cart-item-row-top">
                                    <h3 className="cart-item-mobile-title">{item.title}</h3>
                                    <button 
                                        type="button" 
                                        className="cart-item-trash-btn"
                                        onClick={() => onRemoveItem(item.id, item.selectedSize)}
                                        aria-label="Remove item"
                                    >
                                        🗑️
                                    </button>
                                </div>

                                <p className="cart-item-meta-text">
                                    Size: {item.selectedSize || '8'} · Color: {item.selectedColor || 'White'}
                                </p>

                                <div className="cart-item-row-bottom">
                                    <div className="cart-item-price-col">
                                        <span className="cart-item-curr-price">₹{item.price?.toLocaleString()}</span>
                                        {item.originalPrice && item.originalPrice > item.price && (
                                            <span className="cart-item-orig-price">₹{item.originalPrice?.toLocaleString()}</span>
                                        )}
                                    </div>

                                    {/* Stepper [-] 1 [+] */}
                                    <div className="cart-item-stepper">
                                        <button 
                                            type="button" 
                                            className="cart-step-btn"
                                            onClick={() => onUpdateQuantity(item.id, item.selectedSize, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            -
                                        </button>
                                        <span className="cart-step-qty">{item.quantity}</span>
                                        <button 
                                            type="button" 
                                            className="cart-step-btn"
                                            onClick={() => onUpdateQuantity(item.id, item.selectedSize, item.quantity + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Coupon Code Section */}
                <div className="cart-coupon-card">
                    <form className="cart-coupon-form" onSubmit={handleApplyCoupon}>
                        <input 
                            type="text" 
                            className="cart-coupon-input" 
                            placeholder="Coupon Code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <button type="submit" className="cart-coupon-apply-btn">
                            Apply
                        </button>
                    </form>
                    {couponMsg && (
                        <p className={`cart-coupon-note ${couponMsg.type}`}>
                            {couponMsg.text}
                        </p>
                    )}
                </div>

                {/* Order Summary Card */}
                <div className="cart-summary-mobile-card">
                    <h3 className="summary-mobile-heading">Order Summary</h3>
                    
                    <div className="summary-mobile-row">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toLocaleString()}</span>
                    </div>

                    <div className="summary-mobile-row">
                        <span>Shipping</span>
                        <span className={shippingCharge === 0 ? 'text-green-bold' : ''}>
                            {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
                        </span>
                    </div>

                    {appliedDiscount > 0 && (
                        <div className="summary-mobile-row text-green-bold">
                            <span>Discount</span>
                            <span>-₹{appliedDiscount.toLocaleString()}</span>
                        </div>
                    )}

                    <hr className="summary-mobile-hr" />

                    <div className="summary-mobile-row total-row">
                        <span>Total</span>
                        <span className="summary-total-val">₹{finalTotal.toLocaleString()}</span>
                    </div>
                </div>

                {/* Sticky / Dedicated Checkout Button */}
                <div className="cart-checkout-cta-wrap">
                    <button 
                        type="button" 
                        className="btn-proceed-checkout-mobile"
                        onClick={onProceedToCheckout}
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
}
