import React from 'react';

export default function ProductCard({ 
    product, 
    onQuickView, 
    isWishlisted = false, 
    onToggleWishlist 
}) {
    const hasDiscount = product.originalPrice > product.price;
    const discountPct = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    const capitalize = (str) => {
        if (!str) return '';
        return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const isOutOfStock = product.stock <= 0 || product.inStock === false;

    // Display image: fallback if not loaded
    const mainImage = product.image || (product.images && product.images[0]) || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%230f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23475569" font-family="sans-serif" font-size="14" font-weight="bold">NO IMAGE</text></svg>';

    return (
        <div className={`product-card ${isOutOfStock ? 'card-out-of-stock' : ''}`} style={{ position: 'relative' }}>
            {/* Wishlist Heart Button */}
            <button
                type="button"
                className={`wishlist-heart-btn ${isWishlisted ? 'active' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleWishlist) onToggleWishlist(product.id);
                }}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 4,
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isWishlisted ? 'rgba(239, 68, 68, 0.9)' : 'rgba(10, 11, 14, 0.65)',
                    backdropFilter: 'blur(8px)',
                    border: isWishlisted ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}
            >
                <svg 
                    viewBox="0 0 24 24" 
                    style={{ 
                        width: '16px', 
                        height: '16px', 
                        fill: isWishlisted ? '#ffffff' : 'none', 
                        stroke: isWishlisted ? '#ffffff' : '#e2e8f0', 
                        strokeWidth: '2' 
                    }}
                >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </button>

            {/* Product Image Wrapper */}
            <div className="product-img-wrapper" onClick={() => onQuickView(product.id)} style={{ cursor: 'pointer', position: 'relative' }}>
                {/* Badges container */}
                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 3 }}>
                    {isOutOfStock ? (
                        <span className="badge-soldout">Sold Out</span>
                    ) : (
                        <>
                            {hasDiscount && (
                                <span className="badge-discount">
                                    {discountPct}% OFF
                                </span>
                            )}
                            {product.isBestSeller && (
                                <span style={{
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: '#000',
                                    fontSize: '9px',
                                    fontWeight: '900',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.4px'
                                }}>
                                    🔥 BESTSELLER
                                </span>
                            )}
                            {product.isNewArrival && (
                                <span style={{
                                    background: '#38bdf8',
                                    color: '#000',
                                    fontSize: '9px',
                                    fontWeight: '900',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.4px'
                                }}>
                                    ✨ NEW
                                </span>
                            )}
                        </>
                    )}
                </div>

                <img 
                    src={mainImage} 
                    alt={product.title} 
                    className="product-img" 
                    style={{ filter: isOutOfStock ? 'grayscale(0.6) opacity(0.5)' : 'none' }}
                    loading="lazy" 
                />

                <button className="quickview-btn" onClick={(e) => { e.stopPropagation(); onQuickView(product.id); }}>
                    <svg viewBox="0 0 24 24" className="icon" style={{ width: '16px', height: '16px' }}>
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    {isOutOfStock ? 'View Details' : 'Quick View'}
                </button>
            </div>

            {/* Product Meta & Content */}
            <div className="product-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span className="prod-category">
                        {product.brand ? `${product.brand} • ` : ''}{capitalize(product.category)}
                    </span>
                    
                    {/* Star Rating Pill */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        background: '#15803d',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        lineHeight: '1.2'
                    }}>
                        <span>{product.rating ? Number(product.rating).toFixed(1) : '4.8'}</span>
                        <span style={{ fontSize: '9px' }}>★</span>
                    </div>
                </div>

                <h3 className="prod-title" onClick={() => onQuickView(product.id)} style={{ cursor: 'pointer' }}>
                    {product.title}
                </h3>

                {/* Subcategory or Short Description if available */}
                {product.shortDescription && (
                    <p style={{
                        fontSize: '11.5px',
                        color: '#94a3b8',
                        margin: '0 0 8px',
                        lineHeight: '1.3',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {product.shortDescription}
                    </p>
                )}

                {/* Price and Add button */}
                <div className="prod-footer">
                    <div className="price-container">
                        <span className="curr-price">₹{product.price}</span>
                        {hasDiscount && <span className="orig-price">₹{product.originalPrice}</span>}
                    </div>
                    <button 
                        className={`add-card-btn ${isOutOfStock ? 'disabled' : ''}`} 
                        onClick={() => onQuickView(product.id)}
                        disabled={isOutOfStock}
                        aria-label={isOutOfStock ? "Out of stock" : "Select options and buy"}
                        title={isOutOfStock ? "Out of stock" : "Select options"}
                    >
                        {isOutOfStock ? (
                            <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '0 4px' }}>N/A</span>
                        ) : (
                            <svg viewBox="0 0 24 24" className="icon" style={{ width: '20px', height: '20px' }}>
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
