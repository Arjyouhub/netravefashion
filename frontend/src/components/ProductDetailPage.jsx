import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

export default function ProductDetailPage({
    product,
    allProducts = [],
    onAddToCart,
    onBuyNow,
    isWishlisted = false,
    onToggleWishlist,
    onNavigate,
    onQuickView
}) {
    if (!product) {
        return (
            <div className="netrave-page-wrapper empty-state-container">
                <div className="netrave-container">
                    <h2>Product Not Found</h2>
                    <p>The product you are looking for is unavailable.</p>
                    <button type="button" className="btn-primary-yellow" onClick={() => onNavigate && onNavigate('home')}>
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || 'White');
    const [selectedSize, setSelectedSize] = useState(product.sizes?.[2] || product.sizes?.[0] || 'M');
    const [quantity, setQuantity] = useState(1);
    const [toastMessage, setToastMessage] = useState(null);

    // Compute images list based on color variant or product images
    const activeColorVariant = product.colorVariants?.find(cv => cv.color === selectedColor);
    const galleryImages = (activeColorVariant?.images && activeColorVariant.images.length > 0)
        ? activeColorVariant.images
        : (product.images && product.images.length > 0)
            ? product.images
            : [product.image];

    useEffect(() => {
        setSelectedImageIndex(0);
    }, [selectedColor]);

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPct = hasDiscount 
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
        : 0;

    const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL', 'XXL'];
    const availableColors = product.colors && product.colors.length > 0 ? product.colors : ['White', 'Black', 'Yellow', 'Red'];

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: product.title,
                text: `Check out ${product.title} on Netrave!`,
                url: window.location.href
            }).catch(() => {});
        } else {
            navigator.clipboard?.writeText(window.location.href);
            setToastMessage('Link copied to clipboard!');
            setTimeout(() => setToastMessage(null), 2000);
        }
    };

    const handleAddToCartClick = () => {
        if (onAddToCart) {
            onAddToCart(product, selectedSize, quantity, selectedColor);
            setToastMessage('Added to Cart! 🛒');
            setTimeout(() => setToastMessage(null), 2000);
        }
    };

    const handleBuyNowClick = () => {
        if (onBuyNow) {
            onBuyNow(product, selectedSize, quantity, selectedColor);
        } else if (onAddToCart) {
            onAddToCart(product, selectedSize, quantity, selectedColor);
            if (onNavigate) onNavigate('checkout');
        }
    };

    const relatedProducts = allProducts
        .filter(p => p.id !== product.id && (p.category === product.category || p.brand === product.brand))
        .slice(0, 4);

    return (
        <div className="netrave-page-wrapper pdp-master-page">
            {/* Mobile Only Header Bar */}
            <div className="pdp-mobile-top-bar">
                <button 
                    type="button" 
                    className="pdp-top-back-btn" 
                    onClick={() => onNavigate && onNavigate('home')}
                    aria-label="Back"
                >
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                </button>

                <div className="pdp-top-actions-right">
                    <button 
                        type="button" 
                        className={`pdp-top-icon-btn ${isWishlisted ? 'active' : ''}`}
                        onClick={() => onToggleWishlist && onToggleWishlist(product.id)}
                        aria-label="Wishlist"
                    >
                        <svg viewBox="0 0 24 24" width="22" height="22" fill={isWishlisted ? '#ef4444' : 'none'} stroke={isWishlisted ? '#ef4444' : '#111'} strokeWidth="2">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </button>

                    <button 
                        type="button" 
                        className="pdp-top-icon-btn"
                        onClick={handleShare}
                        aria-label="Share"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                        </svg>
                    </button>
                </div>
            </div>

            {toastMessage && (
                <div className="pdp-floating-toast">
                    {toastMessage}
                </div>
            )}

            <div className="netrave-container">
                {/* Desktop Breadcrumbs (Clean, modern e-commerce path) */}
                <div className="pdp-desktop-breadcrumb">
                    <button type="button" className="breadcrumb-link" onClick={() => onNavigate && onNavigate('home')}>Home</button>
                    <span className="breadcrumb-sep">/</span>
                    <button type="button" className="breadcrumb-link" onClick={() => onNavigate && onNavigate('category', { category: product.category || 'all' })}>
                        {product.category ? product.category.toUpperCase() : 'SHOP'}
                    </button>
                    <span className="breadcrumb-sep">/</span>
                    <span className="breadcrumb-current">{product.title}</span>
                </div>

                {/* 2-Column Responsive Layout */}
                <div className="product-detail-layout-grid">
                    {/* LEFT COLUMN: Gallery Viewport */}
                    <div className="pdp-gallery-inner">
                        {galleryImages.length > 1 && (
                            <div className="pdp-thumbnails-list">
                                {galleryImages.map((imgUrl, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={`pdp-thumb-btn ${selectedImageIndex === idx ? 'active' : ''}`}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        aria-label={`View photo ${idx + 1}`}
                                    >
                                        <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="pdp-thumb-img" />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="pdp-main-image-viewport">
                            <img 
                                src={galleryImages[selectedImageIndex] || product.image} 
                                alt={product.title} 
                                className="pdp-main-zoom-img" 
                            />
                            <button 
                                type="button" 
                                className={`pdp-floating-wishlist ${isWishlisted ? 'active' : ''}`}
                                onClick={() => onToggleWishlist && onToggleWishlist(product.id)}
                                aria-label="Add to Wishlist"
                            >
                                <svg viewBox="0 0 24 24" width="22" height="22" fill={isWishlisted ? '#ef4444' : 'none'} stroke={isWishlisted ? '#ef4444' : '#111'} strokeWidth="2">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Product Information & Controls */}
                    <div className="pdp-info-column">
                        <span className="pdp-brand-tag">{product.brand || 'NETRAVE PREMIUM'}</span>
                        <h1 className="pdp-title">{product.title}</h1>

                        {/* Rating row */}
                        <div className="pdp-rating-row">
                            <div className="pdp-rating-pill">
                                ⭐ {product.rating ? Number(product.rating).toFixed(1) : '4.5'}
                            </div>
                            <span className="pdp-reviews-count">({product.reviews || 120} customer ratings)</span>
                            <span className="pdp-verified-badge">✓ Verified In-Stock</span>
                        </div>

                        {/* Price row */}
                        <div className="pdp-price-row">
                            <span className="pdp-current-price">₹{product.price?.toLocaleString()}</span>
                            {hasDiscount && (
                                <>
                                    <span className="pdp-orig-price">₹{product.originalPrice?.toLocaleString()}</span>
                                    <span className="pdp-discount-pill">{discountPct}% OFF</span>
                                </>
                            )}
                        </div>
                        <p className="pdp-tax-notice">Inclusive of all taxes · Fast Delivery Available</p>

                        <hr className="pdp-divider" />

                        {/* Color Selector */}
                        {availableColors.length > 0 && (
                            <div className="pdp-option-group">
                                <label className="pdp-option-label">
                                    Color: <strong>{selectedColor}</strong>
                                </label>
                                <div className="pdp-color-swatches-row">
                                    {availableColors.map(c => {
                                        const cv = product.colorVariants?.find(v => v.color.toLowerCase() === c.toLowerCase());
                                        const hex = cv?.hex || (c.toLowerCase() === 'yellow' ? '#FFD400' : c.toLowerCase() === 'red' ? '#ef4444' : c.toLowerCase() === 'black' ? '#111111' : '#f3f4f6');
                                        return (
                                            <button
                                                key={c}
                                                type="button"
                                                className={`pdp-color-circle ${selectedColor === c ? 'selected' : ''}`}
                                                style={{ backgroundColor: hex }}
                                                onClick={() => setSelectedColor(c)}
                                                title={c}
                                                aria-label={`Select color ${c}`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Size Selector */}
                        {availableSizes.length > 0 && (
                            <div className="pdp-option-group">
                                <div className="pdp-size-header-row">
                                    <label className="pdp-option-label">
                                        Select Size: <strong>{selectedSize}</strong>
                                    </label>
                                    <span className="pdp-size-chart-link">Size Chart</span>
                                </div>
                                <div className="pdp-sizes-chips-row">
                                    {availableSizes.map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            className={`pdp-size-chip ${selectedSize === s ? 'selected' : ''}`}
                                            onClick={() => setSelectedSize(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity Stepper */}
                        <div className="pdp-option-group">
                            <label className="pdp-option-label">Quantity:</label>
                            <div className="pdp-qty-stepper">
                                <button 
                                    type="button" 
                                    className="pdp-qty-btn"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    disabled={quantity <= 1}
                                    aria-label="Decrease quantity"
                                >
                                    -
                                </button>
                                <span className="pdp-qty-val">{quantity}</span>
                                <button 
                                    type="button" 
                                    className="pdp-qty-btn"
                                    onClick={() => setQuantity(q => q + 1)}
                                    aria-label="Increase quantity"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Desktop Action Buttons */}
                        <div className="pdp-actions-row">
                            <button 
                                type="button" 
                                className="pdp-btn-add-cart"
                                onClick={handleAddToCartClick}
                            >
                                Add to Cart 🛒
                            </button>
                            <button 
                                type="button" 
                                className="pdp-btn-buy-now"
                                onClick={handleBuyNowClick}
                            >
                                Buy Now ⚡
                            </button>
                        </div>

                        {/* Assurance Perks */}
                        <div className="pdp-assurance-cards-grid">
                            <div className="assurance-card-item">
                                <span className="assurance-icon">🚚</span>
                                <div>
                                    <strong>Free Express Shipping</strong>
                                    <p>Fast dispatch within 24-48 hrs</p>
                                </div>
                            </div>
                            <div className="assurance-card-item">
                                <span className="assurance-icon">🔄</span>
                                <div>
                                    <strong>7-Day Easy Returns</strong>
                                    <p>Hassle-free exchange guarantee</p>
                                </div>
                            </div>
                            <div className="assurance-card-item">
                                <span className="assurance-icon">🛡️</span>
                                <div>
                                    <strong>100% Genuine Product</strong>
                                    <p>Certified Netrave authentic luxury</p>
                                </div>
                            </div>
                        </div>

                        {/* Product Details Section */}
                        <div className="pdp-info-block">
                            <h3>Product Description</h3>
                            <p>{product.description || product.shortDescription || 'Designed for premium comfort and signature street-ready style. Crafted with high-grade breathable materials with refined finishing.'}</p>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="pdp-related-products-section" style={{ marginTop: '56px', paddingTop: '32px', borderTop: '1px solid #e5e7eb' }}>
                        <h2 className="section-main-heading" style={{ marginBottom: '24px' }}>
                            You Might Also Like
                        </h2>
                        <div className="netrave-products-grid">
                            {relatedProducts.map(rel => (
                                <ProductCard
                                    key={rel.id}
                                    product={rel}
                                    onQuickView={onQuickView}
                                    isWishlisted={isWishlisted}
                                    onToggleWishlist={onToggleWishlist}
                                    onAddToCart={onAddToCart}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
