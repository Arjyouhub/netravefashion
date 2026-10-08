import React, { useState, useEffect } from 'react';

const HERO_SLIDES = [
    {
        id: 1,
        tag: "NEW COLLECTION",
        title: "STYLE BEYOND LIMITS",
        subtitle: "Trendy Looks for Everyday Life",
        ctaText: "Shop Now →",
        ctaSecondary: "Explore Collection",
        image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1000&auto=format&fit=crop&q=80",
        accentColor: "#f59e0b",
        categorySlug: "all"
    },
    {
        id: 2,
        tag: "FOOTWEAR SPECIAL",
        title: "STEP INTO COMFORT & STYLE",
        subtitle: "Chunky Sneakers, Casual Kicks & High-Performance Soles",
        ctaText: "Shop Footwear →",
        ctaSecondary: "View All Sneakers",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&auto=format&fit=crop&q=80",
        accentColor: "#f59e0b",
        categorySlug: "footwear"
    },
    {
        id: 3,
        tag: "FESTIVE & ETHNIC",
        title: "TIMELESS ELEGANCE & LUXURY",
        subtitle: "Pure Silk Sarees, Embroidered Kurtis & Premium Linen",
        ctaText: "Explore Ethnic →",
        ctaSecondary: "View Collections",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=80",
        accentColor: "#f59e0b",
        categorySlug: "saree"
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

                {/* Right Visual Image Column */}
                <div className="netrave-hero-visual">
                    {/* Yellow Dynamic Geometric Accent Graphic */}
                    <div className="hero-accent-stripes">
                        <div className="accent-stripe stripe-1"></div>
                        <div className="accent-stripe stripe-2"></div>
                    </div>

                    <div className="hero-model-container">
                        <img 
                            src={slide.image} 
                            alt={slide.title} 
                            className="hero-model-img" 
                        />
                    </div>

                    {/* Subtle Right Category Indicator */}
                    <div className="hero-vertical-categories">
                        <span>FASHION</span>
                        <span>·</span>
                        <span>WATCHES</span>
                        <span>·</span>
                        <span>FOOTWEAR</span>
                        <span>·</span>
                        <span>ACCESSORIES & MORE</span>
                    </div>
                </div>

                {/* Navigation Arrows */}
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
            </div>
        </section>
    );
}
