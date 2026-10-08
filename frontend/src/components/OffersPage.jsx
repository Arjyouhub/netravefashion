import React, { useState } from 'react';

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
        category: 'all',
        badgeColor: '#f59e0b', // Yellow
        icon: '🚚',
        title: 'Free Shipping',
        sub: 'On orders above ₹999',
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

    const filteredOffers = OFFERS_DATA.filter(o => {
        if (activeCategory === 'all') return true;
        if (activeCategory === 'men') return o.category === 'men' || o.category === 'all';
        if (activeCategory === 'women') return o.category === 'all';
        if (activeCategory === 'watches') return o.category === 'watches' || o.category === 'all';
        return true;
    });

    return (
        <div className="netrave-page-wrapper offers-screen">
            <div className="netrave-container offers-container-narrow">
                {/* Hero Festive Banner Matching Screen 13 */}
                <div className="festive-sale-banner">
                    <div className="festive-banner-left">
                        <span className="festive-badge">BIG FESTIVE</span>
                        <h2 className="festive-sale-title">SALE</h2>
                        <h3 className="festive-sale-discount">UP TO 70% OFF</h3>
                        <div className="festive-coupon-pill">
                            <span>FESTIVE70</span>
                            <span className="festive-copy-dot">•</span>
                        </div>
                        <button 
                            type="button" 
                            className="festive-shop-now-btn"
                            onClick={() => onNavigate && onNavigate('category', { category: 'all' })}
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

                {/* Category Filter Pills Matching Screen 13 */}
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

                {/* Offer Cards List Matching Screen 13 */}
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
                                className="offer-get-btn"
                                onClick={() => handleGetOffer(offer.code)}
                            >
                                {copiedCode === offer.code ? 'Applied!' : 'Get Offer'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
