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
    const delivery = subtotal >= 999 ? 0 : (subtotal > 0 ? 60 : 0);
    const total = subtotal + delivery;

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
                <div className="cart-header">
                    <h3>Shopping Cart ({totalCount})</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="cart-content-wrapper">
                    {cart.length === 0 ? (
                        /* Empty Cart State */
                        <div className="cart-empty-state">
                            <svg viewBox="0 0 24 24" className="cart-empty-icon">
                                <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z"/>
                            </svg>
                            <h4>Your Cart is Empty</h4>
                            <p>Add products to your cart to begin booking.</p>
                            <button className="cta-btn primary-cta" onClick={onClose}>
                                Browse Products
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
                                            <span>Size: {item.size}</span>
                                            <span>{capitalize(item.category)}</span>
                                        </div>
                                        <div className="cart-item-qty-price">
                                            <div className="cart-qty-controls">
                                                <button 
                                                    className="cart-qty-btn" 
                                                    onClick={() => onUpdateQuantity(index, -1)}
                                                >
                                                    <svg viewBox="0 0 24 24" className="icon" style={{ width: '14px', height: '14px' }}>
                                                        <path d="M19 13H5v-2h14v2z"/>
                                                    </svg>
                                                </button>
                                                <span className="cart-qty-val">{item.quantity}</span>
                                                <button 
                                                    className="cart-qty-btn" 
                                                    onClick={() => onUpdateQuantity(index, 1)}
                                                >
                                                    <svg viewBox="0 0 24 24" className="icon" style={{ width: '14px', height: '14px' }}>
                                                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                            <span className="cart-item-price">₹{item.price * item.quantity}</span>
                                        </div>
                                    </div>
                                    <button 
                                        className="remove-cart-item-btn" 
                                        onClick={() => onRemoveItem(index)}
                                        aria-label="Remove item"
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
                        <div className="price-summary">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal}</span>
                            </div>
                            <div className="summary-row">
                                <span>Delivery (Kerala)</span>
                                <span className={delivery === 0 ? 'free-delivery' : ''}>
                                    {delivery === 0 ? 'FREE' : `₹${delivery}`}
                                </span>
                            </div>
                            <div className="summary-row total-row">
                                <span>Total Amount</span>
                                <span>₹{total}</span>
                            </div>
                        </div>

                        <div className="cart-footer-actions">
                            <button className="cta-btn primary-cta checkout-trigger-btn" onClick={onCheckoutTrigger}>
                                Proceed to Checkout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
