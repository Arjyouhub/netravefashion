import React from 'react';

export default function Hero({ onShopClick, onSummerClick }) {
    return (
        <section className="hero-section">
            <div className="hero-bg-container">
                <img src="/assets/hero.png" alt="Netrave Men's Collection Banner" className="hero-image" />
                <div className="hero-overlay"></div>
            </div>
            <div className="hero-content">
                <span className="hero-tagline">✨ THE NETRAVE EXPERIENCE</span>
                <h1 className="hero-title">ELEVATE YOUR DAILY STYLE</h1>
                <p className="hero-subtitle">
                    Discover oversized Tees, tailored Shirts, and stylish Summer T-Shirts. Speed booking with direct WhatsApp support.
                </p>
                <div className="hero-actions-container">
                    <button onClick={onShopClick} className="cta-btn primary-cta">
                        Shop The Collection
                    </button>
                    <button onClick={onSummerClick} className="cta-btn secondary-cta">
                        Summer T-Shirts
                    </button>
                </div>
            </div>
            
            {/* Quick features bar */}
            <div className="features-bar">
                <div className="feature-item">
                    <svg viewBox="0 0 24 24" className="feature-icon"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM19 12.5h-2.5V10H19v2.5z"/></svg>
                    <div>
                        <h4>Fast Delivery</h4>
                        <p>All over Kerala</p>
                    </div>
                </div>
                <div class="feature-item">
                    <svg viewBox="0 0 24 24" className="feature-icon"><path d="M18 7c0-5.33-8-7-8-7S2 1.67 2 7c0 5.74 5.92 9.54 7.42 10.46.36.22.8.22 1.16 0C12.08 16.54 18 12.74 18 7zm-8 7c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/></svg>
                    <div>
                        <h4>Premium Fabric</h4>
                        <p>100% Quality cotton & polyester</p>
                    </div>
                </div>
                <div className="feature-item">
                    <svg viewBox="0 0 24 24" className="feature-icon"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
                    <div>
                        <h4>WhatsApp Booking</h4>
                        <p>Instant order configuration</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
