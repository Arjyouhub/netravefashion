import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';

const OFFERS_DATA = [
    {
        id: 1,
        category: 'men',
        badgeColor: '#ef4444', // Red
        icon: '📣',
        title: 'Flat 50% OFF',
        sub: "On Men's Fashion",
        code: 'MEN50'
    },
    {
        id: 2,
        category: 'men',
        badgeColor: '#f97316', // Orange
        icon: '👟',
        title: 'Flat 40% OFF',
        sub: 'On Footwear',
        code: 'FOOT40'
    },
    {
        id: 3,
        category: 'watches',
        badgeColor: '#27272a', // Dark
        icon: '⌚',
        title: 'Flat 30% OFF',
        sub: 'On Watches',
        code: 'WATCH30'
    },
    {
        id: 4,
        category: 'women',
        badgeColor: '#ec4899', // Pink
        icon: '👗',
        title: 'Flat 45% OFF',
        sub: "On Women's Ethnic & Western",
        code: 'WOMEN45'
    },
    {
        id: 5,
        category: 'all',
        badgeColor: '#8b5cf6', // Violet
        icon: '🎁',
        title: 'Flat ₹200 OFF',
        sub: 'On Orders Above ₹1499',
        code: 'WELCOME200'
    },
    {
        id: 6,
        category: 'all',
        badgeColor: '#f59e0b', // Yellow
        icon: '🚚',
        title: 'Free Shipping',
        sub: 'On all orders above ₹999',
        code: 'FREESHIP'
    }
];

export default function OffersPage({
    products = [],
    onQuickView,
    wishlist = [],
    onToggleWishlist,
    onAddToCart,
    onNavigate
}) {
    const [activeCategory, setActiveCategory] = useState('all');
    const [copiedCode, setCopiedCode] = useState(null);

    const handleGetOffer = (code) => {
        navigator.clipboard?.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2500);
        if (onNavigate) {
            onNavigate('category', { category: 'all' });
        }
    };

    const handleCopyCode = (e, code) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2500);
    };

    const filteredOffers = OFFERS_DATA.filter(o => {
        if (activeCategory === 'all') return true;
        if (activeCategory === 'men') return o.category === 'men' || o.category === 'all';
        if (activeCategory === 'women') return o.category === 'women' || o.category === 'all';
        if (activeCategory === 'watches') return o.category === 'watches' || o.category === 'all';
        return true;
    });

    // Discounted products matching active category
    const dealProducts = useMemo(() => {
        if (!Array.isArray(products) || products.length === 0) return [];
        return products.filter(p => {
            const hasDiscount = (p.originalPrice && p.originalPrice > p.price) || (p.discount && p.discount > 0);
            if (!hasDiscount) return false;
            if (activeCategory === 'all') return true;
            const cat = (p.category || '').toLowerCase();
            const sub = (p.subcategory || '').toLowerCase();
            const title = (p.title || '').toLowerCase();
            if (activeCategory === 'men') {
                return cat.includes('men') || cat === 't-shirt' || cat === 'shirt' || cat === 'hoodies' || sub.includes('men') || title.includes('men');
            }
            if (activeCategory === 'women') {
                return cat.includes('women') || cat === 'saree' || cat === 'kurti' || sub.includes('women') || title.includes('women');
            }
            if (activeCategory === 'watches') {
                return cat.includes('watch') || sub.includes('watch') || title.includes('watch');
            }
            return true;
        });
    }, [products, activeCategory]);

    return (
        <div className="netrave-page-wrapper offers-screen">
            <div className="netrave-container offers-container-narrow">
                {/* Hero Festive Banner */}
                <div className="festive-sale-banner">
                    <div className="festive-banner-left">
                        <span className="festive-badge">BIG FESTIVE</span>
                        <h2 className="festive-sale-title">SALE</h2>
                        <h3 className="festive-sale-discount">UP TO 70% OFF</h3>
                        <div 
                            className="festive-coupon-pill"
                            onClick={(e) => handleCopyCode(e, 'FESTIVE70')}
                            title="Click to copy FESTIVE70 coupon"
                        >
                            <span>FESTIVE70</span>
                            <span className="festive-copy-dot">
                                {copiedCode === 'FESTIVE70' ? '✓ Copied' : '• Click to Copy'}
                            </span>
                        </div>
                        <button 
                            type="button" 
                            className="festive-shop-now-btn"
                            onClick={() => onNavigate && onNavigate('category', { category: activeCategory !== 'all' ? activeCategory : 'all' })}
                        >
                            Shop Now →
                        </button>
                    </div>
                    <div className="festive-banner-right">
                        <img 
                            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80" 
                            alt="Festive Fashion Model" 
                            className="festive-model-img"
                        />
                    </div>
                </div>

                {/* Category Filter Pills */}
                <div className="offers-category-pills">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'men', label: 'Men' },
                        { key: 'women', label: 'Women' },
                        { key: 'watches', label: 'Watches' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            className={`offers-filter-tab ${activeCategory === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveCategory(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Offer Cards List */}
                <div className="offers-cards-list">
                    {filteredOffers.map(offer => (
                        <div key={offer.id} className="mobile-offer-card">
                            <div 
                                className="offer-icon-box"
                                style={{ backgroundColor: offer.badgeColor }}
                            >
                                <span className="offer-icon-emoji">{offer.icon}</span>
                            </div>

                            <div className="offer-text-block">
                                <h4 className="offer-main-title">{offer.title}</h4>
                                <span className="offer-sub-title">{offer.sub}</span>
                                <span className="offer-code-tag">Use code: {offer.code}</span>
                            </div>

                            <button 
                                type="button" 
                                className={`offer-get-btn ${copiedCode === offer.code ? 'applied' : ''}`}
                                onClick={() => handleGetOffer(offer.code)}
                            >
                                {copiedCode === offer.code ? 'Applied!' : 'Get Offer'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Hot Deals & Discounted Products */}
                {dealProducts.length > 0 && (
                    <div className="offers-deals-section">
                        <div className="offers-deals-header">
                            <div>
                                <h3 className="offers-deals-title">🔥 Deals of the Day</h3>
                                <p className="offers-deals-subtitle">Handpicked styles with special festive discounts</p>
                            </div>
                            <button
                                type="button"
                                className="offers-deals-view-all"
                                onClick={() => onNavigate && onNavigate('category', { category: activeCategory !== 'all' ? activeCategory : 'all' })}
                            >
                                View All ({dealProducts.length}) →
                            </button>
                        </div>
                        <div className="offers-products-grid">
                            {dealProducts.slice(0, 8).map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onQuickView={onQuickView}
                                    isWishlisted={wishlist.some(w => (typeof w === 'object' ? w.id : w) === product.id)}
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
