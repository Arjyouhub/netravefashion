import React from 'react';

export default function CartDrawer({
    isOpen,
    cart,
    onClose,
    onRemoveItem,
    onUpdateQuantity,
    onCheckoutTrigger
}) {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Free delivery threshold: ₹999
    const freeDeliveryThreshold = 999;
    const amountNeededForFree = Math.max(0, freeDeliveryThreshold - subtotal);
    const freeDeliveryProgress = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));
    
    const delivery = subtotal >= freeDeliveryThreshold ? 0 : (subtotal > 0 ? 60 : 0);
    const total = subtotal + delivery;

    // Approximate original price to show discount savings
    const estimatedOriginalTotal = cart.reduce((sum, item) => {
        const orig = item.originalPrice || Math.round(item.price * 1.45);
        return sum + (orig * item.quantity);
    }, 0);
    const totalSavings = Math.max(0, estimatedOriginalTotal - subtotal + (delivery === 0 ? 60 : 0));

    const capitalize = (str) => {
        if (!str) return '';
        return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
                            My Bag ({totalCount} {totalCount === 1 ? 'item' : 'items'})
                        </h3>
                    </div>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                {/* Flipkart / Amazon Free Delivery Progress Bar */}
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
                            <h4>Your Cart is Empty</h4>
                            <p>Discover our trendy streetwear collection and add your favorite picks!</p>
                            <button className="cta-btn primary-cta" onClick={onClose}>
                                Shop Now
                            </button>
                        </div>
                    ) : (
                        /* Cart Items List */
                        <div className="cart-items-list">
                            {cart.map((item, index) => (
                                <div className="cart-item" key={`${item.id}-${item.size}`}>
                                    <div className="cart-item-img-wrapper">
                                        <img src={item.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%230f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23475569" font-family="sans-serif" font-size="14" font-weight="bold">NO IMAGE</text></svg>'} alt={item.title} />
                                    </div>
                                    <div className="cart-item-info">
                                        <h4 className="cart-item-title">{item.title}</h4>
                                        <div className="cart-item-meta">
                                            <span style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px', color: '#fff', fontWeight: 'bold' }}>Size: {item.size}</span>
                                            <span>{capitalize(item.category)}</span>
                                        </div>
                                        <div className="cart-item-qty-price">
                                            <div className="cart-qty-controls">
                                                <button 
                                                    className="cart-qty-btn" 
                                                    onClick={() => onUpdateQuantity(index, -1)}
                                                    aria-label="Decrease quantity"
                                                >
                                                    <svg viewBox="0 0 24 24" className="icon" style={{ width: '14px', height: '14px' }}>
                                                        <path d="M19 13H5v-2h14v2z"/>
                                                    </svg>
                                                </button>
                                                <span className="cart-qty-val">{item.quantity}</span>
                                                <button 
                                                    className="cart-qty-btn" 
                                                    onClick={() => onUpdateQuantity(index, 1)}
                                                    aria-label="Increase quantity"
                                                >
                                                    <svg viewBox="0 0 24 24" className="icon" style={{ width: '14px', height: '14px' }}>
                                                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                            <span className="cart-item-price" style={{ color: 'var(--primary)', fontWeight: '800' }}>₹{item.price * item.quantity}</span>
                                        </div>
                                    </div>
                                    <button 
                                        className="remove-cart-item-btn" 
                                        onClick={() => onRemoveItem(index)}
                                        aria-label="Remove item"
                                        title="Remove item"
                                    >
                                        <svg viewBox="0 0 24 24" className="icon">
                                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cart Footer */}
                {cart.length > 0 && (
                    <div className="cart-footer">
                        {/* Flipkart / Amazon Savings Banner */}
                        {totalSavings > 0 && (
                            <div style={{
                                background: 'rgba(16, 185, 129, 0.12)',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                color: '#10b981',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span>🎉</span>
                                <span>You will save <strong>₹{totalSavings}</strong> on this order!</span>
                            </div>
                        )}

                        <div className="price-summary">
                            <div className="summary-row">
                                <span>Total Item MRP</span>
                                <span style={{ textDecoration: totalSavings > 0 ? 'line-through' : 'none', color: '#94a3b8' }}>
                                    ₹{estimatedOriginalTotal}
                                </span>
                            </div>
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal}</span>
                            </div>
                            <div className="summary-row">
                                <span>Delivery Fee</span>
                                <span className={delivery === 0 ? 'free-delivery' : ''} style={{ color: delivery === 0 ? '#10b981' : '#fff', fontWeight: 'bold' }}>
                                    {delivery === 0 ? 'FREE' : `₹${delivery}`}
                                </span>
                            </div>
                            <div className="summary-row total-row" style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '6px' }}>
                                <span style={{ fontWeight: '800', color: '#fff', fontSize: '15px' }}>Total Amount</span>
                                <span style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '17px' }}>₹{total}</span>
                            </div>
                        </div>

                        <div className="cart-footer-actions">
                            <button className="cta-btn primary-cta checkout-trigger-btn" onClick={onCheckoutTrigger} style={{ width: '100%', fontWeight: '800', fontSize: '14px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span>Proceed to Secure Checkout</span>
                                <span>→</span>
                            </button>
                        </div>

                        {/* Trust Footer */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '12px', fontSize: '10.5px', color: '#64748b' }}>
                            <span>🔒 100% Safe Payments</span>
                            <span>•</span>
                            <span>🚚 Live Courier Tracking</span>
                            <span>•</span>
                            <span>🔄 7-Day Returns</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
