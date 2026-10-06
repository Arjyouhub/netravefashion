import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

export default function HomeSections({
    categories = [],
    products = [],
    onSelectCategory,
    onQuickView,
    wishlist = [],
    onToggleWishlist,
    onShopClick
}) {
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterSuccess, setNewsletterSuccess] = useState(false);
    const [activeCuratedTab, setActiveCuratedTab] = useState('featured'); // 'featured', 'new', 'bestseller'

    // Flash Deals Countdown Timer (24h recurring timer)
    const [dealTimeLeft, setDealTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });
    useEffect(() => {
        const timer = setInterval(() => {
            setDealTimeLeft(prev => {
                let { hours, minutes, seconds } = prev;
                if (seconds > 0) {
                    seconds--;
                } else if (minutes > 0) {
                    minutes--;
                    seconds = 59;
                } else if (hours > 0) {
                    hours--;
                    minutes = 59;
                    seconds = 59;
                } else {
                    hours = 23;
                    minutes = 59;
                    seconds = 59;
                }
                return { hours, minutes, seconds };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Filter products for curated tabs
    const featuredProducts = products.filter(p => p.isFeatured || p.tags?.includes('Featured')).slice(0, 4);
    const newArrivals = products.filter(p => p.isNewArrival || p.tags?.includes('New')).slice(0, 4);
    const bestSellers = products.filter(p => p.isBestSeller || (p.rating >= 4.7)).slice(0, 4);

    // Flash deals products (products with biggest discount)
    const dealProducts = products
        .filter(p => p.originalPrice && p.originalPrice > p.price)
        .sort((a, b) => ((b.originalPrice - b.price) / b.originalPrice) - ((a.originalPrice - a.price) / a.originalPrice))
        .slice(0, 4);

    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        if (!newsletterEmail || !newsletterEmail.includes('@')) return;
        setNewsletterSuccess(true);
        setTimeout(() => setNewsletterSuccess(false), 5000);
        setNewsletterEmail('');
    };

    return (
        <div className="home-sections-container">
            {/* 1. FEATURED CATEGORIES SHOWCASE */}
            {categories.length > 0 && (
                <section className="featured-categories-section" style={{ padding: '40px 16px', maxWidth: '1240px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--primary)' }}>
                                📁 Curated Collections
                            </span>
                            <h2 style={{ fontSize: 'clamp(20px, 3.5vw, 28px)', fontWeight: '800', margin: '4px 0 0', color: '#fff' }}>
                                Explore By Category
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => { onSelectCategory('all'); onShopClick(); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--primary)',
                                fontWeight: '700',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            View All Categories →
                        </button>
                    </div>

                    <div className="category-cards-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '16px'
                    }}>
                        {categories.map(cat => (
                            <div
                                key={cat.id || cat.slug}
                                onClick={() => { onSelectCategory(cat.slug); onShopClick(); }}
                                style={{
                                    position: 'relative',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    background: '#111422',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    height: '220px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-end',
                                    padding: '16px'
                                }}
                                className="cat-card-hover"
                            >
                                <img
                                    src={cat.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80'}
                                    alt={cat.name}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transition: 'transform 0.4s ease'
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(9,11,18,0.92) 100%)'
                                }} />
                                <div style={{ position: 'relative', zIndex: 2 }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: cat.color || '#f59e0b',
                                        marginBottom: '6px',
                                        display: 'inline-block'
                                    }} />
                                    <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                                        {cat.name}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {cat.description || 'Premium curated clothing'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 2. FLASH DEALS & LIMITED-TIME OFFERS */}
            {dealProducts.length > 0 && (
                <section className="flash-deals-section" style={{
                    background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, rgba(10, 12, 18, 0.8) 100%)',
                    borderTop: '1px solid rgba(245, 158, 11, 0.15)',
                    borderBottom: '1px solid rgba(245, 158, 11, 0.15)',
                    padding: '40px 16px',
                    margin: '20px 0'
                }}>
                    <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px',
                            flexWrap: 'wrap',
                            gap: '14px'
                        }}>
                            <div>
                                <span style={{
                                    background: '#ef4444',
                                    color: '#fff',
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase'
                                }}>
                                    ⚡ FLASH SALE
                                </span>
                                <h2 style={{ fontSize: 'clamp(20px, 3.5vw, 28px)', fontWeight: '800', margin: '8px 0 0', color: '#fff' }}>
                                    Deals Of The Day
                                </h2>
                            </div>

                            {/* Countdown Box */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#111420',
                                padding: '8px 14px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Ends in:</span>
                                <div style={{ display: 'flex', gap: '4px', fontFamily: 'monospace', fontWeight: '800', fontSize: '14px' }}>
                                    <span style={timerBadgeStyle}>{String(dealTimeLeft.hours).padStart(2, '0')}</span>:
                                    <span style={timerBadgeStyle}>{String(dealTimeLeft.minutes).padStart(2, '0')}</span>:
                                    <span style={timerBadgeStyle}>{String(dealTimeLeft.seconds).padStart(2, '0')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="products-grid">
                            {dealProducts.map(product => (
                                <ProductCard
                                    key={`deal-${product.id}`}
                                    product={product}
                                    onQuickView={onQuickView}
                                    isWishlisted={wishlist.includes(product.id)}
                                    onToggleWishlist={onToggleWishlist}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 3. CURATED SECTIONS (Featured, New Arrivals, Best Sellers) */}
            <section className="curated-showcase-section" style={{ padding: '40px 16px', maxWidth: '1240px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--primary)' }}>
                        ✨ Hand-Picked Collections
                    </span>
                    <h2 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: '800', margin: '6px 0 16px', color: '#fff' }}>
                        Trending In Kerala Streetwear
                    </h2>

                    {/* Tab Navigation Chips */}
                    <div style={{ display: 'inline-flex', gap: '8px', background: '#0e111a', padding: '6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <button
                            type="button"
                            onClick={() => setActiveCuratedTab('featured')}
                            style={activeCuratedTab === 'featured' ? activeTabChipStyle : inactiveTabChipStyle}
                        >
                            ⭐ Featured
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveCuratedTab('new')}
                            style={activeCuratedTab === 'new' ? activeTabChipStyle : inactiveTabChipStyle}
                        >
                            🆕 New Arrivals
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveCuratedTab('bestseller')}
                            style={activeCuratedTab === 'bestseller' ? activeTabChipStyle : inactiveTabChipStyle}
                        >
                            🔥 Best Sellers
                        </button>
                    </div>
                </div>

                <div className="products-grid">
                    {activeCuratedTab === 'featured' && (
                        (featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4)).map(p => (
                            <ProductCard
                                key={`feat-${p.id}`}
                                product={p}
                                onQuickView={onQuickView}
                                isWishlisted={wishlist.includes(p.id)}
                                onToggleWishlist={onToggleWishlist}
                            />
                        ))
                    )}
                    {activeCuratedTab === 'new' && (
                        (newArrivals.length > 0 ? newArrivals : products.slice(0, 4)).map(p => (
                            <ProductCard
                                key={`new-${p.id}`}
                                product={p}
                                onQuickView={onQuickView}
                                isWishlisted={wishlist.includes(p.id)}
                                onToggleWishlist={onToggleWishlist}
                            />
                        ))
                    )}
                    {activeCuratedTab === 'bestseller' && (
                        (bestSellers.length > 0 ? bestSellers : products.slice(0, 4)).map(p => (
                            <ProductCard
                                key={`best-${p.id}`}
                                product={p}
                                onQuickView={onQuickView}
                                isWishlisted={wishlist.includes(p.id)}
                                onToggleWishlist={onToggleWishlist}
                            />
                        ))
                    )}
                </div>
            </section>

            {/* 4. NEWSLETTER & VIP PROMOTIONS */}
            <section className="newsletter-section" style={{
                background: 'linear-gradient(135deg, #121624 0%, #0a0b10 100%)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '24px',
                padding: '40px 24px',
                maxWidth: '1240px',
                margin: '40px auto',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ maxWidth: '580px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
                    <span style={{
                        display: 'inline-block',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: 'var(--primary)',
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        marginBottom: '12px'
                    }}>
                        💌 EXCLUSIVE DROPS & DISCOUNTS
                    </span>
                    <h3 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: '900', margin: '0 0 10px', color: '#fff' }}>
                        Unlock 15% OFF Your First Order
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
                        Be the first to hear about new limited streetwear drops, secret flash deals, and courier express dispatch updates.
                    </p>

                    {newsletterSuccess ? (
                        <div style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid #10b981',
                            color: '#10b981',
                            padding: '14px 20px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '14px'
                        }}>
                            🎉 Thank you for subscribing! Your 15% OFF code <strong>NETRAVE15</strong> has been unlocked.
                        </div>
                    ) : (
                        <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', gap: '8px', maxWidth: '460px', margin: '0 auto', flexWrap: 'wrap' }}>
                            <input
                                type="email"
                                required
                                placeholder="Enter your email address..."
                                value={newsletterEmail}
                                onChange={(e) => setNewsletterEmail(e.target.value)}
                                style={{
                                    flex: 1,
                                    minWidth: '220px',
                                    background: '#161b2b',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: '10px',
                                    padding: '12px 16px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                            <button
                                type="submit"
                                className="cta-btn primary-cta"
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '10px',
                                    fontWeight: '800',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Subscribe
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </div>
    );
}

const timerBadgeStyle = {
    background: '#1e2438',
    color: 'var(--primary)',
    padding: '3px 6px',
    borderRadius: '6px'
};

const activeTabChipStyle = {
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#0a0b0e',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
};

const inactiveTabChipStyle = {
    background: 'transparent',
    color: '#94a3b8',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
};
