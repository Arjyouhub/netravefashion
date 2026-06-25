import React from 'react';

export default function ProductCard({ product, onQuickView }) {
    const hasDiscount = product.originalPrice > product.price;
    const discountPct = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const stars = [];
        
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <svg 
                    key={i} 
                    viewBox="0 0 24 24" 
                    className={`star-icon ${i <= fullStars ? '' : 'empty'}`}
                >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
            );
        }
        return stars;
    };

    const capitalize = (str) => {
        if (!str) return '';
        return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const isOutOfStock = product.stock <= 0 || product.inStock === false;

    return (
        <div className={`product-card ${isOutOfStock ? 'card-out-of-stock' : ''}`}>
            <div className="product-img-wrapper" onClick={() => onQuickView(product.id)} style={{ cursor: 'pointer' }}>
                {isOutOfStock ? (
                    <span className="badge-soldout">Sold Out</span>
                ) : (
                    <>
                        {product.tags && product.tags.includes('New') && <span className="badge-new">New</span>}
                        {hasDiscount && <span className="badge-discount">{discountPct}% OFF</span>}
                    </>
                )}
                <img 
                    src={product.image} 
                    alt={product.title} 
                    className="product-img" 
                    style={{ filter: isOutOfStock ? 'grayscale(0.6) opacity(0.5)' : 'none' }}
                    loading="lazy" 
                />
                <button className="quickview-btn" onClick={() => onQuickView(product.id)}>
                    <svg viewBox="0 0 24 24" className="icon" style={{ width: '16px', height: '16px' }}>
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    {isOutOfStock ? 'Out of Stock' : 'Quick View'}
                </button>
            </div>
            <div className="product-info">
                <span className="prod-category">{capitalize(product.category)}</span>
                <h3 className="prod-title">{product.title}</h3>
                <div className="prod-rating">
                    <div className="stars">{renderStars(product.rating)}</div>
                    <span className="rating-num">({product.reviews})</span>
                </div>
                <div className="prod-footer">
                    <div className="price-container">
                        {hasDiscount && <span className="orig-price">₹{product.originalPrice}</span>}
                        <span className="curr-price">₹{product.price}</span>
                    </div>
                    <button 
                        className={`add-card-btn ${isOutOfStock ? 'disabled' : ''}`} 
                        onClick={() => onQuickView(product.id)}
                        disabled={isOutOfStock}
                        aria-label={isOutOfStock ? "Out of stock" : "Configure size options"}
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
