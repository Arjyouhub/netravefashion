import React, { useState, useEffect } from 'react';

const HERO_SLIDES = [
    {
        id: 1,
        tag: "MEN'S COLLECTION",
        title: "URBAN STREETWEAR & STYLE",
        subtitle: "Sharp Layering, Trendy Outerwear & Everyday Comfort",
        ctaText: "Shop Men →",
        ctaSecondary: "Explore Styles",
        image: "/assets/men-hero-desktop.jpg",
        mobileImage: "/assets/men-hero-mobile.jpg",
        accentColor: "#f59e0b",
        categorySlug: "shirt"
    },
    {
        id: 2,
        tag: "FOOTWEAR EDIT",
        title: "STEP INTO STYLE",
        subtitle: "Premium sneakers designed for everyday movement.",
        ctaText: "Shop Footwear →",
        ctaSecondary: "Explore Collection",
        image: "/assets/shoe-hero-desktop.jpg",
        mobileImage: "/assets/shoe-hero-mobile.jpg",
        accentColor: "#f59e0b",
        categorySlug: "footwear"
    }
];

export default function Hero({ onShopClick, onNavigateCategory }) {
    const [currentSlide, setCurrentSlide] = useState(0);

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

    return (
        <section className="netrave-hero-wrapper">
            {/* Desktop 16:9 Widescreen Cover (Kept exact for laptop view) */}
            <div 
                className="hero-bg-backdrop hero-bg-desktop" 
                style={{ backgroundImage: `url("${slide.image}")` }}
            />
            {/* Mobile Vertical 9:16 Portrait Cover (Perfect fit for phone view) */}
            <div 
                className="hero-bg-backdrop hero-bg-mobile" 
                style={{ backgroundImage: `url("${slide.mobileImage || slide.image}")` }}
            />
            <div className="hero-bg-gradient-overlay" />

            {/* Navigation Arrows positioned on outer wrapper away from text */}
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

                {/* Right Visual Space (Model shines through uncropped on desktop) */}
                <div className="netrave-hero-visual-open">
                    {slide.desktopModel && (
                        <div className="hero-desktop-model-frame">
                            <img 
                                src={slide.desktopModel} 
                                alt={slide.title} 
                                className="hero-desktop-model-img" 
                            />
                        </div>
                    )}
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
