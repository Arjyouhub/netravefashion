import React, { useState, useEffect } from 'react';

export default function ProductModal({ 
    isOpen, 
    product, 
    allProducts = [],
    onClose, 
    onAddToCart, 
    onBuyNow,
    API_BASE_URL,
    isWishlisted = false,
    onToggleWishlist,
    onQuickView
}) {
    // Gallery States
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

    // Dynamic Variant Selections (e.g. { Size: 'M', Color: 'Black' })
    const [selectedOptions, setSelectedOptions] = useState({});
    const [qty, setQty] = useState(1);
    const [variantError, setVariantError] = useState('');

    // Pincode Delivery Estimator
    const [pincode, setPincode] = useState('673001');
    const [pincodeChecked, setPincodeChecked] = useState(true);
    const [pincodeLoading, setPincodeLoading] = useState(false);

    // Reviews states
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    // Recently Viewed Products
    const [recentlyViewedIds, setRecentlyViewedIds] = useState([]);
    const [selectedColor, setSelectedColor] = useState('');

    // Available Color Variants (Flipkart Style)
    const availableColorVariants = product
        ? (Array.isArray(product.colorVariants) && product.colorVariants.length > 0
            ? product.colorVariants
            : (Array.isArray(product.colors) && product.colors.length > 0
                ? product.colors.map(col => ({
                    color: col,
                    hex: col.toLowerCase().includes('black') ? '#090b10' : col.toLowerCase().includes('white') ? '#ffffff' : col.toLowerCase().includes('red') ? '#dc2626' : col.toLowerCase().includes('blue') ? '#1e3a8a' : col.toLowerCase().includes('green') ? '#15803d' : '#475569',
                    image: product.image || '',
                    images: product.images || []
                }))
                : []))
        : [];

    const activeColorVariant = availableColorVariants.find(cv => cv.color === selectedColor) || availableColorVariants[0] || null;

    // Dynamic Image List for Selected Color
    let imagesList = [];
    if (activeColorVariant) {
        if (Array.isArray(activeColorVariant.images) && activeColorVariant.images.length > 0) {
            imagesList = [...activeColorVariant.images];
        } else if (activeColorVariant.image) {
            imagesList = [activeColorVariant.image];
            if (Array.isArray(product.images)) {
                product.images.forEach(img => {
                    if (!imagesList.includes(img)) imagesList.push(img);
                });
            }
        }
    }
    if (imagesList.length === 0) {
        imagesList = product
            ? (Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80'])
            : [];
    }

    const activeImage = imagesList[activeImageIndex] || imagesList[0];

    // Reset local state & record recently viewed on product change
    useEffect(() => {
        if (!isOpen || !product) return;

        setActiveImageIndex(0);
        setQty(1);
        setVariantError('');

        // Determine default Color
        const defaultColor = (product.colorVariants && product.colorVariants[0]?.color)
            || (product.colors && product.colors[0])
            || '';
        setSelectedColor(defaultColor);

        // Initialize default option selections
        const initial = {};
        if (defaultColor) initial['Color'] = defaultColor;

        if (Array.isArray(product.variantOptions) && product.variantOptions.length > 0) {
            product.variantOptions.forEach(opt => {
                if (opt.values && opt.values.length > 0) {
                    initial[opt.name] = opt.values[0];
                }
            });
        } else {
            if (Array.isArray(product.sizes) && product.sizes.length > 0) {
                initial['Size'] = product.sizes[0];
            }
        }
        setSelectedOptions(initial);

        // Track recently viewed in localStorage
        try {
            const stored = JSON.parse(localStorage.getItem('netrave_recently_viewed')) || [];
            const updated = [product.id, ...stored.filter(id => id !== product.id)].slice(0, 6);
            localStorage.setItem('netrave_recently_viewed', JSON.stringify(updated));
            setRecentlyViewedIds(updated.filter(id => id !== product.id));
        } catch { }

        // Fetch reviews
        if (API_BASE_URL) {
            setReviewsLoading(true);
            fetch(`${API_BASE_URL}/products/${product.id}/reviews`)
                .then(res => res.json())
                .then(data => {
                    setReviews(Array.isArray(data) ? data : []);
                    setReviewsLoading(false);
                })
                .catch(err => {
                    console.error('Error loading reviews:', err);
                    setReviewsLoading(false);
                });
        }
    }, [product, isOpen, API_BASE_URL]);

    if (!isOpen || !product) return null;

    // Resolve matching specific variant combination if defined
    let matchedVariant = null;
    if (Array.isArray(product.variants) && product.variants.length > 0) {
        matchedVariant = product.variants.find(v => {
            if (!v.options) return false;
            return Object.entries(selectedOptions).every(([key, val]) => v.options[key] === val);
        });
    }

    // Determine current effective price and stock
    const currentPrice = matchedVariant?.price !== undefined ? matchedVariant.price : product.price;
    const currentStock = matchedVariant?.stock !== undefined ? matchedVariant.stock : (product.stock !== undefined ? product.stock : 50);
    const isOutOfStock = currentStock <= 0 || product.inStock === false;
    const currentSku = matchedVariant?.sku || product.sku || `NET-${product.id}`;

    const hasDiscount = product.originalPrice > currentPrice;
    const discountPct = hasDiscount ? Math.round(((product.originalPrice - currentPrice) / product.originalPrice) * 100) : 0;

    // Related Products (same category/subcategory)
    const relatedProducts = allProducts
        .filter(p => p.id !== product.id && (p.category === product.category || p.subcategory === product.subcategory))
        .slice(0, 4);

    // Recently viewed product models
    const recentlyViewedProducts = allProducts.filter(p => recentlyViewedIds.includes(p.id)).slice(0, 4);

    // Flipkart-style Color Selection Handler
    const handleSelectColor = (colorName) => {
        setSelectedColor(colorName);
        setSelectedOptions(prev => ({ ...prev, Color: colorName }));
        setActiveImageIndex(0);
        setVariantError('');
    };

    const handleSelectOption = (optName, val) => {
        if (optName === 'Color') {
            handleSelectColor(val);
            return;
        }
        setSelectedOptions(prev => {
            const updated = { ...prev, [optName]: val };
            if (Array.isArray(product.variants)) {
                const match = product.variants.find(v => {
                    if (!v.options) return false;
                    return Object.entries(updated).every(([k, vVal]) => v.options[k] === vVal);
                });
                if (match?.image) {
                    const idx = imagesList.indexOf(match.image);
                    if (idx !== -1) setActiveImageIndex(idx);
                }
            }
            return updated;
        });
        setVariantError('');
    };

    const handleAddToCartClick = () => {
        if (isOutOfStock) {
            setVariantError('This selected variant is currently out of stock.');
            return;
        }
        const cartItemPayload = {
            ...product,
            price: currentPrice,
            stock: currentStock,
            sku: currentSku,
            selectedOptions: selectedOptions,
            size: selectedOptions['Size'] || (product.sizes?.[0] || 'M'),
            color: selectedOptions['Color'] || (product.colors?.[0] || ''),
            image: activeImage
        };
        onAddToCart(cartItemPayload, selectedOptions['Size'] || 'M', qty);
    };

    const handleBuyNowClick = () => {
        if (isOutOfStock) {
            setVariantError('This selected variant is currently out of stock.');
            return;
        }
        const cartItemPayload = {
            ...product,
            price: currentPrice,
            stock: currentStock,
            sku: currentSku,
            selectedOptions: selectedOptions,
            size: selectedOptions['Size'] || (product.sizes?.[0] || 'M'),
            color: selectedOptions['Color'] || (product.colors?.[0] || ''),
            image: activeImage
        };
        if (onBuyNow) {
            onBuyNow(cartItemPayload, selectedOptions['Size'] || 'M', qty);
        } else {
            onAddToCart(cartItemPayload, selectedOptions['Size'] || 'M', qty);
        }
    };

    const handleMouseMoveZoom = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomPos({ x, y });
    };

    const handleCheckPincode = (e) => {
        e.preventDefault();
        if (!pincode || pincode.trim().length < 6) return;
        setPincodeLoading(true);
        setTimeout(() => {
            setPincodeLoading(false);
            setPincodeChecked(true);
        }, 300);
    };

    // Estimated delivery format
    const estDeliveryDate = new Date();
    estDeliveryDate.setDate(estDeliveryDate.getDate() + 3);
    const estDateFormatted = estDeliveryDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }} style={{ zIndex: 1090 }}>
            <div className="modal-content product-quickview" style={{ 
                overflowY: 'auto', 
                maxHeight: '94vh', 
                background: 'linear-gradient(180deg, #111422 0%, #090b10 100%)', 
                borderRadius: '20px', 
                border: '1px solid rgba(245, 158, 11, 0.25)',
                position: 'relative',
                maxWidth: '960px',
                padding: '24px'
            }}>
                {/* Close Button */}
                <button className="close-btn modal-close" onClick={onClose} aria-label="Close Modal" style={{ zIndex: 30 }}>&times;</button>

                {/* Wishlist Heart Button */}
                <button
                    type="button"
                    onClick={() => { if (onToggleWishlist) onToggleWishlist(product.id); }}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    aria-label="Wishlist"
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '56px',
                        zIndex: 25,
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
                
                {/* Main 2-Column Grid */}
                <div className="quickview-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                    {/* Left: Interactive Multi-Image Gallery with Zoom */}
                    <div className="quickview-gallery">
                        {/* Main Image Frame with Zoom */}
                        <div
                            className="main-image-container"
                            onMouseEnter={() => setIsZoomed(true)}
                            onMouseLeave={() => setIsZoomed(false)}
                            onMouseMove={handleMouseMoveZoom}
                            style={{
                                position: 'relative',
                                height: '380px',
                                background: '#090b10',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                cursor: 'crosshair',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
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
                                zIndex: 3
                            }}>
                                ⚡ NETRAVE ASSURED
                            </span>

                            <img 
                                src={activeImage} 
                                alt={product.title}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    transform: isZoomed ? 'scale(1.75)' : 'scale(1)',
                                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                                    transition: isZoomed ? 'none' : 'transform 0.3s ease'
                                }}
                            />
                        </div>

                        {/* Thumbnails Strip */}
                        {imagesList.length > 1 && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
                                {imagesList.map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveImageIndex(idx)}
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: activeImageIndex === idx ? '2px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                                            background: '#090b10',
                                            padding: 0,
                                            cursor: 'pointer',
                                            flexShrink: 0
                                        }}
                                    >
                                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Details & Purchase Options */}
                    <div className="quickview-details">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span className="product-tag">{product.brand || 'NETRAVE'}</span>
                            <span style={{ color: '#64748b', fontSize: '12px' }}>•</span>
                            <span style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: '700' }}>{product.category}</span>
                            {product.subcategory && (
                                <>
                                    <span style={{ color: '#64748b', fontSize: '12px' }}>/</span>
                                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                                        {typeof product.subcategory === 'object' ? (product.subcategory.name || product.subcategory.slug) : product.subcategory}
                                    </span>
                                </>
                            )}
                        </div>

                        <h1 className="product-title" style={{ fontSize: '22px', fontWeight: '800', lineHeight: '1.3', margin: '4px 0 8px', color: '#fff' }}>
                            {product.title}
                        </h1>
                        
                        {/* Rating row */}
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
                            <span style={{ color: '#64748b', fontSize: '12px' }}>
                                • SKU: {currentSku}
                            </span>
                        </div>

                        {/* Price box */}
                        <div className="product-price-box" style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                            <span className="current-price" style={{ fontSize: '26px', fontWeight: '900', color: 'var(--primary)' }}>
                                ₹{currentPrice}
                            </span>
                            {hasDiscount && (
                                <>
                                    <span className="original-price" style={{ fontSize: '16px', color: '#64748b', textDecoration: 'line-through' }}>
                                        ₹{product.originalPrice}
                                    </span>
                                    <span className="discount-badge" style={{ fontSize: '13px', fontWeight: '800', color: '#10b981' }}>
                                        {discountPct}% OFF
                                    </span>
                                </>
                            )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '14px' }}>
                            Inclusive of all taxes • Free express shipping on orders over ₹999
                        </div>

                        {/* Short Description */}
                        {product.shortDescription && (
                            <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 16px' }}>
                                {product.shortDescription}
                            </p>
                        )}

                        {/* 1. FLIPKART-STYLE COLOR VARIANT SELECTOR */}
                        {availableColorVariants.length > 0 && (
                            <div className="color-variant-selector-section" style={{ marginBottom: '18px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                        Color: <strong style={{ color: 'var(--primary)', textTransform: 'none', fontSize: '14px' }}>{selectedColor || 'Select a color'}</strong>
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                        {availableColorVariants.length} Color{availableColorVariants.length > 1 ? 's' : ''} Available
                                    </span>
                                </div>
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '10px', 
                                    overflowX: 'auto', 
                                    paddingBottom: '6px',
                                    paddingTop: '2px',
                                    WebkitOverflowScrolling: 'touch' 
                                }}>
                                    {availableColorVariants.map((cVar, idx) => {
                                        const isSelected = (selectedColor === cVar.color);
                                        return (
                                            <button
                                                key={cVar.color || idx}
                                                type="button"
                                                onClick={() => handleSelectColor(cVar.color)}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    padding: '6px',
                                                    borderRadius: '10px',
                                                    background: isSelected ? 'rgba(245, 158, 11, 0.12)' : '#12141c',
                                                    border: isSelected ? '2px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.14)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    position: 'relative',
                                                    minWidth: '68px',
                                                    maxWidth: '84px',
                                                    flexShrink: 0,
                                                    boxShadow: isSelected ? '0 0 16px rgba(245, 158, 11, 0.25)' : 'none',
                                                    transform: isSelected ? 'scale(1.03)' : 'scale(1)'
                                                }}
                                                title={`Select ${cVar.color}`}
                                            >
                                                {/* Selected Checkmark Badge */}
                                                {isSelected && (
                                                    <span style={{
                                                        position: 'absolute',
                                                        top: '-5px',
                                                        right: '-5px',
                                                        background: 'var(--primary)',
                                                        color: '#0a0b0e',
                                                        borderRadius: '50%',
                                                        width: '18px',
                                                        height: '18px',
                                                        fontSize: '11px',
                                                        fontWeight: '900',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                                                        zIndex: 3
                                                    }}>
                                                        ✓
                                                    </span>
                                                )}
                                                
                                                {/* Color Preview Image / Swatch */}
                                                <div style={{
                                                    width: '54px',
                                                    height: '54px',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    background: '#090b10',
                                                    marginBottom: '5px',
                                                    position: 'relative',
                                                    border: '1px solid rgba(255,255,255,0.08)'
                                                }}>
                                                    {cVar.image ? (
                                                        <img src={cVar.image} alt={cVar.color} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', backgroundColor: cVar.hex || '#1e293b' }} />
                                                    )}
                                                    {cVar.hex && (
                                                        <span style={{
                                                            position: 'absolute',
                                                            bottom: '2px',
                                                            right: '2px',
                                                            width: '12px',
                                                            height: '12px',
                                                            borderRadius: '50%',
                                                            backgroundColor: cVar.hex,
                                                            border: '1.5px solid #000'
                                                        }} />
                                                    )}
                                                </div>

                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: isSelected ? '800' : '600',
                                                    color: isSelected ? 'var(--primary)' : '#cbd5e1',
                                                    textAlign: 'center',
                                                    lineHeight: '1.2',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '70px'
                                                }}>
                                                    {cVar.color}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 2. SIZE SELECTOR */}
                        {(() => {
                            const sizesList = (product.variantOptions?.find(o => o.name?.toLowerCase() === 'size')?.values) 
                                || product.sizes 
                                || [];
                            if (sizesList.length === 0) return null;
                            const currentSize = selectedOptions['Size'] || sizesList[0];
                            return (
                                <div style={{ marginBottom: '18px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                            Select Size: <strong style={{ color: 'var(--primary)', textTransform: 'none', fontSize: '14px' }}>{currentSize}</strong>
                                        </span>
                                        <span style={{ fontSize: '11.5px', color: 'var(--primary)', cursor: 'pointer', fontWeight: '700' }}>
                                            📏 Size Chart
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {sizesList.map(size => {
                                            const isSelected = (currentSize === size);
                                            return (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => handleSelectOption('Size', size)}
                                                    style={{
                                                        background: isSelected ? 'var(--primary)' : '#141828',
                                                        color: isSelected ? '#0a0b0e' : '#fff',
                                                        border: isSelected ? '1.5px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.15)',
                                                        borderRadius: '8px',
                                                        padding: '8px 16px',
                                                        fontSize: '13px',
                                                        fontWeight: '800',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease',
                                                        minWidth: '48px',
                                                        boxShadow: isSelected ? '0 0 12px rgba(245, 158, 11, 0.25)' : 'none'
                                                    }}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 3. OTHER CUSTOM VARIANT OPTIONS (e.g. Fit, Material) */}
                        {Array.isArray(product.variantOptions) && product.variantOptions
                            .filter(opt => opt.name?.toLowerCase() !== 'size' && opt.name?.toLowerCase() !== 'color')
                            .map(option => (
                                <div key={option.name} style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                                            {option.name}: <strong style={{ color: 'var(--primary)' }}>{selectedOptions[option.name]}</strong>
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {option.values?.map(val => {
                                            const isSelected = selectedOptions[option.name] === val;
                                            return (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => handleSelectOption(option.name, val)}
                                                    style={{
                                                        background: isSelected ? 'var(--primary)' : '#141828',
                                                        color: isSelected ? '#0a0b0e' : '#fff',
                                                        border: isSelected ? '1.5px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.15)',
                                                        borderRadius: '8px',
                                                        padding: '7px 14px',
                                                        fontSize: '13px',
                                                        fontWeight: '700',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                >
                                                    {val}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                        {/* 4. FLIPKART STYLE TRUST & CONFIDENCE BADGES */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '8px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '10px',
                            padding: '12px',
                            marginBottom: '16px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '18px' }}>🛡️</span>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>100% Genuine</div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Netrave Assured Quality</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '18px' }}>🔄</span>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>7-Day Returns</div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Easy & Hassle-Free</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '18px' }}>🚚</span>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>Free Express Shipping</div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>On orders above ₹999</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '18px' }}>⚡</span>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>24h Fast Dispatch</div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Kerala Hub Express</div>
                                </div>
                            </div>
                        </div>

                        {variantError && (
                            <div style={{ color: '#ef4444', fontSize: '12.5px', fontWeight: '700', marginBottom: '10px' }}>
                                ⚠️ {variantError}
                            </div>
                        )}

                        {/* Stock status indicator */}
                        <div style={{ margin: '10px 0 16px', fontSize: '13px' }}>
                            {isOutOfStock ? (
                                <span style={{ color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                                    Selected Variant Temporarily Out of Stock
                                </span>
                            ) : currentStock <= 5 ? (
                                <span style={{ color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                                    Hurry! Only {currentStock} items left in stock!
                                </span>
                            ) : (
                                <span style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                    In Stock • Ready for 24h Courier Dispatch
                                </span>
                            )}
                        </div>

                        {/* Quantity and Dual Action Buttons (Add to Cart + Buy Now) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                            {/* Quantity Controls */}
                            <div className="qty-container" style={{ opacity: isOutOfStock ? 0.5 : 1, pointerEvents: isOutOfStock ? 'none' : 'auto', margin: 0 }}>
                                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease Quantity">
                                    -
                                </button>
                                <span className="qty-val">{qty}</span>
                                <button className="qty-btn" onClick={() => setQty(q => Math.min(currentStock, q + 1))} aria-label="Increase Quantity">
                                    +
                                </button>
                            </div>

                            {/* Add To Cart */}
                            <button
                                type="button"
                                className="cta-btn secondary-cta"
                                onClick={handleAddToCartClick}
                                disabled={isOutOfStock}
                                style={{
                                    opacity: isOutOfStock ? 0.5 : 1,
                                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                    borderRadius: '10px',
                                    padding: '12px 14px',
                                    fontSize: '13.5px',
                                    fontWeight: '800',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                🛒 Add to Bag
                            </button>

                            {/* Buy Now */}
                            <button
                                type="button"
                                className="cta-btn primary-cta"
                                onClick={handleBuyNowClick}
                                disabled={isOutOfStock}
                                style={{
                                    opacity: isOutOfStock ? 0.5 : 1,
                                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                    borderRadius: '10px',
                                    padding: '12px 14px',
                                    fontSize: '13.5px',
                                    fontWeight: '800',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                ⚡ Buy Now
                            </button>
                        </div>

                        {/* Pincode & Express Delivery Checker */}
                        <div style={{ background: '#0e121e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '12px 14px', marginBottom: '18px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
                                📍 Delivery Options & Courier Check
                            </div>
                            <form onSubmit={handleCheckPincode} style={{ display: 'flex', gap: '6px' }}>
                                <input 
                                    type="text"
                                    maxLength="6"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter 6-digit Pincode"
                                    style={{
                                        flex: 1,
                                        background: '#141826',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '12.5px',
                                        padding: '6px 10px',
                                        outline: 'none'
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
                                        cursor: 'pointer'
                                    }}
                                >
                                    {pincodeLoading ? 'Checking...' : 'Check'}
                                </button>
                            </form>
                            {pincodeChecked && (
                                <div style={{ marginTop: '8px', fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                                    🚚 Estimated delivery by <strong>{estDateFormatted}</strong> ({currentPrice >= 999 ? 'FREE Delivery' : '₹60 Delivery'})
                                </div>
                            )}
                        </div>

                        {/* Shipping & Return Policy Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11.5px', color: '#94a3b8', marginBottom: '20px' }}>
                            <div style={{ background: '#090c14', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>🚚 Dispatch Info:</strong>
                                {product.shippingInfo || 'Dispatched in 24 hours. Express courier tracking link sent via SMS/WhatsApp.'}
                            </div>
                            <div style={{ background: '#090c14', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>🔄 Returns & Exchange:</strong>
                                {product.returnInfo || '7-day hassle-free replacement on unworn items with tags attached.'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rich Product Description Rendering */}
                {product.description && (
                    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>
                            Product Details & Fabric Specifications
                        </h3>
                        <div 
                            className="rich-description-render"
                            dangerouslySetInnerHTML={{ __html: product.description }}
                            style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.6' }}
                        />
                    </div>
                )}

                {/* Specifications Table */}
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>
                        Technical Specifications
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12.5px' }}>
                        <div style={specItemStyle}>
                            <span style={{ color: '#64748b' }}>Brand:</span>
                            <strong style={{ color: '#fff' }}>{product.brand || 'NETRAVE'}</strong>
                        </div>
                        <div style={specItemStyle}>
                            <span style={{ color: '#64748b' }}>SKU:</span>
                            <strong style={{ color: '#fff' }}>{currentSku}</strong>
                        </div>
                        <div style={specItemStyle}>
                            <span style={{ color: '#64748b' }}>Category:</span>
                            <strong style={{ color: '#fff' }}>{product.category}</strong>
                        </div>
                        {product.weight && (
                            <div style={specItemStyle}>
                                <span style={{ color: '#64748b' }}>Weight:</span>
                                <strong style={{ color: '#fff' }}>{product.weight}</strong>
                            </div>
                        )}
                        {product.dimensions && (
                            <div style={specItemStyle}>
                                <span style={{ color: '#64748b' }}>Dimensions:</span>
                                <strong style={{ color: '#fff' }}>{product.dimensions}</strong>
                            </div>
                        )}
                        {product.tags?.length > 0 && (
                            <div style={specItemStyle}>
                                <span style={{ color: '#64748b' }}>Tags:</span>
                                <strong style={{ color: '#fff' }}>{product.tags.join(', ')}</strong>
                            </div>
                        )}
                    </div>
                </div>

                {/* Customer Reviews Section */}
                <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', margin: 0 }}>
                            Verified Customer Reviews ({reviews.length})
                        </h3>
                        <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '700' }}>
                            ✓ 100% Verified Purchases
                        </span>
                    </div>

                    {reviewsLoading ? (
                        <div style={{ color: '#94a3b8', fontSize: '13px', padding: '10px 0' }}>Loading reviews...</div>
                    ) : reviews.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: '13px', padding: '10px 0' }}>
                            No customer reviews yet. Be the first to review after receiving your order!
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                            {reviews.map((rev, i) => (
                                <div key={i} style={{ background: '#0e121e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <strong style={{ fontSize: '13px', color: '#fff' }}>{rev.customerName || 'Verified Buyer'}</strong>
                                        <span style={{ color: '#f59e0b', fontSize: '12px' }}>{'★'.repeat(rev.rating)}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.4' }}>
                                        "{rev.comment}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', marginBottom: '14px' }}>
                            You May Also Like
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                            {relatedProducts.map(rel => (
                                <div
                                    key={`rel-${rel.id}`}
                                    onClick={() => onQuickView(rel.id)}
                                    style={{
                                        background: '#0d111c',
                                        borderRadius: '10px',
                                        padding: '10px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <img src={rel.image} alt={rel.title} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '6px' }} />
                                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rel.title}</div>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--primary)', marginTop: '2px' }}>₹{rel.price}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recently Viewed Products */}
                {recentlyViewedProducts.length > 0 && (
                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#94a3b8', marginBottom: '10px' }}>
                            Recently Viewed
                        </h4>
                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                            {recentlyViewedProducts.map(rv => (
                                <div
                                    key={`rv-${rv.id}`}
                                    onClick={() => onQuickView(rv.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: '#0e121e',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '8px',
                                        padding: '6px 10px',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}
                                >
                                    <img src={rv.image} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rv.title}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--primary)' }}>₹{rv.price}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const specItemStyle = {
    background: '#0e121e',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};
