import React, { useState, useMemo, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';

const TRENDING_SUGGESTIONS = [
    'Oversized T-Shirts',
    'Streetwear Sneakers',
    'Acid Wash',
    'Pure Silk Saree',
    'Casual Shirts',
    'Hoodies & Jackets'
];

export default function SearchPage({
    products = [],
    initialQuery = '',
    onQuickView,
    wishlist = [],
    onToggleWishlist,
    onAddToCart,
    onNavigate
}) {
    const [searchVal, setSearchVal] = useState(initialQuery || '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [sortBy, setSortBy] = useState('recommended');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const inputRef = useRef(null);
    const sortRef = useRef(null);

    // Sync if initialQuery changes from external navigation
    useEffect(() => {
        if (initialQuery !== undefined) {
            setSearchVal(initialQuery);
        }
    }, [initialQuery]);

    // Auto-focus search input on page mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Close sort dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sortRef.current && !sortRef.current.contains(e.target)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter products
    const filteredProducts = useMemo(() => {
        const q = searchVal.trim().toLowerCase();
        if (!q) return products;
        return products.filter(p => 
            p.title?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q) ||
            p.subcategory?.toLowerCase().includes(q) ||
            p.brand?.toLowerCase().includes(q) ||
            p.shortDescription?.toLowerCase().includes(q) ||
            p.tags?.some(t => t.toLowerCase().includes(q))
        );
    }, [products, searchVal]);

    // Sort products
    const sortedProducts = useMemo(() => {
        const list = [...filteredProducts];
        switch (sortBy) {
            case 'price-low':
                return list.sort((a, b) => a.price - b.price);
            case 'price-high':
                return list.sort((a, b) => b.price - a.price);
            case 'rating':
                return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'newest':
                return list.sort((a, b) => b.id - a.id);
            default:
                return list;
        }
    }, [filteredProducts, sortBy]);

    const sortLabels = {
        'recommended': 'Recommended',
        'price-low': 'Price: Low to High',
        'price-high': 'Price: High to Low',
        'rating': 'Top Rated',
        'newest': 'Newest First'
    };

    return (
        <div className="netrave-page-wrapper search-screen">
            <div className="netrave-container search-container-narrow">
                {/* Search Bar Input Row */}
                <div className="search-top-bar-row">
                    <button 
                        type="button" 
                        className="search-nav-back-btn" 
                        onClick={() => onNavigate && onNavigate('home')}
                        aria-label="Back to store"
                        title="Back"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5"/>
                            <path d="m12 19-7-7 7-7"/>
                        </svg>
                    </button>

                    <div className="search-input-field-wrap">
                        <svg className="search-field-svg-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>

                        <input 
                            ref={inputRef}
                            type="text" 
                            className="search-native-input"
                            placeholder="Search for products, brands..."
                            value={searchVal}
                            onChange={(e) => {
                                setSearchVal(e.target.value);
                                setShowSuggestions(false);
                            }}
                            onFocus={() => setShowSuggestions(!searchVal)}
                        />

                        {searchVal && (
                            <button 
                                type="button" 
                                className="search-clear-action-btn"
                                onClick={() => {
                                    setSearchVal('');
                                    if (inputRef.current) inputRef.current.focus();
                                }}
                                aria-label="Clear search"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Trending / Suggestion Pills */}
                {(!searchVal || showSuggestions) && (
                    <div className="search-quick-tags-wrap">
                        <span className="search-quick-label">Trending:</span>
                        <div className="search-quick-chips">
                            {TRENDING_SUGGESTIONS.map((tag, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="search-tag-chip"
                                    onClick={() => {
                                        setSearchVal(tag);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Results Count & Sort Dropdown Row */}
                <div className="search-results-bar">
                    <h2 className="search-results-heading">
                        Results <span className="search-count-pill">({sortedProducts.length})</span>
                    </h2>

                    <div className="search-sort-dropdown-wrap" ref={sortRef}>
                        <button 
                            type="button" 
                            className="search-sort-btn"
                            onClick={() => setIsSortOpen(prev => !prev)}
                            aria-expanded={isSortOpen}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="6" x2="20" y2="6"/>
                                <line x1="8" y1="12" x2="16" y2="12"/>
                                <line x1="11" y1="18" x2="13" y2="18"/>
                            </svg>
                            <span>{sortLabels[sortBy] || 'Sort'}</span>
                            <span className="sort-chevron-icon">{isSortOpen ? '▲' : '▼'}</span>
                        </button>

                        {isSortOpen && (
                            <div className="search-sort-menu">
                                {Object.entries(sortLabels).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        className={`search-sort-option ${sortBy === key ? 'active' : ''}`}
                                        onClick={() => {
                                            setSortBy(key);
                                            setIsSortOpen(false);
                                        }}
                                    >
                                        <span>{label}</span>
                                        {sortBy === key && <span>✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Grid or Empty State */}
                {sortedProducts.length > 0 ? (
                    <div className="mobile-product-grid-2col search-grid">
                        {sortedProducts.map(prod => (
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
                ) : (
                    <div className="search-empty-state">
                        <div className="search-empty-icon-wrap">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                <line x1="8" y1="11" x2="14" y2="11"/>
                            </svg>
                        </div>
                        <h3 className="search-empty-title">No products found</h3>
                        <p className="search-empty-sub">
                            We couldn't find any results matching "<strong>{searchVal}</strong>". Try checking for typos or searching with different keywords.
                        </p>
                        <button 
                            type="button" 
                            className="search-reset-btn"
                            onClick={() => setSearchVal('')}
                        >
                            View All Products
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
