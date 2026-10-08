import React, { useState } from 'react';

export default function ProductCard({ 
    product, 
    onQuickView, 
    isWishlisted = false, 
    onToggleWishlist,
    onAddToCart
}) {
    const [selectedColorVar, setSelectedColorVar] = useState(null);
    const [isAdded, setIsAdded] = useState(false);

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPct = hasDiscount 
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
        : 0;

    const isOutOfStock = product.stock <= 0 || product.inStock === false;
    const colorVars = Array.isArray(product.colorVariants) && product.colorVariants.length > 0 ? product.colorVariants : [];

    const mainImage = (selectedColorVar && selectedColorVar.image) 
        || product.image 
        || (product.images && product.images[0]) 
        || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80';

    const handleAddClick = (e) => {
        e.stopPropagation();
        if (isOutOfStock) return;
        if (onAddToCart) {
            const chosenSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M';
            const chosenColor = selectedColorVar ? selectedColorVar.color : (product.colors && product.colors[0] ? product.colors[0] : 'Default');
            onAddToCart(product, chosenSize, 1, chosenColor);
            setIsAdded(true);
            setTimeout(() => setIsAdded(false), 1500);
        } else if (onQuickView) {
            onQuickView(product.id);
        }
    };

    return (
        <div 
            className={`netrave-product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
            onClick={() => onQuickView && onQuickView(product.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onQuickView && onQuickView(product.id); }}
        >
            {/* Top Badges (Discount Green, New Yellow, Bestseller Orange) */}
            <div className="card-top-badges">
                {hasDiscount && discountPct >= 10 ? (
                    <span className="card-badge badge-green-discount">{discountPct}% OFF</span>
                ) : product.isNewArrival ? (
                    <span className="card-badge badge-yellow">New</span>
                ) : product.isBestSeller ? (
                    <span className="card-badge badge-orange">Best Seller</span>
                ) : null}
            </div>

            {/* Wishlist Heart Icon Button */}
            <button
                type="button"
                className={`card-wishlist-btn ${isWishlisted ? 'active' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleWishlist) onToggleWishlist(product.id);
                }}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                title={isWishlisted ? "In Wishlist" : "Add to Wishlist"}
            >
                <svg viewBox="0 0 24 24" className="card-wishlist-icon">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </button>

            {/* Product Image */}
            <div className="card-image-box">
                <img 
                    src={mainImage} 
                    alt={product.title} 
                    className="card-product-img" 
                    loading="lazy" 
                />
                {isOutOfStock && <div className="card-soldout-overlay">Sold Out</div>}
            </div>

            {/* Content Details */}
            <div className="card-body">
                <h3 className="card-product-title" title={product.title}>
                    {product.title}
                </h3>

                {/* Pricing Row */}
                <div className="card-price-row">
                    <span className="card-price-current">₹{product.price?.toLocaleString()}</span>
                    {hasDiscount && (
                        <span className="card-price-original">₹{product.originalPrice?.toLocaleString()}</span>
                    )}
                </div>

                {/* Rating Row (Yellow Star + Score + Reviews) */}
                <div className="card-rating-row">
                    <span className="card-star-icon">⭐</span>
                    <span className="card-rating-score">{product.rating ? Number(product.rating).toFixed(1) : '4.5'}</span>
                    <span className="card-review-count">({product.reviews || 98})</span>
                </div>

                {/* Full-width Add to Cart Yellow Button */}
                <button
                    type="button"
                    className={`card-add-btn ${isAdded ? 'added' : ''}`}
                    onClick={handleAddClick}
                    disabled={isOutOfStock}
                >
                    {isOutOfStock ? 'Sold Out' : isAdded ? '✓ Added' : 'Add to Cart'}
                </button>
            </div>
        </div>
    );
}
