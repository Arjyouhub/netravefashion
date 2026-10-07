import React from 'react';

export default function Hero({ onShopClick, onSummerClick }) {
    return (
        <section className="hero-section">
            <div className="hero-bg-container">
                <img src="/assets/hero.png" alt="Netrave Luxury Fashion Collection" className="hero-image" />
                <div className="hero-overlay"></div>
            </div>
            <div className="hero-content">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '5px 14px', borderRadius: '30px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '12px' }}>👑</span>
                    <span style={{ fontSize: '11.5px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--primary)' }}>
                        VERIFIED PREMIUM FASHION STORE
                    </span>
                </div>
                <h1 className="hero-title">
                    DISCOVER LUXURY & EVERYDAY STREETWEAR
                </h1>
                <p className="hero-subtitle">
                    Explore Footwear & Sneakers, Ethnic Sarees, Designer Kurtis, Linen Shirts, Winter Jackets, Cargos & Heavyweight Oversized Tees. 100% Genuine Quality Guaranteed.
                </p>
                <div className="hero-actions-container">
                    <button onClick={onShopClick} className="cta-btn primary-cta" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>✨ Shop Collection</span>
                    </button>
                    <button onClick={onSummerClick} className="cta-btn secondary-cta" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>👟 Shoes & Footwear</span>
                    </button>
                </div>
            </div>
            
            {/* Quick trust & features bar (Flipkart/Amazon style) */}
            <div className="features-bar">
                <div className="feature-item">
                    <svg viewBox="0 0 24 24" className="feature-icon" style={{ fill: 'var(--primary)' }}>
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                    </svg>
                    <div>
                        <h4>100% Original</h4>
                        <p>Netrave Assured Quality</p>
                    </div>
                </div>
                <div className="feature-item">
                    <svg viewBox="0 0 24 24" className="feature-icon" style={{ fill: 'var(--primary)' }}>
                        <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM19 12.5h-2.5V10H19v2.5z"/>
                    </svg>
                    <div>
                        <h4>Express Shipping</h4>
                        <p>Dispatched in 24 Hours</p>
                    </div>
                </div>
                <div className="feature-item">
                    <svg viewBox="0 0 24 24" className="feature-icon" style={{ fill: 'var(--primary)' }}>
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V18a1 1 0 0 1-2 0v-1.07A7 7 0 0 1 5.07 11H6a1 1 0 0 1 0-2h-.93A7 7 0 0 1 11 5.07V6a1 1 0 0 1 2 0v-.93A7 7 0 0 1 18.93 11H18a1 1 0 0 1 0 2h.93A7 7 0 0 1 13 16.93z"/>
                    </svg>
                    <div>
                        <h4>7-Day Exchange</h4>
                        <p>Hassle-Free Size Swaps</p>
                    </div>
                </div>
                <div className="feature-item">
                    <svg viewBox="0 0 24 24" className="feature-icon" style={{ fill: 'var(--primary)' }}>
                        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                    </svg>
                    <div>
                        <h4>Secure Payments</h4>
                        <p>UPI, Razorpay & Cards</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
