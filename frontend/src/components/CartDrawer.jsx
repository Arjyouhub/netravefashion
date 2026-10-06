import React, { useState } from 'react';

export default function CartDrawer({
    isOpen,
    cart = [],
    onClose,
    onRemoveItem,
    onUpdateQuantity,
    onCheckoutTrigger,
    API_BASE_URL
}) {
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * item.quantity), 0);
    
    // Calculate coupon discount
    let discountAmount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.discountType === 'percentage') {
            discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
        } else {
            discountAmount = appliedCoupon.discountValue;
        }
    }
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

    // Free delivery threshold: ₹999
    const freeDeliveryThreshold = 999;
    const amountNeededForFree = Math.max(0, freeDeliveryThreshold - subtotalAfterDiscount);
    const freeDeliveryProgress = Math.min(100, Math.round((subtotalAfterDiscount / freeDeliveryThreshold) * 100));
    
    const delivery = subtotalAfterDiscount >= freeDeliveryThreshold ? 0 : (subtotalAfterDiscount > 0 ? 60 : 0);
    const total = subtotalAfterDiscount + delivery;

    // Approximate original total to show total savings
    const estimatedOriginalTotal = cart.reduce((sum, item) => {
        const orig = item.originalPrice || Math.round((item.price || 0) * 1.45);
        return sum + (orig * item.quantity);
    }, 0);
    const totalSavings = Math.max(0, (estimatedOriginalTotal - subtotal) + discountAmount + (delivery === 0 && subtotalAfterDiscount > 0 ? 60 : 0));

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        setCouponError('');
        if (!couponCode.trim()) return;
        setCouponLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL || ''}/api/coupons/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode.trim(), subtotal })
            });
            const data = await res.json();
            if (res.ok && data.valid) {
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
        setCouponError('');
    };

    return (
        <>
            {/* Drawer Overlay */}
            <div 
                className={`cart-drawer-overlay ${isOpen ? 'show' : ''}`}
                onClick={onClose}
            />

            {/* Cart Drawer */}
            <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
                <div className="cart-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>🛒</span>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#fff' }}>
                            Shopping Bag ({totalCount} {totalCount === 1 ? 'item' : 'items'})
                        </h3>
                    </div>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                {/* Free Delivery Progress Bar */}
                {cart.length > 0 && (
                    <div style={{
                        background: '#0d101a',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '12px 18px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
                            <span style={{ color: amountNeededForFree === 0 ? '#10b981' : '#cbd5e1', fontWeight: '700' }}>
                                {amountNeededForFree === 0 ? '🎉 You have unlocked FREE Express Delivery!' : `Add ₹${amountNeededForFree} more to unlock FREE Delivery!`}
                            </span>
                            <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{freeDeliveryProgress}%</span>
                        </div>
                        <div style={{
                            width: '100%',
                            height: '6px',
                            background: 'rgba(255,255,255,0.08)',
                            borderRadius: '10px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${freeDeliveryProgress}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)',
                                borderRadius: '10px',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>
                )}

                <div className="cart-content-wrapper">
                    {cart.length === 0 ? (
                        /* Empty Cart State */
                        <div className="cart-empty-state">
                            <svg viewBox="0 0 24 24" className="cart-empty-icon">
                                <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z"/>
                            </svg>
                            <h4>Your Shopping Bag is Empty</h4>
                            <p>Discover our trendy streetwear collection and add your favorite picks!</p>
                            <button className="cta-btn primary-cta" onClick={onClose}>
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        /* Cart Items List */
                        <div className="cart-items-list">
                            {cart.map((item, index) => {
                                const maxStock = item.stock !== undefined ? item.stock : 50;
                                const variantText = [];
                                if (item.size) variantText.push(`Size: ${item.size}`);
                                if (item.color) variantText.push(`Color: ${item.color}`);
                                if (item.selectedOptions) {
                                    Object.entries(item.selectedOptions).forEach(([k, v]) => {
                                        if (k !== 'Size' && k !== 'Color') variantText.push(`${k}: ${v}`);
                                    });
                                }

                                return (
                                    <div key={`${item.id}-${item.size}-${item.color || index}`} className="cart-item" style={{
                                        display: 'flex',
                                        gap: '12px',
                                        padding: '14px 18px',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                                        alignItems: 'center'
                                    }}>
                                        <img 
                                            src={item.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80'} 
                                            alt={item.title} 
                                            style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.title}
                                            </h4>
                                            
                                            {/* Dynamic Variant Spec Display */}
                                            {variantText.length > 0 && (
                                                <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600', marginBottom: '4px' }}>
                                                    {variantText.join(' • ')}
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>₹{item.price}</span>
                                                {item.originalPrice && item.originalPrice > item.price && (
                                                    <span style={{ fontSize: '11.5px', color: '#64748b', textDecoration: 'line-through' }}>₹{item.originalPrice}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Qty increment / decrement */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <button 
                                                onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                                                style={cartQtyBtnStyle}
                                                aria-label="Decrease quantity"
                                            >
                                                -
                                            </button>
                                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff', minWidth: '18px', textAlign: 'center' }}>
                                                {item.quantity}
                                            </span>
                                            <button 
                                                onClick={() => onUpdateQuantity(index, Math.min(maxStock, item.quantity + 1))}
                                                style={cartQtyBtnStyle}
                                                disabled={item.quantity >= maxStock}
                                                aria-label="Increase quantity"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Remove item button */}
                                        <button
                                            type="button"
                                            onClick={() => onRemoveItem(index)}
                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', fontSize: '16px' }}
                                            title="Remove item"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                );
                            })}

                            {/* Coupon Code Input inside Cart */}
                            <div style={{ padding: '16px 18px', background: '#090b10', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
                                    🎟️ Apply Discount Coupon
                                </div>
                                {appliedCoupon ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid #10b981',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        color: '#10b981',
                                        fontSize: '12.5px',
                                        fontWeight: '700'
                                    }}>
                                        <span>✓ Code <strong>{appliedCoupon.code}</strong> applied (-₹{discountAmount})</span>
                                        <button
                                            type="button"
                                            onClick={handleRemoveCoupon}
                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '6px' }}>
                                        <input
                                            type="text"
                                            placeholder="Enter coupon code (e.g. NETRAVE15)"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            style={{
                                                flex: 1,
                                                background: '#131826',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                padding: '8px 12px',
                                                color: '#fff',
                                                fontSize: '12.5px',
                                                textTransform: 'uppercase',
                                                outline: 'none'
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={couponLoading || !couponCode.trim()}
                                            style={{
                                                background: 'var(--primary)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#000',
                                                fontWeight: '800',
                                                padding: '8px 14px',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {couponLoading ? 'Checking...' : 'Apply'}
                                        </button>
                                    </form>
                                )}
                                {couponError && (
                                    <div style={{ color: '#ef4444', fontSize: '11.5px', fontWeight: '600', marginTop: '6px' }}>
                                        {couponError}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Cart Footer Price Breakdown & Checkout Action */}
                {cart.length > 0 && (
                    <div className="cart-footer" style={{ padding: '16px 18px', background: '#0a0b0f', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                                <span>Subtotal</span>
                                <span>₹{subtotal}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: '700' }}>
                                    <span>Coupon Discount</span>
                                    <span>-₹{discountAmount}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                                <span>Express Courier Delivery</span>
                                <span>{delivery === 0 ? <strong style={{ color: '#10b981' }}>FREE</strong> : `₹${delivery}`}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '16px', fontWeight: '900', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <span>Grand Total</span>
                                <span style={{ color: 'var(--primary)' }}>₹{total}</span>
                            </div>
                            {totalSavings > 0 && (
                                <div style={{ fontSize: '11.5px', color: '#10b981', textAlign: 'right', fontWeight: '700' }}>
                                    🎉 You are saving ₹{totalSavings} on this order!
                                </div>
                            )}
                        </div>

                        <button 
                            className="cta-btn primary-cta checkout-btn" 
                            onClick={onCheckoutTrigger}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                fontSize: '14.5px',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>Proceed to Secure Checkout</span>
                            <span>→</span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

const cartQtyBtnStyle = {
    background: '#151928',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    borderRadius: '6px',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontWeight: '800',
    fontSize: '13px'
};
