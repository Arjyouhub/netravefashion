import React, { useState, useEffect } from 'react';

export default function ProductModal({ isOpen, product, onClose, onAddToCart, API_BASE_URL }) {
    const [selectedSize, setSelectedSize] = useState('');
    const [qty, setQty] = useState(1);
    const [sizeError, setSizeError] = useState(false);

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

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <svg key={i} viewBox="0 0 24 24" className={`star-icon ${i <= fullStars ? '' : 'empty'}`}>
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
            );
        }
        return stars;
    };

    const formatReviewDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const hasDiscount = product.originalPrice > product.price;
    const discountPct = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }}>
            <div className="modal-content product-quickview" style={{ overflowY: 'auto', maxHeight: '90vh' }}>
                <button className="close-btn modal-close" onClick={onClose}>&times;</button>
                
                <div className="quickview-container">
                    {/* Left: Images */}
                    <div className="quickview-gallery">
                        <div className="main-image-container">
                            <img src={product.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%230f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23475569" font-family="sans-serif" font-size="14" font-weight="bold">NO IMAGE</text></svg>'} alt={product.title} />
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className="quickview-details">
                        <span className="product-tag">{product.category}</span>
                        <h2 className="product-title">{product.title}</h2>
                        
                        <div className="product-rating-box">
                            <div className="stars">
                                {renderStars(product.rating)}
                            </div>
                            <span className="rating-text">({product.reviews} customer reviews)</span>
                        </div>

                        <div className="product-price-box">
                            <span className="current-price">₹{product.price}</span>
                            {hasDiscount && (
                                <>
                                    <span className="original-price">₹{product.originalPrice}</span>
                                    <span className="discount-badge">{discountPct}% OFF</span>
                                </>
                            )}
                        </div>

                        <p className="product-desc">
                            {product.description}
                        </p>

                        {/* Sizes Selector */}
                        <div className="sizes-section">
                            <div className="section-label-row">
                                <span className="label-title">Select Size:</span>
                                {sizeError && <span className="error-msg">Please choose a size!</span>}
                            </div>
                            <div className="sizes-grid" style={{ animation: sizeError && !selectedSize ? 'shake 0.3s ease-in-out' : 'none' }}>
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

                        {/* Stock status indicator */}
                        <div className="stock-status-box" style={{ margin: '15px 0', fontSize: '14px' }}>
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
                                <span className="status-badge in-stock" style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', marginRight: '8px' }}></span>
                                    In Stock ({product.stock} available)
                                </span>
                            )}
                        </div>

                        {/* Quantity and Action Buttons */}
                        <div className="qty-action-section">
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
                                style={{ backgroundColor: (product.stock <= 0 || !product.inStock) ? '#374151' : 'var(--primary)', cursor: (product.stock <= 0 || !product.inStock) ? 'not-allowed' : 'pointer' }}
                            >
                                <svg viewBox="0 0 24 24" className="icon"><path d="M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-8.9-5h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4l-3.87 7H8.53L4.27 2H1v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25z"/></svg>
                                {(product.stock <= 0 || !product.inStock) ? 'Out of Stock' : 'Add To Cart'}
                            </button>
                        </div>

                        <div className="quick-highlights" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                            <div className="highlight-item">
                                <svg viewBox="0 0 24 24" className="h-icon"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
                                <span>100% Breathable Material</span>
                            </div>
                            <div className="highlight-item">
                                <svg viewBox="0 0 24 24" className="h-icon"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
                                <span>Premium Quality & Comfort</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* VERIFIED BUYER REVIEWS LOG SECTION */}
                <div className="reviews-section-wrapper" style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px', paddingLeft: '20px', paddingRight: '20px', paddingBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🛡️ Verified Purchase Reviews
                        <span style={{ fontSize: '12px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '3px 8px', borderRadius: '10px' }}>
                            {reviews.length} reviews
                        </span>
                    </h3>

                    {reviewsLoading ? (
                        <p style={{ color: '#64748b', fontSize: '13px' }}>Loading product feedback...</p>
                    ) : reviews.length === 0 ? (
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
                            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No purchase reviews available for this product yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '14px' }}>
                            {reviews.map((rev, index) => (
                                <div key={index} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                        <div>
                                            <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {rev.customerName}
                                                <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                                                    ✓ Verified Buyer
                                                </span>
                                            </span>
                                            <div style={{ display: 'flex', color: '#f59e0b', fontSize: '12px', marginTop: '4px' }}>
                                                {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                            </div>
                                        </div>
                                        <span style={{ color: '#64748b', fontSize: '11.5px' }}>{formatReviewDate(rev.date)}</span>
                                    </div>
                                    <p style={{ color: '#cbd5e1', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
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
