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

    // Use active real cart
    const activeCart = Array.isArray(cart) ? cart : [];

    const subtotal = activeCart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (item.quantity || 1)), 0);
    const shippingCharge = subtotal >= 999 || subtotal === 0 ? 0 : 100;
    const finalTotal = Math.max(0, subtotal - appliedDiscount + shippingCharge);
    const totalItemsCount = activeCart.reduce((s, i) => s + (i.quantity || 1), 0);

    const handleApplyCoupon = (e) => {
        e.preventDefault();
        const code = couponCode.trim().toUpperCase();
        if (code === 'NETRAVE10' || code === 'SAVE10') {
            const disc = Math.round(subtotal * 0.10);
            setAppliedDiscount(disc);
            setCouponMsg({ type: 'success', text: `Coupon '${code}' applied! Saved ₹${disc.toLocaleString()}` });
        } else if (code === 'FESTIVE70') {
            const disc = Math.round(subtotal * 0.20);
            setAppliedDiscount(disc);
            setCouponMsg({ type: 'success', text: `Festive coupon '${code}' applied! Saved ₹${disc.toLocaleString()}` });
        } else if (code === 'FREESHIP') {
            setAppliedDiscount(shippingCharge > 0 ? shippingCharge : 50);
            setCouponMsg({ type: 'success', text: `Coupon '${code}' applied! Free shipping unlocked.` });
        } else {
            setCouponMsg({ type: 'error', text: 'Invalid coupon code. Try FESTIVE70 or NETRAVE10' });
        }
    };

    const handleClearAll = () => {
        if (window.confirm && window.confirm('Are you sure you want to clear all items from your cart?')) {
            if (activeCart.length > 0) {
                for (let i = activeCart.length - 1; i >= 0; i--) {
                    if (onRemoveItem) onRemoveItem(i);
                }
            }
        }
    };

    const handleItemRemove = (item, idx) => {
        if (onRemoveItem) {
            onRemoveItem(idx !== undefined ? idx : item.id, item.selectedSize || item.size);
        }
    };

    const handleMoveWishlistAndRemove = (item, idx) => {
        if (onMoveToWishlist) {
            onMoveToWishlist(item.id);
        }
        handleItemRemove(item, idx);
    };

    if (activeCart.length === 0) {
        return (
            <div className="netrave-page-wrapper empty-cart-screen">
                <div className="netrave-container cart-container-responsive">
                    <div className="empty-cart-card">
                        <div className="empty-icon-art">🛒</div>
                        <h2>Your Shopping Bag is Empty</h2>
                        <p>Looks like you haven't added any items to your bag yet. Explore our latest streetwear & fashion drops.</p>
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
        <div className="netrave-page-wrapper cart-page-root">
            <div className="netrave-container cart-container-responsive">
                {/* Desktop Breadcrumb */}
                <div className="netrave-desktop-breadcrumb">
                    <button type="button" onClick={() => onNavigate && onNavigate('home')}>Home</button>
                    <span>/</span>
                    <span className="current">Shopping Cart</span>
                </div>

                {/* Page Title & Counter */}
                <div className="cart-page-header-row">
                    <div>
                        <h1 className="cart-page-main-heading">
                            My Cart <span className="cart-count-sub">({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})</span>
                        </h1>
                        <p className="cart-page-subtext">Free shipping on orders above ₹999</p>
                    </div>
                    <button type="button" className="cart-clear-all-btn" onClick={handleClearAll}>
                        Clear All
                    </button>
                </div>

                {/* Desktop 70/30 Split Layout / Mobile Stacked Layout */}
                <div className="cart-desktop-split-layout">
                    {/* Left: Cart Items (approx 68-70%) */}
                    <div className="cart-items-column">
                        <div className="cart-items-list-wrap">
                            {activeCart.map((item, idx) => {
                                const itemSize = item.size || item.selectedSize || 'M';
                                const itemColor = item.color || item.selectedColor || 'Default';
                                const itemQty = item.quantity || 1;
                                const itemPrice = Number(item.price) || 0;
                                const itemOrigPrice = Number(item.originalPrice) || 0;

                                return (
                                    <div key={`${item.id}-${itemSize}-${idx}`} className="cart-item-card-row">
                                        <div className="cart-item-thumb-box">
                                            <img 
                                                src={item.image || (item.images && item.images[0])} 
                                                alt={item.title} 
                                                className="cart-item-thumb-img" 
                                            />
                                        </div>

                                        <div className="cart-item-details-box">
                                            <div className="cart-item-info-top">
                                                <h3 className="cart-item-name">{item.title}</h3>
                                                <div className="cart-item-price-display">
                                                    <span className="cart-item-price-bold">₹{(itemPrice * itemQty).toLocaleString()}</span>
                                                    {itemOrigPrice > itemPrice && (
                                                        <span className="cart-item-price-cut">₹{(itemOrigPrice * itemQty).toLocaleString()}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="cart-item-meta-badges">
                                                <span className="cart-meta-pill">Size: <strong>{itemSize}</strong></span>
                                                <span className="cart-meta-pill">Color: <strong>{itemColor}</strong></span>
                                                <span className="cart-stock-status">✓ In Stock</span>
                                            </div>

                                            <div className="cart-item-controls-row">
                                                {/* Quantity Stepper */}
                                                <div className="cart-item-qty-stepper">
                                                    <button 
                                                        type="button" 
                                                        className="stepper-btn"
                                                        onClick={() => onUpdateQuantity && onUpdateQuantity(idx, -1)}
                                                        disabled={itemQty <= 1}
                                                        aria-label="Decrease quantity"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="stepper-val">{itemQty}</span>
                                                    <button 
                                                        type="button" 
                                                        className="stepper-btn"
                                                        onClick={() => onUpdateQuantity && onUpdateQuantity(idx, 1)}
                                                        aria-label="Increase quantity"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                {/* Action Links & Quick Buy */}
                                                <div className="cart-item-actions-group">
                                                    <button 
                                                        type="button" 
                                                        className="cart-action-link-btn"
                                                        onClick={() => handleMoveWishlistAndRemove(item, idx)}
                                                    >
                                                        <span>♡</span> Move to Wishlist
                                                    </button>
                                                    <span className="cart-action-sep">|</span>
                                                    <button 
                                                        type="button" 
                                                        className="cart-action-link-btn text-danger"
                                                        onClick={() => handleItemRemove(item, idx)}
                                                    >
                                                        <span>🗑️</span> Remove
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        className="cart-action-buy-item-btn"
                                                        onClick={onProceedToCheckout}
                                                        title="Buy directly now"
                                                    >
                                                        ⚡ Buy Now
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Back to Shopping Button */}
                        <div className="cart-back-shopping-row">
                            <button
                                type="button"
                                className="btn-secondary-outline-sm"
                                onClick={() => onNavigate && onNavigate('category', { category: 'all' })}
                            >
                                ← Continue Shopping
                            </button>
                        </div>
                    </div>

                    {/* Right: Order Summary & Coupon (approx 30-32%, Sticky on Desktop) */}
                    <div className="cart-summary-column">
                        <div className="cart-summary-sticky-card">
                            {/* Coupon Code Section */}
                            <div className="cart-coupon-block">
                                <h4 className="cart-coupon-title">Have a Coupon Code?</h4>
                                <form className="cart-coupon-form-box" onSubmit={handleApplyCoupon}>
                                    <input 
                                        type="text" 
                                        className="cart-coupon-field" 
                                        placeholder="Enter promo code (e.g. FESTIVE70)"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                    />
                                    <button type="submit" className="cart-coupon-btn">
                                        Apply
                                    </button>
                                </form>
                                {couponMsg && (
                                    <p className={`cart-coupon-status-msg ${couponMsg.type}`}>
                                        {couponMsg.type === 'success' ? '✓ ' : '✕ '} {couponMsg.text}
                                    </p>
                                )}
                            </div>

                            {/* Order Summary Pricing Breakdown */}
                            <div className="cart-order-summary-block">
                                <h3 className="summary-block-heading">Order Summary</h3>
                                
                                <div className="summary-calc-row">
                                    <span className="summary-calc-label">Subtotal</span>
                                    <span className="summary-calc-val">₹{subtotal.toLocaleString()}</span>
                                </div>

                                <div className="summary-calc-row">
                                    <span className="summary-calc-label">Estimated Shipping</span>
                                    <span className={`summary-calc-val ${shippingCharge === 0 ? 'text-green-bold' : ''}`}>
                                        {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
                                    </span>
                                </div>

                                {appliedDiscount > 0 && (
                                    <div className="summary-calc-row text-green-bold">
                                        <span className="summary-calc-label">Coupon Discount</span>
                                        <span className="summary-calc-val">-₹{appliedDiscount.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="summary-divider-line" />

                                <div className="summary-calc-row total-highlight-row">
                                    <span className="summary-total-label">Total Amount</span>
                                    <span className="summary-total-val">₹{finalTotal.toLocaleString()}</span>
                                </div>

                                <p className="summary-tax-note">Inclusive of all applicable GST taxes</p>

                                {/* Prominent Proceed to Checkout / Buy Now CTA */}
                                <button 
                                    type="button" 
                                    className="btn-primary-yellow btn-checkout-desktop"
                                    onClick={onProceedToCheckout}
                                >
                                    <span>⚡ Buy Now / Proceed to Checkout</span>
                                    <span>→</span>
                                </button>

                                {/* Trust & Security Badges */}
                                <div className="cart-trust-badges-row">
                                    <div className="trust-badge-item">
                                        <span className="trust-icon">🔒</span>
                                        <span>100% Secure Checkout</span>
                                    </div>
                                    <div className="trust-badge-item">
                                        <span className="trust-icon">🔄</span>
                                        <span>Easy 7-Day Returns</span>
                                    </div>
                                    <div className="trust-badge-item">
                                        <span className="trust-icon">⚡</span>
                                        <span>Fast Express Delivery</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Fixed Sticky Buy Bar - Docked right above bottom navigation */}
            <div className="cart-mobile-sticky-checkout-bar">
                <div className="cart-mobile-checkout-price-info">
                    <span className="cart-mobile-checkout-label">Total Amount:</span>
                    <span className="cart-mobile-checkout-amount">₹{finalTotal.toLocaleString()}</span>
                </div>
                <button
                    type="button"
                    className="cart-mobile-checkout-btn"
                    onClick={onProceedToCheckout}
                >
                    <span>⚡ Buy Now</span>
                    <span>→</span>
                </button>
            </div>
        </div>
    );
}
