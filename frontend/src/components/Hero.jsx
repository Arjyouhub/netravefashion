import React, { useState, useEffect } from 'react';

const HERO_SLIDES = [
    {
        id: 1,
        tag: "⚡ NEW DROP 2026",
        title: "STYLE BEYOND LIMITS",
        subtitle: "Urban Streetwear, Layered Fits & Everyday Statement Aesthetics",
        badge: "👑 VERIFIED FIT",
        ctaText: "Shop Collection →",
        ctaSecondary: "Explore Styles",
        image: "/assets/hero_slide_female.jpg",
        accentColor: "#f59e0b",
        categorySlug: "all"
    },
    {
        id: 2,
        tag: "🔥 MEN'S STREETWEAR",
        title: "DESIGNED TO STAND OUT",
        subtitle: "Heavyweight Cotton, Precision Cuts & Contemporary Street Luxury",
        badge: "⚡ SIGNATURE DROP",
        ctaText: "Shop Men →",
        ctaSecondary: "View Best Sellers",
        image: "/assets/hero_slide_male.jpg",
        accentColor: "#f59e0b",
        categorySlug: "shirt"
    }
];

export default function Hero({ onShopClick, onNavigateCategory }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [touchStartX, setTouchStartX] = useState(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
        }, 5500);
        return () => clearInterval(interval);
    }, []);

    const slide = HERO_SLIDES[currentSlide];

    const handleCta = (slug) => {
        if (onNavigateCategory && slug && slug !== 'all') {
            onNavigateCategory(slug);
        } else if (onShopClick) {
            onShopClick();
        }
    };

    const handleTouchStart = (e) => {
        setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e) => {
        if (touchStartX === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (diff > 45) {
            setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
        } else if (diff < -45) {
            setCurrentSlide(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
        }
        setTouchStartX(null);
    };

    return (
        <section 
            className="netrave-hero-wrapper"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Desktop ambient blurred backdrop that matches current slide colors smoothly */}
            <div 
                className="hero-ambient-backdrop" 
                style={{ backgroundImage: `url("${slide.image}")` }}
            />
            <div className="hero-ambient-pattern" />

            {/* Mobile Dedicated Full-Bleed 9:16 Vertical Background */}
            <div 
                className="hero-bg-mobile" 
                style={{ backgroundImage: `url("${slide.image}")` }}
            />
            <div className="hero-bg-mobile-overlay" />

            {/* Navigation Arrows positioned on outer wrapper */}
            <button 
                type="button" 
                className="hero-arrow-btn arrow-prev" 
                onClick={() => setCurrentSlide(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                aria-label="Previous Slide"
            >
                ‹
            </button>
            <button 
                type="button" 
                className="hero-arrow-btn arrow-next" 
                onClick={() => setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length)}
                aria-label="Next Slide"
            >
                ›
            </button>

            <div className="netrave-hero-container">
                {/* Left/Main Content Column */}
                <div className="netrave-hero-content">
                    <span className="netrave-hero-tag">
                        {slide.tag}
                    </span>
                    <h1 className="netrave-hero-title">
                        {slide.title}
                    </h1>
                    <p className="netrave-hero-desc">
                        {slide.subtitle}
                    </p>

                    {/* Trust Perks for Desktop/Laptop */}
                    <div className="hero-trust-perks">
                        <span className="hero-perk-item">✓ 100% Original Quality</span>
                        <span className="hero-perk-divider">•</span>
                        <span className="hero-perk-item">✓ Dispatched in 24h</span>
                        <span className="hero-perk-divider">•</span>
                        <span className="hero-perk-item">✓ 7-Day Easy Exchange</span>
                    </div>

                    <div className="netrave-hero-btn-row">
                        <button 
                            type="button" 
                            className="hero-btn-primary" 
                            onClick={() => handleCta(slide.categorySlug)}
                        >
                            {slide.ctaText}
                        </button>
                        <button 
                            type="button" 
                            className="hero-btn-secondary" 
                            onClick={() => handleCta('all')}
                        >
                            {slide.ctaSecondary}
                        </button>
                    </div>
                </div>

                {/* Right Visual Image Column (Prominently displayed on Desktop/Laptop) */}
                <div className="netrave-hero-visual">
                    {/* Yellow Dynamic Geometric Accent Graphic */}
                    <div className="hero-accent-stripes">
                        <div className="accent-stripe stripe-1"></div>
                        <div className="accent-stripe stripe-2"></div>
                    </div>

                    <div className="hero-model-container">
                        <div className="hero-model-card">
                            <span className="hero-floating-badge">{slide.badge}</span>
                            <img 
                                key={slide.id}
                                src={slide.image} 
                                alt={slide.title} 
                                className="hero-model-img" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Dot Pagination */}
            <div className="hero-dots-row">
                {HERO_SLIDES.map((s, idx) => (
                    <button
                        key={s.id}
                        type="button"
                        className={`hero-dot ${idx === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </section>
    );
}
