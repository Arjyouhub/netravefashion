import React, { useState, useEffect } from 'react';

export default function ProductModal({ 
    isOpen, 
    product, 
    onClose, 
    onAddToCart, 
    onBuyNow,
    API_BASE_URL,
    isWishlisted = false,
    onToggleWishlist
}) {
    const [selectedSize, setSelectedSize] = useState('');
    const [qty, setQty] = useState(1);
    const [sizeError, setSizeError] = useState(false);

    // Pincode delivery estimation state (Flipkart/Amazon style)
    const [pincode, setPincode] = useState('673001');
    const [pincodeChecked, setPincodeChecked] = useState(true);
    const [pincodeLoading, setPincodeLoading] = useState(false);

    // Reviews states
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    // Reset local state & fetch reviews when product changes
    useEffect(() => {
        setSelectedSize('');
        setQty(1);
        setSizeError(false);

        if (isOpen && product && API_BASE_URL) {
            setReviewsLoading(true);
            fetch(`${API_BASE_URL}/products/${product.id}/reviews`)
                .then(res => res.json())
                .then(data => {
                    setReviews(data);
                    setReviewsLoading(false);
                })
                .catch(err => {
                    console.error('Error loading reviews:', err);
                    setReviewsLoading(false);
                });
        } else {
            setReviews([]);
        }
    }, [product, isOpen, API_BASE_URL]);

    if (!isOpen || !product) return null;

    const handleAddToCartClick = () => {
        if (!selectedSize) {
            setSizeError(true);
            return;
        }
        onAddToCart(product, selectedSize, qty);
    };

    const handleBuyNowClick = () => {
        if (!selectedSize) {
            setSizeError(true);
            return;
        }
        if (onBuyNow) {
            onBuyNow(product, selectedSize, qty);
        } else {
            onAddToCart(product, selectedSize, qty);
        }
    };

    const handleCheckPincode = (e) => {
        e.preventDefault();
        if (!pincode || pincode.trim().length < 6) return;
        setPincodeLoading(true);
        setTimeout(() => {
            setPincodeLoading(false);
            setPincodeChecked(true);
        }, 350);
    };

    const formatReviewDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const hasDiscount = product.originalPrice > product.price;
    const discountPct = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    // Delivery calculation
    const estDeliveryDate = new Date();
    estDeliveryDate.setDate(estDeliveryDate.getDate() + 2);
    const estDateFormatted = estDeliveryDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }} style={{ zIndex: 1090 }}>
            <div className="modal-content product-quickview" style={{ 
                overflowY: 'auto', 
                maxHeight: '92vh', 
                background: 'linear-gradient(180deg, #111420 0%, #0a0b0f 100%)', 
                borderRadius: '20px', 
                border: '1px solid rgba(245, 158, 11, 0.25)',
                position: 'relative'
            }}>
                <style>{`
                    @media (max-width: 768px) {
                        .product-quickview {
                            width: calc(100% - 16px) !important;
                            max-width: 500px !important;
                            margin: 10px auto !important;
                            border-radius: 16px !important;
                            max-height: 92vh !important;
                        }
                        .quickview-container {
                            display: block !important;
                            grid-template-columns: 1fr !important;
                            max-height: none !important;
                            overflow: visible !important;
                        }
                        .quickview-gallery {
                            min-height: unset !important;
                            height: auto !important;
                            max-height: 270px !important;
                            padding: 0 !important;
                            background: #090b10 !important;
                            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
                        }
                        .main-image-container {
                            height: 250px !important;
                            max-height: 250px !important;
                            width: 100% !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            background: #090b10 !important;
                            border-radius: 0 !important;
                        }
                        .main-image-container img {
                            height: 100% !important;
                            max-height: 250px !important;
                            width: auto !important;
                            max-width: 100% !important;
                            object-fit: contain !important;
                            border-radius: 0 !important;
                        }
                        .quickview-details {
                            padding: 16px 14px 20px !important;
                        }
                        .quickview-actions-row {
                            display: grid !important;
                            grid-template-columns: 1fr 1fr !important;
                            gap: 8px !important;
                        }
                        .quickview-actions-row .qty-container {
                            grid-column: 1 / -1 !important;
                            width: 100% !important;
                            justify-content: center !important;
                        }
                        .quickview-actions-row .cta-btn {
                            width: 100% !important;
                            min-width: 0 !important;
                            padding: 12px 6px !important;
                            font-size: 13px !important;
                            min-height: 44px !important;
                            border-radius: 10px !important;
                            white-space: nowrap !important;
                        }
                    }
                `}</style>

                {/* Close Button (Top Right) */}
                <button className="close-btn modal-close" onClick={onClose} aria-label="Close Modal">&times;</button>

                {/* Wishlist Heart Button (Placed right beside close button, never overlapping) */}
                <button
                    type="button"
                    onClick={() => { if (onToggleWishlist) onToggleWishlist(product.id); }}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    aria-label="Wishlist"
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '56px',
                        zIndex: 20,
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: isWishlisted ? 'rgba(239, 68, 68, 0.9)' : 'rgba(10, 11, 14, 0.75)',
                        backdropFilter: 'blur(8px)',
                        border: isWishlisted ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <svg 
                        viewBox="0 0 24 24" 
                        style={{ 
                            width: '18px', 
                            height: '18px', 
                            fill: isWishlisted ? '#ffffff' : 'none', 
                            stroke: isWishlisted ? '#ffffff' : '#cbd5e1', 
                            strokeWidth: '2' 
                        }}
                    >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                </button>
                
                <div className="quickview-container">
                    {/* Left: Images */}
                    <div className="quickview-gallery">
                        <div className="main-image-container" style={{ position: 'relative' }}>
                            {/* Assured Badge */}
                            <span style={{
                                position: 'absolute',
                                top: '12px',
                                left: '12px',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: '#0a0b0e',
                                fontSize: '10px',
                                fontWeight: '900',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                letterSpacing: '0.5px',
                                zIndex: 2
                            }}>
                                ⚡ NETRAVE ASSURED
                            </span>

                            <img 
                                src={product.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%230f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23475569" font-family="sans-serif" font-size="14" font-weight="bold">NO IMAGE</text></svg>'} 
                                alt={product.title} 
                            />
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className="quickview-details">
                        <span className="product-tag">{product.category}</span>
                        <h2 className="product-title" style={{ fontSize: '20px', fontWeight: '800', lineHeight: '1.3', margin: '4px 0 8px' }}>{product.title}</h2>
                        
                        {/* Rating row (Flipkart/Amazon style) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 12px', flexWrap: 'wrap' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: '#15803d',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '4px'
                            }}>
                                <span>{product.rating ? Number(product.rating).toFixed(1) : '4.8'}</span>
                                <span>★</span>
                            </div>
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                                {product.reviews || 24} ratings & {reviews.length} reviews
                            </span>
                            <span style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: '600' }}>
                                • Netrave Choice
                            </span>
                        </div>

                        {/* Price box */}
                        <div className="product-price-box" style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                            <span className="current-price" style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary)' }}>₹{product.price}</span>
                            {hasDiscount && (
                                <>
                                    <span className="original-price" style={{ fontSize: '15px', color: '#64748b', textDecoration: 'line-through' }}>₹{product.originalPrice}</span>
                                    <span className="discount-badge" style={{ fontSize: '12.5px', fontWeight: '800', color: '#10b981' }}>{discountPct}% OFF</span>
                                </>
                            )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '14px' }}>
                            Inclusive of all taxes
                        </div>

                        <p className="product-desc" style={{ fontSize: '13px', lineHeight: '1.5', color: '#94a3b8', marginBottom: '16px' }}>
                            {product.description}
                        </p>

                        {/* Sizes Selector */}
                        <div className="sizes-section" style={{ marginBottom: '16px' }}>
                            <div className="section-label-row">
                                <span className="label-title" style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Select Size:</span>
                                {sizeError && <span className="error-msg" style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>Please choose a size!</span>}
                            </div>
                            <div className="sizes-grid" style={{ animation: sizeError && !selectedSize ? 'shake 0.3s ease-in-out' : 'none', marginTop: '8px' }}>
                                {product.sizes && product.sizes.map(size => (
                                    <button 
                                        key={size}
                                        className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedSize(size);
                                            setSizeError(false);
                                        }}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Flipkart / Amazon Pincode & Delivery Checker */}
                        <div style={{
                            background: '#0d101a',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            marginBottom: '18px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>📍</span> Delivery Options & Speed
                                </span>
                            </div>

                            <form onSubmit={handleCheckPincode} style={{ display: 'flex', gap: '6px', width: '100%' }}>
                                <input 
                                    type="text"
                                    maxLength="6"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter 6-digit Pincode"
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        background: '#141824',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '12.5px',
                                        padding: '6px 10px',
                                        outline: 'none',
                                        fontFamily: 'inherit'
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid var(--primary)',
                                        color: 'var(--primary)',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}
                                >
                                    {pincodeLoading ? 'Checking...' : 'Check'}
                                </button>
                            </form>

                            {pincodeChecked && (
                                <div style={{ marginTop: '8px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>🚚</span> Delivery by <strong>{estDateFormatted}</strong> ({product.price >= 499 ? 'FREE' : '₹60 Delivery'})
                                    </div>
                                    <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                                        ✓ Dispatch via Delhivery / BlueDart Express Logistics
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stock status indicator */}
                        <div className="stock-status-box" style={{ margin: '10px 0 16px', fontSize: '13px' }}>
                            {product.stock <= 0 || !product.inStock ? (
                                <span className="status-badge out" style={{ color: 'var(--error)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--error)', marginRight: '8px' }}></span>
                                    Temporarily Out of Stock
                                </span>
                            ) : product.stock <= 5 ? (
                                <span className="status-badge warning" style={{ color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)', marginRight: '8px' }}></span>
                                    Hurry! Only {product.stock} items left in stock!
                                </span>
                            ) : (
                                <span className="status-badge in-stock" style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', marginRight: '8px' }}></span>
                                    In Stock & Ready for Courier Dispatch
                                </span>
                            )}
                        </div>

                        {/* Quantity and Dual Action Buttons (Add to Cart + Buy Now) */}
                        <div className="qty-action-section quickview-actions-row">
                            <div className="qty-container" style={{ opacity: (product.stock <= 0 || !product.inStock) ? 0.5 : 1, pointerEvents: (product.stock <= 0 || !product.inStock) ? 'none' : 'auto' }}>
                                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease Quantity">
                                    <svg viewBox="0 0 24 24" className="icon"><path d="M19 13H5v-2h14v2z"/></svg>
                                </button>
                                <span className="qty-val">{qty}</span>
                                <button className="qty-btn" onClick={() => setQty(q => Math.min(product.stock, q + 1))} aria-label="Increase Quantity">
                                    <svg viewBox="0 0 24 24" className="icon"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                                </button>
                            </div>

                            <button 
                                className={`cta-btn primary-cta add-to-cart-btn ${(product.stock <= 0 || !product.inStock) ? 'disabled' : ''}`} 
                                onClick={handleAddToCartClick}
                                disabled={product.stock <= 0 || !product.inStock}
                                style={{ flex: 1, minWidth: '110px', backgroundColor: (product.stock <= 0 || !product.inStock) ? '#374151' : 'rgba(245, 158, 11, 0.15)', color: 'var(--primary)', border: '1px solid var(--primary)', cursor: (product.stock <= 0 || !product.inStock) ? 'not-allowed' : 'pointer', fontWeight: '800' }}
                            >
                                🛒 Add To Cart
                            </button>

                            <button 
                                className={`cta-btn primary-cta ${(product.stock <= 0 || !product.inStock) ? 'disabled' : ''}`} 
                                onClick={handleBuyNowClick}
                                disabled={product.stock <= 0 || !product.inStock}
                                style={{ flex: 1, minWidth: '110px', backgroundColor: (product.stock <= 0 || !product.inStock) ? '#374151' : 'var(--primary)', color: '#0a0b0e', cursor: (product.stock <= 0 || !product.inStock) ? 'not-allowed' : 'pointer', fontWeight: '800' }}
                            >
                                ⚡ Buy Now
                            </button>
                        </div>

                        {/* Trust Badges (Flipkart/Amazon style) */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '8px',
                            marginTop: '18px',
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            paddingTop: '14px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#cbd5e1' }}>
                                <span style={{ fontSize: '16px' }}>🛡️</span>
                                <span>100% Genuine Apparel</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#cbd5e1' }}>
                                <span style={{ fontSize: '16px' }}>🔄</span>
                                <span>7-Day Easy Exchange</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#cbd5e1' }}>
                                <span style={{ fontSize: '16px' }}>💳</span>
                                <span>Secure Razorpay / UPI</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#cbd5e1' }}>
                                <span style={{ fontSize: '16px' }}>🚚</span>
                                <span>Live Courier Tracking</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* VERIFIED BUYER REVIEWS LOG SECTION */}
                <div className="reviews-section-wrapper" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🛡️ Customer Reviews & Ratings
                        <span style={{ fontSize: '11px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '2px 8px', borderRadius: '10px' }}>
                            {reviews.length} reviews
                        </span>
                    </h3>

                    {reviewsLoading ? (
                        <p style={{ color: '#64748b', fontSize: '13px' }}>Loading customer reviews...</p>
                    ) : reviews.length === 0 ? (
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No purchase reviews available for this product yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {reviews.map((rev, index) => (
                                <div key={index} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                                        <div>
                                            <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {rev.customerName}
                                                <span style={{ fontSize: '10.5px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                                                    ✓ Verified Buyer
                                                </span>
                                            </span>
                                            <div style={{ display: 'flex', color: '#f59e0b', fontSize: '12px', marginTop: '3px' }}>
                                                {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                            </div>
                                        </div>
                                        <span style={{ color: '#64748b', fontSize: '11px' }}>{formatReviewDate(rev.date)}</span>
                                    </div>
                                    <p style={{ color: '#cbd5e1', fontSize: '12.5px', margin: 0, lineHeight: '1.4' }}>
                                        {rev.comment}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
