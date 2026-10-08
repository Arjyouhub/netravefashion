import React, { useState, useEffect, useRef } from 'react';

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
    onQuickView,
    cartCount = 0,
    onOpenCart
}) {
    // Gallery States
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedOptions, setSelectedOptions] = useState({});
    const [qty, setQty] = useState(1);
    const [variantError, setVariantError] = useState('');
    const [showShareToast, setShowShareToast] = useState(false);
    const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

    // Pincode Delivery Estimator
    const [pincode, setPincode] = useState('673001');
    const [pincodeChecked, setPincodeChecked] = useState(true);
    const [pincodeLoading, setPincodeLoading] = useState(false);

    // Reviews states
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [newReviewAuthor, setNewReviewAuthor] = useState('');
    const [newReviewRating, setNewReviewRating] = useState(5);
    const [newReviewComment, setNewReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

    // Recently Viewed
    const [recentlyViewedIds, setRecentlyViewedIds] = useState([]);

    const containerRef = useRef(null);

    // Color Swatch Generator Fallbacks if a product only has string colors
    const colorHexMap = {
        'black': '#0f172a',
        'charcoal': '#1e293b',
        'charcoal black': '#1e293b',
        'white': '#ffffff',
        'triple white': '#f8fafc',
        'olive': '#4b5320',
        'washed olive': '#4b5320',
        'army olive': '#3f4818',
        'grey': '#64748b',
        'vintage grey': '#64748b',
        'red': '#dc2626',
        'crimson red': '#dc2626',
        'maroon': '#881337',
        'royal maroon': '#881337',
        'green': '#065f46',
        'emerald green': '#065f46',
        'sage green': '#4d7c0f',
        'blue': '#0284c7',
        'peacock blue': '#0284c7',
        'sky blue': '#38bdf8',
        'navy': '#1e3a8a',
        'midnight navy': '#0f172a',
        'pink': '#f472b6',
        'dusty rose pink': '#f472b6',
        'rose': '#f43f5e',
        'yellow': '#eab308',
        'mustard gold': '#eab308',
        'gold': '#d97706',
        'orange': '#ea580c',
        'khaki': '#a8896c',
        'desert khaki': '#a8896c',
        'camo': '#4a5d3f',
        'olive camo': '#4a5d3f'
    };

    const getColorHex = (name) => {
        if (!name) return '#475569';
        const key = name.toLowerCase().trim();
        return colorHexMap[key] || '#475569';
    };

    // Available Color Variants (Flipkart Style with Dress Photos)
    const availableColorVariants = React.useMemo(() => {
        if (!product) return [];

        // 1. Direct colorVariants array with detailed image objects
        if (Array.isArray(product.colorVariants) && product.colorVariants.length > 0) {
            return product.colorVariants.map((cVar, idx) => ({
                color: cVar.color || `Color ${idx + 1}`,
                hex: cVar.hex || getColorHex(cVar.color),
                image: cVar.image || (Array.isArray(cVar.images) && cVar.images[0]) || product.image,
                images: Array.isArray(cVar.images) && cVar.images.length > 0 
                    ? cVar.images 
                    : [cVar.image || product.image]
            }));
        }

        // 2. If colors array of strings is provided
        if (Array.isArray(product.colors) && product.colors.length > 0) {
            const baseImgs = Array.isArray(product.images) && product.images.length > 0 
                ? product.images 
                : [product.image];

            return product.colors.map((colName, idx) => {
                const assignedImg = baseImgs[idx % baseImgs.length] || product.image;
                return {
                    color: colName,
                    hex: getColorHex(colName),
                    image: assignedImg,
                    images: [assignedImg, ...baseImgs.filter(img => img !== assignedImg)]
                };
            });
        }

        // 3. Fallback single color variant based on product
        return [{
            color: 'Standard',
            hex: '#f59e0b',
            image: product.image,
            images: Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image]
        }];
    }, [product]);

    // Active color variant object
    const activeColorVariant = availableColorVariants.find(cv => cv.color === selectedColor) 
        || availableColorVariants[0] 
        || null;

    // Dynamic Image List for Selected Dress Color
    let imagesList = [];
    if (activeColorVariant) {
        if (Array.isArray(activeColorVariant.images) && activeColorVariant.images.length > 0) {
            imagesList = [...activeColorVariant.images];
        } else if (activeColorVariant.image) {
            imagesList = [activeColorVariant.image];
            if (Array.isArray(product?.images)) {
                product.images.forEach(img => {
                    if (!imagesList.includes(img)) imagesList.push(img);
                });
            }
        }
    }
    if (imagesList.length === 0 && product) {
        imagesList = Array.isArray(product.images) && product.images.length > 0 
            ? product.images 
            : [product.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80'];
    }

    const activeImage = imagesList[activeImageIndex] || imagesList[0] || product?.image;

    // Prevent body background scrolling & setup Esc listener
    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (isSizeChartOpen) {
                    setIsSizeChartOpen(false);
                } else {
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, isSizeChartOpen, onClose]);

    // Reset local state & record recently viewed on product change
    useEffect(() => {
        if (!isOpen || !product) return;

        setActiveImageIndex(0);
        setQty(1);
        setVariantError('');
        setIsSizeChartOpen(false);

        // Determine default Color
        const defaultColor = (product.colorVariants && product.colorVariants[0]?.color)
            || (product.colors && product.colors[0])
            || (availableColorVariants[0]?.color)
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

        // Scroll full-screen container to top
        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }

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
                .catch(() => {
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

    // Pricing & Stock
    const currentPrice = matchedVariant?.price !== undefined ? matchedVariant.price : product.price;
    const currentStock = matchedVariant?.stock !== undefined ? matchedVariant.stock : (product.stock !== undefined ? product.stock : 50);
    const isOutOfStock = currentStock <= 0 || product.inStock === false;
    const currentSku = matchedVariant?.sku || product.sku || `NET-${product.id}`;

    const originalPrice = product.originalPrice || Math.round(currentPrice * 1.6);
    const hasDiscount = originalPrice > currentPrice;
    const discountPct = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

    // Related Products (same category/subcategory)
    const relatedProducts = allProducts
        .filter(p => p.id !== product.id && (p.category === product.category || p.subcategory === product.subcategory))
        .slice(0, 6);

    // Recently viewed products
    const recentlyViewedProducts = allProducts.filter(p => recentlyViewedIds.includes(p.id)).slice(0, 6);

    // Color Selection Handler (Flipkart Style)
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
            color: selectedColor || selectedOptions['Color'] || (product.colors?.[0] || ''),
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
            color: selectedColor || selectedOptions['Color'] || (product.colors?.[0] || ''),
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

    const handleShareClick = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            setShowShareToast(true);
            setTimeout(() => setShowShareToast(false), 2500);
        }
    };

    const handleSubmitReview = (e) => {
        e.preventDefault();
        if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;

        setReviewSubmitting(true);
        const payload = {
            productId: product.id,
            customerName: newReviewAuthor.trim(),
            rating: Number(newReviewRating),
            comment: newReviewComment.trim(),
            date: new Date().toISOString()
        };

        if (API_BASE_URL) {
            fetch(`${API_BASE_URL}/products/${product.id}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(() => {
                    setReviews(prev => [payload, ...prev]);
                    setNewReviewAuthor('');
                    setNewReviewComment('');
                    setReviewSuccessMsg('Thank you! Your verified review has been posted.');
                    setReviewSubmitting(false);
                    setTimeout(() => setReviewSuccessMsg(''), 4000);
                })
                .catch(() => {
                    setReviews(prev => [payload, ...prev]);
                    setNewReviewAuthor('');
                    setNewReviewComment('');
                    setReviewSuccessMsg('Review added successfully.');
                    setReviewSubmitting(false);
                    setTimeout(() => setReviewSuccessMsg(''), 4000);
                });
        } else {
            setReviews(prev => [payload, ...prev]);
            setNewReviewAuthor('');
            setNewReviewComment('');
            setReviewSuccessMsg('Review added successfully.');
            setReviewSubmitting(false);
            setTimeout(() => setReviewSuccessMsg(''), 4000);
        }
    };

    // Estimated delivery date (+3 days)
    const estDeliveryDate = new Date();
    estDeliveryDate.setDate(estDeliveryDate.getDate() + 3);
    const estDateFormatted = estDeliveryDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    // Sizes list
    const sizesList = (product?.variantOptions?.find(o => o.name?.toLowerCase() === 'size')?.values) 
        || product?.sizes 
        || ['S', 'M', 'L', 'XL', 'XXL'];
    const currentSize = selectedOptions['Size'] || sizesList[0];

    if (!isOpen || !product) return null;

    return (
        <div 
            ref={containerRef}
            className="flipkart-fullscreen-overlay"
            style={{
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 1200,
                background: '#090b11',
                color: '#f8fafc',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Inline Scoped Styles for Flipkart Aesthetics */}
            <style>{`
                .flipkart-fullscreen-overlay {
                    animation: flipkartFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes flipkartFadeIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fk-header-btn {
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: #e2e8f0;
                    border-radius: 9999px;
                    padding: 8px 16px;
                    font-size: 13px;
                    font-weight: 700;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .fk-header-btn:hover {
                    background: rgba(255, 255, 255, 0.12);
                    border-color: rgba(255, 255, 255, 0.25);
                    color: #fff;
                    transform: translateY(-1px);
                }
                .fk-action-cart-btn {
                    background: linear-gradient(135deg, #ff9f00 0%, #f59e0b 100%);
                    color: #0a0b0e;
                    border: none;
                    border-radius: 8px;
                    font-weight: 900;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 16px 20px;
                    font-size: 15px;
                    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .fk-action-cart-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.45);
                }
                .fk-action-buy-btn {
                    background: linear-gradient(135deg, #fb641b 0%, #ea580c 100%);
                    color: #ffffff;
                    border: none;
                    border-radius: 8px;
                    font-weight: 900;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 16px 20px;
                    font-size: 15px;
                    box-shadow: 0 4px 14px rgba(251, 100, 27, 0.35);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .fk-action-buy-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #f97316 0%, #c2410c 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(251, 100, 27, 0.45);
                }
                .dress-color-card {
                    cursor: pointer;
                    border: 2px solid rgba(255, 255, 255, 0.12);
                    border-radius: 10px;
                    padding: 6px;
                    background: #111420;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    min-width: 78px;
                    max-width: 96px;
                }
                .dress-color-card:hover {
                    border-color: rgba(245, 158, 11, 0.6);
                    transform: translateY(-2px);
                }
                .dress-color-card.active {
                    border-color: #f59e0b;
                    background: rgba(245, 158, 11, 0.12);
                    box-shadow: 0 0 16px rgba(245, 158, 11, 0.3);
                }
                .fk-size-chip {
                    border: 1.5px solid rgba(255, 255, 255, 0.14);
                    background: #131726;
                    color: #fff;
                    font-weight: 800;
                    border-radius: 8px;
                    padding: 10px 18px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .fk-size-chip:hover {
                    border-color: #f59e0b;
                }
                .fk-size-chip.active {
                    border-color: #f59e0b;
                    background: #f59e0b;
                    color: #090b11;
                    box-shadow: 0 0 14px rgba(245, 158, 11, 0.35);
                }
                .fk-offer-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    font-size: 13.5px;
                    margin-bottom: 10px;
                    color: #cbd5e1;
                    line-height: 1.4;
                }
                .fk-spec-row {
                    display: grid;
                    grid-template-columns: 160px 1fr;
                    padding: 10px 14px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    font-size: 13.5px;
                }
                .fk-spec-row:last-child {
                    border-bottom: none;
                }
                @media (max-width: 900px) {
                    .fk-grid-layout {
                        grid-template-columns: 1fr !important;
                    }
                    .fk-left-sticky {
                        position: relative !important;
                        top: 0 !important;
                    }
                    .fk-mobile-bottom-bar {
                        display: grid !important;
                    }
                    .fk-spec-row {
                        grid-template-columns: 120px 1fr;
                    }
                }
            `}</style>

            {/* TOP BAR: Sticky Flipkart Navigation Bar */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: 'rgba(9, 11, 17, 0.94)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
            }}>
                {/* Left: Back Button & Breadcrumbs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                    <button
                        type="button"
                        onClick={onClose}
                        className="fk-header-btn"
                        title="Back to Products (Esc)"
                        aria-label="Back to Products"
                    >
                        <span style={{ fontSize: '18px', lineHeight: 1 }}>←</span>
                        <span>Back to Store</span>
                    </button>

                    {/* Store Logo & Breadcrumbs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        <span style={{
                            fontWeight: 900,
                            letterSpacing: '1px',
                            color: '#f59e0b',
                            fontSize: '15px'
                        }}>
                            NETRAVE
                        </span>
                        <span style={{ color: '#475569', fontSize: '12px' }}>/</span>
                        <span style={{ color: '#94a3b8', fontSize: '13px', textTransform: 'capitalize' }}>
                            {product.category}
                        </span>
                        {product.subcategory && (
                            <>
                                <span style={{ color: '#475569', fontSize: '12px' }}>/</span>
                                <span style={{ color: '#cbd5e1', fontSize: '13px', textTransform: 'capitalize' }}>
                                    {typeof product.subcategory === 'object' ? (product.subcategory.name || product.subcategory.slug) : product.subcategory}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: Quick Actions (Wishlist, Cart, Share, Close) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    {/* Share Button */}
                    <button
                        type="button"
                        onClick={handleShareClick}
                        className="fk-header-btn"
                        title="Share Product"
                        style={{ padding: '8px 12px' }}
                    >
                        <span>🔗</span>
                        <span style={{ display: 'none', md: 'inline' }}>Share</span>
                    </button>

                    {/* Wishlist Toggle */}
                    <button
                        type="button"
                        onClick={() => { if (onToggleWishlist) onToggleWishlist(product.id); }}
                        className="fk-header-btn"
                        style={{
                            padding: '8px 14px',
                            background: isWishlisted ? 'rgba(239, 68, 68, 0.2)' : undefined,
                            borderColor: isWishlisted ? '#ef4444' : undefined,
                            color: isWishlisted ? '#ef4444' : '#e2e8f0'
                        }}
                        title={isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                    >
                        <span style={{ color: isWishlisted ? '#ef4444' : '#cbd5e1', fontSize: '15px' }}>
                            {isWishlisted ? '❤️' : '🤍'}
                        </span>
                        <span style={{ display: 'none', md: 'inline' }}>
                            {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                        </span>
                    </button>

                    {/* Cart Button with Count */}
                    <button
                        type="button"
                        onClick={() => {
                            if (onOpenCart) onOpenCart();
                        }}
                        className="fk-header-btn"
                        style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            borderColor: 'rgba(245, 158, 11, 0.4)',
                            color: '#f59e0b'
                        }}
                        title="View Cart"
                    >
                        <span>🛒</span>
                        <span>Cart</span>
                        {cartCount > 0 && (
                            <span style={{
                                background: '#f59e0b',
                                color: '#090b11',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: 900,
                                padding: '1px 6px',
                                marginLeft: '2px'
                            }}>
                                {cartCount}
                            </span>
                        )}
                    </button>

                    {/* Prominent Close (X) */}
                    <button
                        type="button"
                        onClick={onClose}
                        title="Close (Esc)"
                        aria-label="Close"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '26px',
                            fontWeight: 300,
                            lineHeight: 1,
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            transition: 'color 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                    >
                        &times;
                    </button>
                </div>
            </header>

            {/* Share Toast */}
            {showShareToast && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    right: '30px',
                    zIndex: 200,
                    background: '#10b981',
                    color: '#fff',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'flipkartFadeIn 0.2s ease'
                }}>
                    <span>✓</span> Product link copied to clipboard!
                </div>
            )}

            {/* MAIN CONTAINER: Flipkart 2-Column Full Screen Layout */}
            <main style={{
                flex: 1,
                maxWidth: '1440px',
                width: '100%',
                margin: '0 auto',
                padding: '24px 24px 80px',
                boxSizing: 'border-box'
            }}>
                <div 
                    className="fk-grid-layout"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(420px, 480px) 1fr',
                        gap: '40px',
                        alignItems: 'start'
                    }}
                >
                    {/* LEFT COLUMN: Gallery & Flipkart Action Buttons (Sticky on Desktop) */}
                    <div 
                        className="fk-left-sticky"
                        style={{
                            position: 'sticky',
                            top: '84px',
                            zIndex: 10
                        }}
                    >
                        {/* Gallery Row (Vertical Thumbnails + Main Zoom Image) */}
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                            {/* Vertical Thumbnail Strip (Flipkart Desktop Hallmark) */}
                            {imagesList.length > 1 && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    maxHeight: '520px',
                                    overflowY: 'auto',
                                    paddingRight: '4px',
                                    flexShrink: 0
                                }}>
                                    {imagesList.map((img, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setActiveImageIndex(idx)}
                                            onMouseEnter={() => setActiveImageIndex(idx)}
                                            style={{
                                                width: '64px',
                                                height: '76px',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                border: activeImageIndex === idx ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.12)',
                                                background: '#0e121d',
                                                padding: 0,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                boxShadow: activeImageIndex === idx ? '0 0 12px rgba(245, 158, 11, 0.35)' : 'none'
                                            }}
                                        >
                                            <img 
                                                src={img} 
                                                alt="" 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Main High-Res Image with Zoom Lens */}
                            <div style={{ flex: 1, position: 'relative' }}>
                                <div
                                    onMouseEnter={() => setIsZoomed(true)}
                                    onMouseLeave={() => setIsZoomed(false)}
                                    onMouseMove={handleMouseMoveZoom}
                                    style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '520px',
                                        background: '#090c15',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        cursor: 'crosshair',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {/* Flipkart / Netrave Assured Badge */}
                                    <span style={{
                                        position: 'absolute',
                                        top: '14px',
                                        left: '14px',
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        color: '#090b11',
                                        fontSize: '11px',
                                        fontWeight: 900,
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        letterSpacing: '0.6px',
                                        zIndex: 4,
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
                                    }}>
                                        ⚡ NETRAVE ASSURED
                                    </span>

                                    {/* Discount badge */}
                                    {hasDiscount && (
                                        <span style={{
                                            position: 'absolute',
                                            bottom: '14px',
                                            left: '14px',
                                            background: '#10b981',
                                            color: '#fff',
                                            fontSize: '12px',
                                            fontWeight: 800,
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            zIndex: 4
                                        }}>
                                            {discountPct}% OFF
                                        </span>
                                    )}

                                    {/* Large Image with Hover Magnifier */}
                                    <img
                                        src={activeImage}
                                        alt={product.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            transform: isZoomed ? 'scale(2)' : 'scale(1)',
                                            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                                            transition: isZoomed ? 'none' : 'transform 0.3s ease'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quantity and Dual Flipkart Action Buttons (Under Gallery) */}
                        <div style={{ marginTop: '20px' }}>
                            {/* Quantity Selector Bar */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                background: '#101422',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '10px',
                                padding: '8px 14px',
                                marginBottom: '14px'
                            }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1' }}>
                                    Quantity:
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setQty(q => Math.max(1, q - 1))}
                                        disabled={qty <= 1}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            background: '#181e33',
                                            color: '#fff',
                                            fontSize: '18px',
                                            cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        -
                                    </button>
                                    <span style={{ fontSize: '15px', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>
                                        {qty}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setQty(q => Math.min(currentStock, q + 1))}
                                        disabled={qty >= currentStock}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            background: '#181e33',
                                            color: '#fff',
                                            fontSize: '18px',
                                            cursor: qty >= currentStock ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Dual Flipkart Buttons (Add To Cart & Buy Now) */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <button
                                    type="button"
                                    onClick={handleAddToCartClick}
                                    disabled={isOutOfStock}
                                    className="fk-action-cart-btn"
                                    style={{
                                        opacity: isOutOfStock ? 0.5 : 1,
                                        cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '18px' }}>🛒</span>
                                    <span>ADD TO CART</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleBuyNowClick}
                                    disabled={isOutOfStock}
                                    className="fk-action-buy-btn"
                                    style={{
                                        opacity: isOutOfStock ? 0.5 : 1,
                                        cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '18px' }}>⚡</span>
                                    <span>BUY NOW</span>
                                </button>
                            </div>

                            {variantError && (
                                <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 700, marginTop: '10px', textAlign: 'center' }}>
                                    ⚠️ {variantError}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Flipkart Product Information & Dress Options */}
                    <div>
                        {/* Brand & Subcategory path */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{
                                color: '#f59e0b',
                                fontSize: '12px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.8px'
                            }}>
                                {product.brand || 'NETRAVE STUDIO'}
                            </span>
                            <span style={{ color: '#475569' }}>•</span>
                            <span style={{ color: '#94a3b8', fontSize: '13px', textTransform: 'capitalize' }}>
                                {product.category}
                            </span>
                        </div>

                        {/* Product Title */}
                        <h1 style={{
                            fontSize: '26px',
                            fontWeight: 800,
                            lineHeight: '1.3',
                            margin: '0 0 12px',
                            color: '#ffffff'
                        }}>
                            {product.title}
                        </h1>

                        {/* Ratings & Reviews Pill (Flipkart Green Pill) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#388e3c',
                                color: '#ffffff',
                                fontSize: '13px',
                                fontWeight: 800,
                                padding: '3px 10px',
                                borderRadius: '6px'
                            }}>
                                <span>{product.rating ? Number(product.rating).toFixed(1) : '4.8'}</span>
                                <span style={{ fontSize: '11px' }}>★</span>
                            </div>
                            <span style={{ color: '#94a3b8', fontSize: '13.5px', fontWeight: 600 }}>
                                {product.reviews || 128} Ratings & {reviews.length || 34} Reviews
                            </span>
                            <span style={{ color: '#475569' }}>•</span>
                            <span style={{ color: '#cbd5e1', fontSize: '13px' }}>
                                SKU: <strong style={{ color: '#f59e0b' }}>{currentSku}</strong>
                            </span>
                        </div>

                        {/* Flipkart Price Block */}
                        <div style={{
                            background: '#0d101a',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                Special Price
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '32px', fontWeight: 900, color: '#f8fafc' }}>
                                    ₹{currentPrice.toLocaleString('en-IN')}
                                </span>
                                {hasDiscount && (
                                    <>
                                        <span style={{ fontSize: '18px', color: '#64748b', textDecoration: 'line-through' }}>
                                            ₹{originalPrice.toLocaleString('en-IN')}
                                        </span>
                                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>
                                            {discountPct}% off
                                        </span>
                                    </>
                                )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                Inclusive of all taxes • Free delivery on orders over ₹499
                            </div>

                            {/* Stock Indicator */}
                            <div style={{ marginTop: '10px', fontSize: '13px' }}>
                                {isOutOfStock ? (
                                    <span style={{ color: '#ef4444', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        🔴 Currently Out of Stock
                                    </span>
                                ) : currentStock <= 5 ? (
                                    <span style={{ color: '#f59e0b', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        ⚡ Hurry, Only {currentStock} Left in Stock!
                                    </span>
                                ) : (
                                    <span style={{ color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        ✓ In Stock • Ready to dispatch in 24 hours
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Flipkart Available Offers Section */}
                        <div style={{
                            background: '#0d101a',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            marginBottom: '24px'
                        }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🏷️</span> Available Offers
                            </div>
                            <div className="fk-offer-row">
                                <span style={{ color: '#10b981', fontWeight: 900 }}>🏷️</span>
                                <div><strong>Bank Offer:</strong> 10% Instant Discount on SBI & HDFC Credit Cards, up to ₹1,500 on orders of ₹1,999 and above.</div>
                            </div>
                            <div className="fk-offer-row">
                                <span style={{ color: '#10b981', fontWeight: 900 }}>🏷️</span>
                                <div><strong>Special Price:</strong> Get extra 15% off on this product (price inclusive of coupon discount).</div>
                            </div>
                            <div className="fk-offer-row">
                                <span style={{ color: '#10b981', fontWeight: 900 }}>🏷️</span>
                                <div><strong>Partner Offer:</strong> Sign up for Netrave Fashion Club and get flat ₹150 OFF coupon for your next purchase.</div>
                            </div>
                            <div className="fk-offer-row" style={{ marginBottom: 0 }}>
                                <span style={{ color: '#10b981', fontWeight: 900 }}>🏷️</span>
                                <div><strong>Free Delivery:</strong> Enjoy Free express delivery across all Kerala and India pin codes on prepaid orders.</div>
                            </div>
                        </div>

                        {/* 1. FLIPKART-STYLE DRESS COLOR SELECTOR ("colour okke dress nte") */}
                        {availableColorVariants.length > 0 && (
                            <div style={{
                                background: '#0e121d',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '14px',
                                padding: '18px 20px',
                                marginBottom: '22px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Dress Color: <strong style={{ color: '#f59e0b', textTransform: 'none', fontSize: '15px' }}>{selectedColor || 'Select color'}</strong>
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                        {availableColorVariants.length} Color{availableColorVariants.length > 1 ? 's' : ''} Available
                                    </span>
                                </div>

                                {/* Dress Color Cards Row with Thumbnails */}
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    overflowX: 'auto',
                                    paddingBottom: '6px',
                                    paddingTop: '4px',
                                    WebkitOverflowScrolling: 'touch'
                                }}>
                                    {availableColorVariants.map((cVar, idx) => {
                                        const isSelected = (selectedColor === cVar.color);
                                        return (
                                            <div
                                                key={cVar.color || idx}
                                                onClick={() => handleSelectColor(cVar.color)}
                                                className={`dress-color-card ${isSelected ? 'active' : ''}`}
                                                title={`View ${cVar.color} dress`}
                                            >
                                                {/* Active Checkmark Pill */}
                                                {isSelected && (
                                                    <span style={{
                                                        position: 'absolute',
                                                        top: '-6px',
                                                        right: '-6px',
                                                        background: '#f59e0b',
                                                        color: '#090b11',
                                                        borderRadius: '50%',
                                                        width: '18px',
                                                        height: '18px',
                                                        fontSize: '11px',
                                                        fontWeight: 900,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                                        zIndex: 3
                                                    }}>
                                                        ✓
                                                    </span>
                                                )}

                                                {/* Dress Photo Thumbnail */}
                                                <div style={{
                                                    width: '64px',
                                                    height: '74px',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    background: '#090b10',
                                                    marginBottom: '6px',
                                                    position: 'relative',
                                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                                }}>
                                                    {cVar.image ? (
                                                        <img
                                                            src={cVar.image}
                                                            alt={cVar.color}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', backgroundColor: cVar.hex || '#1e293b' }} />
                                                    )}

                                                    {/* Color Hex dot */}
                                                    {cVar.hex && (
                                                        <span style={{
                                                            position: 'absolute',
                                                            bottom: '3px',
                                                            right: '3px',
                                                            width: '12px',
                                                            height: '12px',
                                                            borderRadius: '50%',
                                                            backgroundColor: cVar.hex,
                                                            border: '1.5px solid #000',
                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.5)'
                                                        }} />
                                                    )}
                                                </div>

                                                {/* Dress Color Name */}
                                                <span style={{
                                                    fontSize: '11.5px',
                                                    fontWeight: isSelected ? 800 : 600,
                                                    color: isSelected ? '#f59e0b' : '#cbd5e1',
                                                    textAlign: 'center',
                                                    lineHeight: '1.2',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '82px'
                                                }}>
                                                    {cVar.color}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 2. FLIPKART-STYLE SIZE SELECTOR */}
                        {sizesList.length > 0 && (
                            <div style={{
                                background: '#0e121d',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '14px',
                                padding: '18px 20px',
                                marginBottom: '22px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Select Size: <strong style={{ color: '#f59e0b', textTransform: 'none', fontSize: '15px' }}>{currentSize}</strong>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsSizeChartOpen(true)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#f59e0b',
                                            fontSize: '13px',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <span>📏</span> Size Chart
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {sizesList.map(size => {
                                        const isSelected = (currentSize === size);
                                        return (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => handleSelectOption('Size', size)}
                                                className={`fk-size-chip ${isSelected ? 'active' : ''}`}
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 3. PINCODE DELIVERY ESTIMATOR */}
                        <div style={{
                            background: '#0d101a',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            marginBottom: '22px'
                        }}>
                            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>📍</span> Delivery Options
                            </div>
                            <form onSubmit={handleCheckPincode} style={{ display: 'flex', gap: '8px', maxWidth: '380px' }}>
                                <input
                                    type="text"
                                    maxLength="6"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter 6-digit Pincode"
                                    style={{
                                        flex: 1,
                                        background: '#141826',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '13.5px',
                                        padding: '10px 14px',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        background: '#f59e0b',
                                        border: 'none',
                                        color: '#090b11',
                                        fontSize: '13px',
                                        fontWeight: 800,
                                        padding: '10px 18px',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {pincodeLoading ? 'Checking...' : 'Check'}
                                </button>
                            </form>
                            {pincodeChecked && (
                                <div style={{ marginTop: '12px', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                                    🚚 Delivery by <strong>{estDateFormatted}</strong> | Free Delivery
                                    <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '3px' }}>
                                        💵 Cash on Delivery available • 24h Express dispatch from Kerala Hub
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. FLIPKART TRUST & CONFIDENCE BADGES */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '12px',
                            background: '#0d101a',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '14px 18px',
                            marginBottom: '24px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>🛡️</span>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>100% Authentic</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Netrave Assured Genuine</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>🔄</span>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>7-Day Returns</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Hassle-free replacement</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>💵</span>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>Pay on Delivery</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Cash on Delivery supported</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>⚡</span>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>Fast Dispatch</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Shipped within 24 hours</div>
                                </div>
                            </div>
                        </div>

                        {/* 5. PRODUCT HIGHLIGHTS & SPECIFICATIONS TABLE (Flipkart Style) */}
                        <div style={{
                            background: '#0d101a',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            marginBottom: '24px'
                        }}>
                            <div style={{
                                padding: '14px 18px',
                                background: '#121624',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                fontSize: '15px',
                                fontWeight: 800,
                                color: '#fff'
                            }}>
                                Product Specifications & Details
                            </div>
                            <div>
                                <div className="fk-spec-row">
                                    <span style={{ color: '#94a3b8' }}>Category</span>
                                    <span style={{ color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>{product.category}</span>
                                </div>
                                <div className="fk-spec-row">
                                    <span style={{ color: '#94a3b8' }}>Style / Type</span>
                                    <span style={{ color: '#fff', fontWeight: 600 }}>{product.subcategory || 'Fashion Apparel'}</span>
                                </div>
                                <div className="fk-spec-row">
                                    <span style={{ color: '#94a3b8' }}>Brand</span>
                                    <span style={{ color: '#fff', fontWeight: 600 }}>{product.brand || 'NETRAVE'}</span>
                                </div>
                                <div className="fk-spec-row">
                                    <span style={{ color: '#94a3b8' }}>Available Colors</span>
                                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                                        {availableColorVariants.map(c => c.color).join(', ')}
                                    </span>
                                </div>
                                <div className="fk-spec-row">
                                    <span style={{ color: '#94a3b8' }}>Sizes</span>
                                    <span style={{ color: '#fff', fontWeight: 600 }}>{sizesList.join(', ')}</span>
                                </div>
                                <div className="fk-spec-row">
                                    <span style={{ color: '#94a3b8' }}>Occasion</span>
                                    <span style={{ color: '#fff', fontWeight: 600 }}>Casual / Streetwear / Festive</span>
                                </div>
                                <div className="fk-spec-row">
                                    <span style={{ color: '#94a3b8' }}>Care Instructions</span>
                                    <span style={{ color: '#fff', fontWeight: 600 }}>Gentle Machine Wash or Hand Wash, dry in shade</span>
                                </div>
                                <div className="fk-spec-row">
                                    <span style={{ color: '#94a3b8' }}>Country of Origin</span>
                                    <span style={{ color: '#fff', fontWeight: 600 }}>India</span>
                                </div>
                            </div>
                        </div>

                        {/* 6. PRODUCT DESCRIPTION */}
                        {product.description && (
                            <div style={{
                                background: '#0d101a',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '14px',
                                padding: '18px 20px',
                                marginBottom: '24px'
                            }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
                                    Product Description
                                </h3>
                                <div 
                                    dangerouslySetInnerHTML={{ __html: product.description }}
                                    style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}
                                />
                            </div>
                        )}

                        {/* 7. CUSTOMER RATINGS & REVIEWS SECTION (Flipkart Style) */}
                        <div style={{
                            background: '#0d101a',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '14px',
                            padding: '20px',
                            marginBottom: '24px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: 0 }}>
                                    Customer Ratings & Reviews
                                </h3>
                                <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 700 }}>
                                    ✓ 100% Verified Buyer Feedback
                                </span>
                            </div>

                            {/* Ratings Overview Summary */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr',
                                gap: '24px',
                                alignItems: 'center',
                                padding: '16px',
                                background: '#121624',
                                borderRadius: '10px',
                                marginBottom: '20px'
                            }}>
                                <div style={{ textAlign: 'center', paddingRight: '16px', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                    <div style={{ fontSize: '36px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                                        {product.rating ? Number(product.rating).toFixed(1) : '4.8'}
                                        <span style={{ fontSize: '20px', color: '#f59e0b', marginLeft: '4px' }}>★</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                                        {product.reviews || 128} verified ratings
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {[
                                        { stars: 5, pct: '78%' },
                                        { stars: 4, pct: '16%' },
                                        { stars: 3, pct: '4%' },
                                        { stars: 2, pct: '1%' },
                                        { stars: 1, pct: '1%' }
                                    ].map(b => (
                                        <div key={b.stars} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                            <span style={{ width: '24px', color: '#94a3b8', fontWeight: 700 }}>{b.stars} ★</span>
                                            <div style={{ flex: 1, height: '6px', background: '#1f2438', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: b.pct, height: '100%', background: b.stars >= 4 ? '#10b981' : b.stars === 3 ? '#f59e0b' : '#ef4444' }} />
                                            </div>
                                            <span style={{ width: '32px', color: '#64748b', textAlign: 'right' }}>{b.pct}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reviews list */}
                            {reviewsLoading ? (
                                <div style={{ color: '#94a3b8', fontSize: '13px', padding: '14px 0', textAlign: 'center' }}>
                                    Loading reviews...
                                </div>
                            ) : reviews.length === 0 ? (
                                <div style={{ color: '#94a3b8', fontSize: '13.5px', padding: '14px 0' }}>
                                    No customer reviews yet. Be the first to share your thoughts after delivery!
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                                    {reviews.map((rev, i) => (
                                        <div key={i} style={{ background: '#121624', borderRadius: '10px', padding: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                <span style={{
                                                    background: '#388e3c',
                                                    color: '#fff',
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                    padding: '2px 6px',
                                                    borderRadius: '4px'
                                                }}>
                                                    {rev.rating} ★
                                                </span>
                                                <strong style={{ fontSize: '13.5px', color: '#fff' }}>
                                                    {rev.customerName || 'Verified Buyer'}
                                                </strong>
                                                <span style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 700 }}>
                                                    ✓ Verified Buyer
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
                                                "{rev.comment}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Write Review Form */}
                            <form onSubmit={handleSubmitReview} style={{
                                background: '#121624',
                                borderRadius: '10px',
                                padding: '16px',
                                marginTop: '16px'
                            }}>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                                    ✍️ Rate & Review this Product
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', marginBottom: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder="Your Name (e.g., Rahul M.)"
                                        value={newReviewAuthor}
                                        onChange={(e) => setNewReviewAuthor(e.target.value)}
                                        required
                                        style={{
                                            background: '#0a0d16',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '13px',
                                            padding: '8px 12px',
                                            outline: 'none'
                                        }}
                                    />
                                    <select
                                        value={newReviewRating}
                                        onChange={(e) => setNewReviewRating(Number(e.target.value))}
                                        style={{
                                            background: '#0a0d16',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            borderRadius: '6px',
                                            color: '#f59e0b',
                                            fontSize: '13px',
                                            fontWeight: 800,
                                            padding: '8px 12px',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value={5}>5 Stars ★★★★★</option>
                                        <option value={4}>4 Stars ★★★★☆</option>
                                        <option value={3}>3 Stars ★★★☆☆</option>
                                        <option value={2}>2 Stars ★★☆☆☆</option>
                                        <option value={1}>1 Star ★☆☆☆☆</option>
                                    </select>
                                </div>
                                <textarea
                                    rows="2"
                                    placeholder="Write your review about fabric quality, fit, and color..."
                                    value={newReviewComment}
                                    onChange={(e) => setNewReviewComment(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        background: '#0a0d16',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '13px',
                                        padding: '8px 12px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        marginBottom: '10px'
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {reviewSuccessMsg && (
                                        <span style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 700 }}>
                                            ✓ {reviewSuccessMsg}
                                        </span>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={reviewSubmitting}
                                        style={{
                                            background: '#f59e0b',
                                            border: 'none',
                                            color: '#090b11',
                                            fontSize: '13px',
                                            fontWeight: 800,
                                            padding: '8px 18px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            marginLeft: 'auto'
                                        }}
                                    >
                                        {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* 8. SIMILAR PRODUCTS CAROUSEL */}
                        {relatedProducts.length > 0 && (
                            <div style={{
                                background: '#0d101a',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '14px',
                                padding: '20px',
                                marginBottom: '24px'
                            }}>
                                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: '0 0 14px' }}>
                                    Similar Products You May Like
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
                                    {relatedProducts.map(rel => (
                                        <div
                                            key={`rel-${rel.id}`}
                                            onClick={() => onQuickView(rel.id)}
                                            style={{
                                                background: '#121624',
                                                borderRadius: '10px',
                                                padding: '10px',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s ease, border-color 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-3px)';
                                                e.currentTarget.style.borderColor = '#f59e0b';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                            }}
                                        >
                                            <img
                                                src={rel.image}
                                                alt={rel.title}
                                                style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                                            />
                                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {rel.title}
                                            </div>
                                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                                                ₹{rel.price}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 9. RECENTLY VIEWED PRODUCTS */}
                        {recentlyViewedProducts.length > 0 && (
                            <div style={{
                                background: '#0d101a',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '14px',
                                padding: '16px 20px'
                            }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', margin: '0 0 10px' }}>
                                    Recently Viewed
                                </h4>
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                                    {recentlyViewedProducts.map(rv => (
                                        <div
                                            key={`rv-${rv.id}`}
                                            onClick={() => onQuickView(rv.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                background: '#121624',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                borderRadius: '8px',
                                                padding: '6px 10px',
                                                cursor: 'pointer',
                                                flexShrink: 0
                                            }}
                                        >
                                            <img src={rv.image} alt="" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                                            <div>
                                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {rv.title}
                                                </div>
                                                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b' }}>
                                                    ₹{rv.price}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* MOBILE FIXED BOTTOM ACTION BAR (Flipkart Hallmark on Mobile) */}
            <div 
                className="fk-mobile-bottom-bar"
                style={{
                    display: 'none',
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 110,
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    padding: '10px 14px',
                    background: '#090b11',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 -4px 16px rgba(0,0,0,0.6)'
                }}
            >
                <button
                    type="button"
                    onClick={handleAddToCartClick}
                    disabled={isOutOfStock}
                    className="fk-action-cart-btn"
                    style={{ padding: '12px', fontSize: '13.5px' }}
                >
                    <span>🛒</span> ADD TO CART
                </button>
                <button
                    type="button"
                    onClick={handleBuyNowClick}
                    disabled={isOutOfStock}
                    className="fk-action-buy-btn"
                    style={{ padding: '12px', fontSize: '13.5px' }}
                >
                    <span>⚡</span> BUY NOW
                </button>
            </div>

            {/* SIZE CHART MODAL DIALOG */}
            {isSizeChartOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1300,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#101422',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '16px',
                        maxWidth: '560px',
                        width: '100%',
                        padding: '24px',
                        position: 'relative',
                        color: '#fff',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
                    }}>
                        <button
                            type="button"
                            onClick={() => setIsSizeChartOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                fontSize: '24px',
                                cursor: 'pointer'
                            }}
                        >
                            &times;
                        </button>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#f59e0b' }}>
                            📏 Standard Size Chart & Measurements
                        </h3>
                        <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 16px' }}>
                            All measurements are in inches. For a relaxed fit, order your regular size.
                        </p>

                        <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
                                <thead>
                                    <tr style={{ background: '#192038', color: '#f59e0b', fontWeight: 800 }}>
                                        <th style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>Size</th>
                                        <th style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>Chest / Bust</th>
                                        <th style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>Length</th>
                                        <th style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>Shoulder</th>
                                        <th style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>Waist</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { s: 'S', c: '38"', l: '28"', sh: '17.5"', w: '30-32"' },
                                        { s: 'M', c: '40"', l: '29"', sh: '18.5"', w: '32-34"' },
                                        { s: 'L', c: '42"', l: '30"', sh: '19.5"', w: '34-36"' },
                                        { s: 'XL', c: '44"', l: '31"', sh: '20.5"', w: '36-38"' },
                                        { s: 'XXL', c: '46"', l: '32"', sh: '21.5"', w: '38-40"' }
                                    ].map((row, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#101422' : '#141829' }}>
                                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.06)', fontWeight: 800, color: '#f59e0b' }}>{row.s}</td>
                                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>{row.c}</td>
                                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>{row.l}</td>
                                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>{row.sh}</td>
                                            <td style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>{row.w}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <button
                                type="button"
                                onClick={() => setIsSizeChartOpen(false)}
                                style={{
                                    background: '#f59e0b',
                                    border: 'none',
                                    color: '#090b11',
                                    padding: '8px 20px',
                                    borderRadius: '6px',
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                }}
                            >
                                Got It
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
