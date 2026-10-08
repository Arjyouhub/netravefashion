import React, { useState } from 'react';
import ProductCard from './ProductCard';

const CIRCULAR_CATEGORIES = [
    { id: 'men', name: 'Men Fashion', slug: 'shirt', image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=300&auto=format&fit=crop&q=80' },
    { id: 'women', name: 'Women Fashion', slug: 'saree', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&auto=format&fit=crop&q=80' },
    { id: 'watches', name: 'Watches', slug: 'watches', image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=300&auto=format&fit=crop&q=80' },
    { id: 'footwear', name: 'Footwear', slug: 'footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80' },
    { id: 't-shirts', name: 'T-Shirts', slug: 't-shirt', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&auto=format&fit=crop&q=80' },
    { id: 'shirts', name: 'Shirts', slug: 'shirt', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300&auto=format&fit=crop&q=80' },
    { id: 'jeans', name: 'Jeans', slug: 'pants', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300&auto=format&fit=crop&q=80' },
    { id: 'accessories', name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&auto=format&fit=crop&q=80' },
    { id: 'offers', name: 'Offers', slug: 'offers', isOfferBadge: true }
];

export default function HomeSections({
    categories = [],
    products = [],
    onSelectCategory,
    onQuickView,
    wishlist = [],
    onToggleWishlist,
    onAddToCart,
    onShopClick,
    onNavigate
}) {
    const [activeFeaturedTab, setActiveFeaturedTab] = useState('All');
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

    // Tab filter for Featured Products
    const filterFeaturedProducts = () => {
        if (activeFeaturedTab === 'All') return products.slice(0, 5);
        if (activeFeaturedTab === 'Men') {
            return products.filter(p => p.category === 'shirt' || p.category === 't-shirt' || p.category === 'pants' || p.category === 'hoodies').slice(0, 5);
        }
        if (activeFeaturedTab === 'Women') {
            return products.filter(p => p.category === 'saree' || p.category === 'kurti' || p.title?.toLowerCase().includes('women')).slice(0, 5);
        }
        if (activeFeaturedTab === 'Watches') {
            return products.filter(p => p.category === 'watches' || p.title?.toLowerCase().includes('watch')).slice(0, 5);
        }
        if (activeFeaturedTab === 'Footwear') {
            return products.filter(p => p.category === 'footwear' || p.title?.toLowerCase().includes('shoe')).slice(0, 5);
        }
        if (activeFeaturedTab === 'Accessories') {
            return products.filter(p => p.category === 'accessories' || p.title?.toLowerCase().includes('sunglasses') || p.title?.toLowerCase().includes('bag')).slice(0, 5);
        }
        return products.slice(0, 5);
    };

    const featuredList = filterFeaturedProducts();
    const newArrivalsList = products.filter(p => p.isNewArrival || p.tags?.includes('New')).slice(0, 5);
    const displayNewArrivals = newArrivalsList.length >= 3 ? newArrivalsList : products.slice(3, 8);

    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        if (newsletterEmail && newsletterEmail.includes('@')) {
            setNewsletterSubscribed(true);
            setTimeout(() => setNewsletterSubscribed(false), 5000);
            setNewsletterEmail('');
        }
    };

    const handleCategoryClick = (slug) => {
        if (slug === 'offers') {
            if (onNavigate) onNavigate('offers');
        } else {
            if (onSelectCategory) onSelectCategory(slug);
            if (onNavigate) onNavigate('category', { category: slug });
        }
    };

    return (
        <div className="home-sections-flow">
            {/* 1. Circular Categories Icon Row */}
            <section className="categories-circle-section">
                <div className="netrave-container">
                    <div className="categories-circle-scroll">
                        {CIRCULAR_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                className="cat-circle-card"
                                onClick={() => handleCategoryClick(cat.slug)}
                            >
                                <div className={`cat-circle-avatar ${cat.isOfferBadge ? 'offer-badge-avatar' : ''}`}>
                                    {cat.isOfferBadge ? (
                                        <span className="offer-percent-symbol">%</span>
                                    ) : (
                                        <img src={cat.image} alt={cat.name} className="cat-circle-img" loading="lazy" />
                                    )}
                                </div>
                                <span className="cat-circle-title">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* 2. 3-Card Promotional Banners */}
            <section className="promo-banners-section">
                <div className="netrave-container">
                    <div className="promo-banners-grid">
                        {/* Banner 1: Men's Collection */}
                        <div className="promo-card promo-card-yellow" onClick={() => handleCategoryClick('shirt')}>
                            <div className="promo-card-text">
                                <h3 className="promo-card-title">MEN'S<br />COLLECTION</h3>
                                <p className="promo-card-badge">Flat 40% OFF</p>
                                <span className="promo-cta-link">Shop Now →</span>
                            </div>
                            <img 
                                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80" 
                                alt="Men's Fashion" 
                                className="promo-card-image" 
                            />
                        </div>

                        {/* Banner 2: Women's Fashion */}
                        <div className="promo-card promo-card-dark" onClick={() => handleCategoryClick('saree')}>
                            <div className="promo-card-text">
                                <h3 className="promo-card-title">WOMEN'S<br />FASHION</h3>
                                <p className="promo-card-badge text-yellow">Up to 50% OFF</p>
                                <span className="promo-cta-link text-yellow">Shop Now →</span>
                            </div>
                            <img 
                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80" 
                                alt="Women's Fashion" 
                                className="promo-card-image" 
                            />
                        </div>

                        {/* Banner 3: Premium Watches */}
                        <div className="promo-card promo-card-light" onClick={() => handleCategoryClick('watches')}>
                            <div className="promo-card-text">
                                <h3 className="promo-card-title">PREMIUM<br />WATCHES</h3>
                                <p className="promo-card-badge">Starting at ₹999</p>
                                <span className="promo-cta-link">Shop Now →</span>
                            </div>
                            <img 
                                src="https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&auto=format&fit=crop&q=80" 
                                alt="Premium Watches" 
                                className="promo-card-image" 
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Featured Products Section with Category Tabs */}
            <section className="section-featured-products">
                <div className="netrave-container">
                    <div className="section-header-row">
                        <h2 className="section-main-heading">Featured Products</h2>
                        <div className="section-tabs-row">
                            {['All', 'Men', 'Women', 'Watches', 'Footwear', 'Accessories'].map(tab => (
                                <button
                                    key={tab}
                                    type="button"
                                    className={`section-tab-btn ${activeFeaturedTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveFeaturedTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="netrave-products-grid">
                        {featuredList.map(prod => (
                            <ProductCard
                                key={prod.id}
                                product={prod}
                                onQuickView={onQuickView}
                                isWishlisted={wishlist.includes(prod.id)}
                                onToggleWishlist={onToggleWishlist}
                                onAddToCart={onAddToCart}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Footwear Collection Wide Promotional Banner */}
            <section className="footwear-promo-wide-section">
                <div className="netrave-container">
                    <div className="footwear-banner-card">
                        {/* Left Footwear Info */}
                        <div className="footwear-banner-left">
                            <span className="footwear-badge-tag">NEW DROP</span>
                            <h2 className="footwear-banner-title">
                                FOOTWEAR<br /><span style={{ color: 'var(--primary, #f59e0b)' }}>COLLECTION</span>
                            </h2>
                            <p className="footwear-banner-subtitle">Step Into Comfort & Style</p>
                            <button 
                                type="button" 
                                className="footwear-banner-cta" 
                                onClick={() => handleCategoryClick('footwear')}
                            >
                                Shop Now →
                            </button>
                        </div>

                        {/* Center Sneaker Visual */}
                        <div className="footwear-banner-center">
                            <img 
                                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80" 
                                alt="Netrave Footwear Collection" 
                                className="footwear-sneaker-img" 
                            />
                        </div>

                        {/* Right Special Offer Card */}
                        <div className="footwear-banner-right-box">
                            <span className="special-offer-pill">SPECIAL OFFER</span>
                            <h3 className="special-offer-discount">Flat 50% OFF</h3>
                            <p className="special-offer-sub">On Selected Items</p>
                            <div className="special-offer-bag-icon">🛍️</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. New Arrivals Section */}
            <section className="section-new-arrivals">
                <div className="netrave-container">
                    <div className="section-header-row">
                        <h2 className="section-main-heading">New Arrivals</h2>
                        <button 
                            type="button" 
                            className="view-all-link-btn" 
                            onClick={() => {
                                if (onNavigate) onNavigate('category', { category: 'all' });
                                else if (onShopClick) onShopClick();
                            }}
                        >
                            View All →
                        </button>
                    </div>

                    <div className="netrave-products-grid">
                        {displayNewArrivals.map(prod => (
                            <ProductCard
                                key={prod.id}
                                product={prod}
                                onQuickView={onQuickView}
                                isWishlisted={wishlist.includes(prod.id)}
                                onToggleWishlist={onToggleWishlist}
                                onAddToCart={onAddToCart}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. Benefits Section (4 Columns) */}
            <section className="benefits-four-bar">
                <div className="netrave-container">
                    <div className="benefits-grid">
                        <div className="benefit-item-card">
                            <div className="benefit-icon-circle">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM19 12.5h-2.5V10H19v2.5z"/>
                                </svg>
                            </div>
                            <div>
                                <h4 className="benefit-title">Free Shipping</h4>
                                <p className="benefit-sub">On orders above ₹999</p>
                            </div>
                        </div>

                        <div className="benefit-item-card">
                            <div className="benefit-icon-circle">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                                </svg>
                            </div>
                            <div>
                                <h4 className="benefit-title">Secure Payment</h4>
                                <p className="benefit-sub">100% Safe & Secure</p>
                            </div>
                        </div>

                        <div className="benefit-item-card">
                            <div className="benefit-icon-circle">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V18a1 1 0 0 1-2 0v-1.07A7 7 0 0 1 5.07 11H6a1 1 0 0 1 0-2h-.93A7 7 0 0 1 11 5.07V6a1 1 0 0 1 2 0v-.93A7 7 0 0 1 18.93 11H18a1 1 0 0 1 0 2h.93A7 7 0 0 1 13 16.93z"/>
                                </svg>
                            </div>
                            <div>
                                <h4 className="benefit-title">Easy Returns</h4>
                                <p className="benefit-sub">7 Days Return Policy</p>
                            </div>
                        </div>

                        <div className="benefit-item-card">
                            <div className="benefit-icon-circle">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M20 15.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm-16 0c-.8 0-1.5-.7-1.5-1.5S3.2 12.5 4 12.5s1.5.7 1.5 1.5-.7 1.5-1.5 1.5zM12 2C6.5 2 2 6.5 2 12v3c0 2.2 1.8 4 4 4h1v-6H5v-1c0-3.9 3.1-7 7-7s7 3.1 7 7v1h-2v6h1c2.2 0 4-1.8 4-4v-3c0-5.5-4.5-10-10-10z"/>
                                </svg>
                            </div>
                            <div>
                                <h4 className="benefit-title">24/7 Support</h4>
                                <p className="benefit-sub">We're here to help</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. Trendy Fashion Wide Banner */}
            <section className="trendy-fashion-wide-banner">
                <div className="netrave-container">
                    <div className="trendy-fashion-card">
                        <div className="trendy-fashion-content">
                            <h2 className="trendy-fashion-title">
                                TRENDY FASHION<br />
                                <span className="trendy-fashion-sub">FOR A BETTER YOU</span>
                            </h2>
                            <button 
                                type="button" 
                                className="trendy-explore-btn"
                                onClick={() => handleCategoryClick('all')}
                            >
                                Explore Now →
                            </button>
                        </div>
                        <div className="trendy-fashion-images">
                            <img 
                                src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop&q=80" 
                                alt="Trendy Fashion Model" 
                                className="trendy-img-1" 
                            />
                            <img 
                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80" 
                                alt="Trendy Fashion Woman" 
                                className="trendy-img-2" 
                            />
                            <img 
                                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80" 
                                alt="Sneakers" 
                                className="trendy-img-3" 
                            />
                            <img 
                                src="https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&auto=format&fit=crop&q=80" 
                                alt="Watch" 
                                className="trendy-img-4" 
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. Stay Updated Newsletter Box */}
            <section className="newsletter-stay-updated">
                <div className="netrave-container">
                    <div className="newsletter-box">
                        <div className="newsletter-heading-col">
                            <h3 className="newsletter-title">Stay Updated</h3>
                            <p className="newsletter-desc">Get exclusive offers, new arrivals and more!</p>
                        </div>
                        <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                            <input 
                                type="email" 
                                className="newsletter-input" 
                                placeholder="Enter your email address" 
                                value={newsletterEmail}
                                onChange={(e) => setNewsletterEmail(e.target.value)}
                                required 
                            />
                            <button type="submit" className="newsletter-submit-btn">
                                Subscribe
                            </button>
                        </form>
                        {newsletterSubscribed && (
                            <p className="newsletter-success-note">
                                ✓ Thank you for subscribing! Check your inbox for exclusive discounts.
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
