import React, { useState, useMemo, useEffect } from 'react';
import ProductCard from './ProductCard';

const DEFAULT_CATEGORIES = [
    { slug: 'all', name: 'All', icon: '🛍️' },
    { slug: 'men', name: 'Men', icon: '👔' },
    { slug: 'women', name: 'Women', icon: '👗' },
    { slug: 't-shirt', name: 'T-Shirts', icon: '👕' },
    { slug: 'shirt', name: 'Shirts', icon: '👔' },
    { slug: 'footwear', name: 'Footwear', icon: '👟' },
    { slug: 'watches', name: 'Watches', icon: '⌚' },
    { slug: 'saree', name: 'Sarees', icon: '🥻' },
    { slug: 'kurti', name: 'Kurtis', icon: '👗' },
    { slug: 'hoodies', name: 'Jackets & Hoodies', icon: '🧥' },
    { slug: 'pants', name: 'Jeans & Pants', icon: '👖' },
    { slug: 'accessories', name: 'Accessories', icon: '🕶️' }
];

export default function CategoryPage({
    products = [],
    categories = [],
    initialCategory = 'all',
    onQuickView,
    wishlist = [],
    onToggleWishlist,
    onAddToCart,
    onNavigate
}) {
    const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
    const [sortMethod, setSortMethod] = useState('recommended');
    const [priceRange, setPriceRange] = useState(6000);
    const [quickPriceMax, setQuickPriceMax] = useState(null);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [minRating, setMinRating] = useState(0);
    const [onlyDiscounted, setOnlyDiscounted] = useState(false);
    
    // Bottom Sheet toggles
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
    const [searchLocalQuery, setSearchLocalQuery] = useState('');

    // Keep state in sync if prop changes (e.g. from header nav click)
    useEffect(() => {
        if (initialCategory) {
            setSelectedCategory(initialCategory);
        }
    }, [initialCategory]);

    const allBrands = ['Nike', 'Adidas', 'Puma', 'Netrave Studio', 'Campus', 'Fastrack'];
    const allSizes = ['6', '7', '8', '9', '10', 'S', 'M', 'L', 'XL', 'XXL'];

    // Combine prop categories or fallbacks
    const navCategories = useMemo(() => {
        if (categories && categories.length > 0) {
            const list = [{ slug: 'all', name: 'All', icon: '🛍️' }];
            categories.forEach(c => {
                list.push({
                    slug: c.slug || c.name.toLowerCase(),
                    name: c.name,
                    icon: c.icon || '✨'
                });
            });
            return list;
        }
        return DEFAULT_CATEGORIES;
    }, [categories]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            // Category check
            if (selectedCategory && selectedCategory !== 'all') {
                const sel = selectedCategory.toLowerCase();
                const pCat = (p.category || '').toLowerCase();
                const pSub = (typeof p.subcategory === 'string' ? p.subcategory : p.subcategory?.slug || '').toLowerCase();
                const pTags = Array.isArray(p.tags) ? p.tags.map(t => t.toLowerCase()) : [];
                const pGender = (p.gender || '').toLowerCase();

                let matches = false;
                if (sel === 'men') {
                    matches = pGender === 'men' || ['shirt', 't-shirt', 'pants', 'hoodies', 'shoes', 'footwear'].includes(pCat) || pTags.includes('men');
                } else if (sel === 'women') {
                    matches = pGender === 'women' || ['women', 'saree', 'kurti', 'dress', 'ethnic'].includes(pCat) || pTags.includes('women');
                } else {
                    matches = pCat === sel || pSub.includes(sel) || pCat.includes(sel) || pTags.includes(sel);
                }

                if (!matches) return false;
            }

            // Local search query inside category
            if (searchLocalQuery.trim()) {
                const q = searchLocalQuery.toLowerCase().trim();
                const titleMatch = p.title?.toLowerCase().includes(q);
                const brandMatch = p.brand?.toLowerCase().includes(q);
                const tagMatch = p.tags?.some(t => t.toLowerCase().includes(q));
                if (!titleMatch && !brandMatch && !tagMatch) {
                    return false;
                }
            }

            // Price range check
            const maxPriceEffective = quickPriceMax || priceRange;
            if (p.price > maxPriceEffective) return false;

            // Brand check
            if (selectedBrands.length > 0) {
                const b = p.brand || 'Netrave Studio';
                if (!selectedBrands.includes(b)) return false;
            }

            // Size check
            if (selectedSizes.length > 0) {
                const hasSize = p.sizes?.some(s => selectedSizes.includes(s));
                if (!hasSize) return false;
            }

            // Rating check
            if (minRating > 0 && (p.rating || 0) < minRating) return false;

            // Discount check
            if (onlyDiscounted && (!p.originalPrice || p.originalPrice <= p.price)) return false;

            return true;
        }).sort((a, b) => {
            if (sortMethod === 'price-low') return a.price - b.price;
            if (sortMethod === 'price-high') return b.price - a.price;
            if (sortMethod === 'rating') return (b.rating || 0) - (a.rating || 0);
            if (sortMethod === 'newest') return (b.id || 0) - (a.id || 0);
            return (b.rating || 0) - (a.rating || 0);
        });
    }, [products, selectedCategory, searchLocalQuery, priceRange, quickPriceMax, selectedBrands, selectedSizes, minRating, onlyDiscounted, sortMethod]);

    const handleCategorySelect = (slug) => {
        setSelectedCategory(slug);
        if (onNavigate) {
            onNavigate('category', { category: slug });
        }
    };

    const handleBrandToggle = (brand) => {
        setSelectedBrands(prev => 
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );
    };

    const handleSizeToggle = (size) => {
        setSelectedSizes(prev => 
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const clearAllFilters = () => {
        setPriceRange(6000);
        setQuickPriceMax(null);
        setSelectedBrands([]);
        setSelectedSizes([]);
        setMinRating(0);
        setOnlyDiscounted(false);
        setSearchLocalQuery('');
        setIsFilterSheetOpen(false);
    };

    const currentCategoryTitle = useMemo(() => {
        if (!selectedCategory || selectedCategory === 'all') return 'All Collections';
        const found = navCategories.find(c => c.slug === selectedCategory);
        if (found) return found.name;
        return selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
    }, [selectedCategory, navCategories]);

    const activeFilterCount = selectedBrands.length + selectedSizes.length + (onlyDiscounted ? 1 : 0) + (quickPriceMax ? 1 : 0) + (priceRange < 6000 ? 1 : 0);

    return (
        <div className="netrave-page-wrapper category-mobile-page">
            <div className="netrave-container">
                {/* Search Bar at Top of Category Page */}
                <div className="category-search-bar-wrap">
                    <div className="category-search-input-box">
                        <span className="cat-search-icon">🔍</span>
                        <input 
                            type="text" 
                            className="cat-search-input"
                            placeholder={`Search in ${currentCategoryTitle}...`}
                            value={searchLocalQuery}
                            onChange={(e) => setSearchLocalQuery(e.target.value)}
                        />
                        {searchLocalQuery && (
                            <button type="button" className="cat-search-clear" onClick={() => setSearchLocalQuery('')}>✕</button>
                        )}
                    </div>
                </div>

                {/* Breadcrumb Row: Home > Footwear */}
                <div className="category-breadcrumb-row">
                    <button type="button" className="cat-bc-link" onClick={() => onNavigate && onNavigate('home')}>Home</button>
                    <span className="cat-bc-sep">&gt;</span>
                    <button type="button" className="cat-bc-link" onClick={() => handleCategorySelect('all')}>Collections</button>
                    <span className="cat-bc-sep">&gt;</span>
                    <span className="cat-bc-current">{currentCategoryTitle}</span>
                </div>

                {/* Horizontal Category Navigation Chips */}
                <div className="category-nav-chips-row">
                    {navCategories.map(cat => {
                        const isSelected = selectedCategory === cat.slug;
                        return (
                            <button
                                key={cat.slug}
                                type="button"
                                className={`cat-nav-chip ${isSelected ? 'active' : ''}`}
                                onClick={() => handleCategorySelect(cat.slug)}
                            >
                                {cat.icon && <span className="cat-nav-chip-icon">{cat.icon}</span>}
                                <span>{cat.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Title & Sort Row: Category Name (X Products) + [Sort] button */}
                <div className="category-header-mobile-row">
                    <div className="cat-title-meta">
                        <h1 className="category-main-title">{currentCategoryTitle}</h1>
                        <span className="category-items-count">{filteredProducts.length} Products Available</span>
                    </div>

                    <button 
                        type="button" 
                        className="btn-open-sort-sheet"
                        onClick={() => setIsSortSheetOpen(true)}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/>
                        </svg>
                        <span>Sort: {sortMethod === 'price-low' ? 'Low to High' : sortMethod === 'price-high' ? 'High to Low' : sortMethod === 'rating' ? 'Rating' : sortMethod === 'newest' ? 'Newest' : 'Featured'}</span>
                    </button>
                </div>

                {/* Quick Filter Buttons Pill Row: [Filters], [Brand], [Size], [Under 999], [Discounted] */}
                <div className="category-filter-pills-row">
                    <button 
                        type="button" 
                        className={`pill-filter-btn main ${activeFilterCount > 0 ? 'active' : ''}`}
                        onClick={() => setIsFilterSheetOpen(true)}
                    >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                        </svg>
                        <span>All Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="filter-pill-count">({activeFilterCount})</span>
                        )}
                    </button>

                    <button 
                        type="button" 
                        className={`pill-filter-btn ${selectedBrands.length > 0 ? 'active' : ''}`}
                        onClick={() => setIsFilterSheetOpen(true)}
                    >
                        <span>Brand {selectedBrands.length > 0 ? `(${selectedBrands.length})` : ''}</span>
                        <span className="pill-arrow">▾</span>
                    </button>

                    <button 
                        type="button" 
                        className={`pill-filter-btn ${selectedSizes.length > 0 ? 'active' : ''}`}
                        onClick={() => setIsFilterSheetOpen(true)}
                    >
                        <span>Size {selectedSizes.length > 0 ? `(${selectedSizes.length})` : ''}</span>
                        <span className="pill-arrow">▾</span>
                    </button>

                    <button 
                        type="button" 
                        className={`pill-filter-btn ${quickPriceMax === 999 ? 'active' : ''}`}
                        onClick={() => setQuickPriceMax(quickPriceMax === 999 ? null : 999)}
                    >
                        <span>Under ₹999</span>
                    </button>

                    <button 
                        type="button" 
                        className={`pill-filter-btn ${quickPriceMax === 1999 ? 'active' : ''}`}
                        onClick={() => setQuickPriceMax(quickPriceMax === 1999 ? null : 1999)}
                    >
                        <span>Under ₹1,999</span>
                    </button>

                    <button 
                        type="button" 
                        className={`pill-filter-btn ${onlyDiscounted ? 'active' : ''}`}
                        onClick={() => setOnlyDiscounted(!onlyDiscounted)}
                    >
                        <span>🏷️ On Sale</span>
                    </button>

                    {activeFilterCount > 0 && (
                        <button 
                            type="button" 
                            className="pill-filter-btn clear-pills-btn"
                            onClick={clearAllFilters}
                        >
                            <span>Clear All</span>
                        </button>
                    )}
                </div>

                {/* 2-Column Mobile & Multi-Column Desktop Product Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="category-empty-state">
                        <div className="empty-icon-art">🔍</div>
                        <h3>No Products Found</h3>
                        <p>No products match your current filters in {currentCategoryTitle}.</p>
                        <button type="button" className="btn-primary-yellow" onClick={clearAllFilters}>
                            Clear Filters & View All
                        </button>
                    </div>
                ) : (
                    <div className="mobile-product-grid-2col">
                        {filteredProducts.map(prod => (
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
                )}
            </div>

            {/* TOUCH-FRIENDLY BOTTOM SHEET FILTER MODAL */}
            {isFilterSheetOpen && (
                <div className="bottom-sheet-overlay" onClick={() => setIsFilterSheetOpen(false)}>
                    <div className="bottom-sheet-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="bottom-sheet-header">
                            <h3>Filter Products</h3>
                            <button type="button" className="bottom-sheet-close-btn" onClick={() => setIsFilterSheetOpen(false)}>✕</button>
                        </div>

                        <div className="bottom-sheet-body">
                            {/* Brand Filters */}
                            <div className="filter-sheet-section">
                                <h4>Brand</h4>
                                <div className="chip-group-wrap">
                                    {allBrands.map(b => (
                                        <button
                                            key={b}
                                            type="button"
                                            className={`sheet-filter-chip ${selectedBrands.includes(b) ? 'active' : ''}`}
                                            onClick={() => handleBrandToggle(b)}
                                        >
                                            {b}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Size Filters */}
                            <div className="filter-sheet-section">
                                <h4>Size</h4>
                                <div className="chip-group-wrap">
                                    {allSizes.map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            className={`sheet-filter-chip ${selectedSizes.includes(s) ? 'active' : ''}`}
                                            onClick={() => handleSizeToggle(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Max Price Slider */}
                            <div className="filter-sheet-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h4 style={{ margin: 0 }}>Max Price</h4>
                                    <span style={{ fontWeight: 800, color: '#f59e0b' }}>₹{priceRange}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="499" 
                                    max="6000" 
                                    step="100" 
                                    value={priceRange} 
                                    onChange={(e) => {
                                        setPriceRange(Number(e.target.value));
                                        setQuickPriceMax(null);
                                    }}
                                    style={{ width: '100%', accentColor: '#f59e0b' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
                                    <span>₹499</span>
                                    <span>₹6,000</span>
                                </div>
                            </div>

                            {/* Discount Toggle */}
                            <div className="filter-sheet-section">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                    <input 
                                        type="checkbox" 
                                        checked={onlyDiscounted} 
                                        onChange={(e) => setOnlyDiscounted(e.target.checked)}
                                        style={{ accentColor: '#f59e0b', width: '18px', height: '18px' }}
                                    />
                                    <span>Discounted Items Only</span>
                                </label>
                            </div>
                        </div>

                        {/* Sheet Footer Action Buttons */}
                        <div className="bottom-sheet-footer">
                            <button type="button" className="btn-sheet-clear" onClick={clearAllFilters}>
                                Clear All
                            </button>
                            <button 
                                type="button" 
                                className="btn-sheet-apply"
                                onClick={() => setIsFilterSheetOpen(false)}
                            >
                                Apply Filters ({filteredProducts.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOUCH-FRIENDLY BOTTOM SHEET SORT MODAL */}
            {isSortSheetOpen && (
                <div className="bottom-sheet-overlay" onClick={() => setIsSortSheetOpen(false)}>
                    <div className="bottom-sheet-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="bottom-sheet-header">
                            <h3>Sort Products</h3>
                            <button type="button" className="bottom-sheet-close-btn" onClick={() => setIsSortSheetOpen(false)}>✕</button>
                        </div>

                        <div className="bottom-sheet-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    { key: 'recommended', label: 'Featured & Recommended' },
                                    { key: 'price-low', label: 'Price: Low to High' },
                                    { key: 'price-high', label: 'Price: High to Low' },
                                    { key: 'rating', label: 'Highest Customer Rating' },
                                    { key: 'newest', label: 'Newest Arrivals' }
                                ].map(opt => (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 16px',
                                            background: sortMethod === opt.key ? '#fffbeb' : '#f9fafb',
                                            border: `1.5px solid ${sortMethod === opt.key ? '#f59e0b' : '#e5e7eb'}`,
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: sortMethod === opt.key ? 700 : 500,
                                            color: '#111',
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}
                                        onClick={() => {
                                            setSortMethod(opt.key);
                                            setIsSortSheetOpen(false);
                                        }}
                                    >
                                        <span>{opt.label}</span>
                                        {sortMethod === opt.key && <span style={{ color: '#f59e0b', fontWeight: 900 }}>✓</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
