import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';

export default function CategoryPage({
    products = [],
    categories = [],
    initialCategory = 'footwear',
    onQuickView,
    wishlist = [],
    onToggleWishlist,
    onAddToCart,
    onNavigate
}) {
    const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
    const [sortMethod, setSortMethod] = useState('recommended');
    const [priceRange, setPriceRange] = useState(5000);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [selectedColors, setSelectedColors] = useState([]);
    const [minRating, setMinRating] = useState(0);
    const [onlyDiscounted, setOnlyDiscounted] = useState(false);
    
    // Bottom Sheet toggles
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
    const [searchLocalQuery, setSearchLocalQuery] = useState('');

    const allBrands = ['Nike', 'Adidas', 'Puma', 'Netrave Studio', 'Campus', 'Fastrack'];
    const allSizes = ['6', '7', '8', '9', '10', 'S', 'M', 'L', 'XL'];
    const allColors = [
        { name: 'Black', hex: '#000000' },
        { name: 'White', hex: '#ffffff' },
        { name: 'Red', hex: '#ef4444' },
        { name: 'Yellow', hex: '#FFD400' },
        { name: 'Blue', hex: '#3b82f6' }
    ];

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            // Category check
            if (selectedCategory && selectedCategory !== 'all') {
                if (p.category !== selectedCategory && !p.subcategory?.includes(selectedCategory)) {
                    return false;
                }
            }
            // Local search query inside category
            if (searchLocalQuery.trim()) {
                const q = searchLocalQuery.toLowerCase().trim();
                if (!p.title?.toLowerCase().includes(q) && !p.brand?.toLowerCase().includes(q)) {
                    return false;
                }
            }
            // Price range check
            if (p.price > priceRange) return false;

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

            // Color check
            if (selectedColors.length > 0) {
                const hasColor = p.colors?.some(c => selectedColors.some(sc => c.toLowerCase().includes(sc.toLowerCase())));
                if (!hasColor) return false;
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
    }, [products, selectedCategory, searchLocalQuery, priceRange, selectedBrands, selectedSizes, selectedColors, minRating, onlyDiscounted, sortMethod]);

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
        setPriceRange(5000);
        setSelectedBrands([]);
        setSelectedSizes([]);
        setSelectedColors([]);
        setMinRating(0);
        setOnlyDiscounted(false);
        setIsFilterSheetOpen(false);
    };

    const currentCategoryTitle = useMemo(() => {
        if (!selectedCategory || selectedCategory === 'all') return 'All Collections';
        const found = categories.find(c => c.slug === selectedCategory);
        if (found) return found.name;
        return selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
    }, [selectedCategory, categories]);

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
                    <span className="cat-bc-current">{currentCategoryTitle}</span>
                </div>

                {/* Title & Sort Row: Footwear (36 Products) + [Sort] button */}
                <div className="category-header-mobile-row">
                    <div className="cat-title-meta">
                        <h1 className="category-main-title">{currentCategoryTitle}</h1>
                        <span className="category-items-count">{filteredProducts.length} Products</span>
                    </div>

                    <button 
                        type="button" 
                        className="btn-open-sort-sheet"
                        onClick={() => setIsSortSheetOpen(true)}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/>
                        </svg>
                        <span>Sort</span>
                    </button>
                </div>

                {/* Quick Filter Buttons Pill Row: [Filters], [Brand v], [Size v] */}
                <div className="category-filter-pills-row">
                    <button 
                        type="button" 
                        className={`pill-filter-btn main ${selectedBrands.length > 0 || selectedSizes.length > 0 || onlyDiscounted ? 'active' : ''}`}
                        onClick={() => setIsFilterSheetOpen(true)}
                    >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                        </svg>
                        <span>Filters</span>
                        {(selectedBrands.length > 0 || selectedSizes.length > 0) && (
                            <span className="filter-pill-count">●</span>
                        )}
                    </button>

                    <button 
                        type="button" 
                        className={`pill-filter-btn ${selectedBrands.length > 0 ? 'active' : ''}`}
                        onClick={() => setIsFilterSheetOpen(true)}
                    >
                        <span>Brand</span>
                        <span className="pill-arrow">▾</span>
                    </button>

                    <button 
                        type="button" 
                        className={`pill-filter-btn ${selectedSizes.length > 0 ? 'active' : ''}`}
                        onClick={() => setIsFilterSheetOpen(true)}
                    >
                        <span>Size</span>
                        <span className="pill-arrow">▾</span>
                    </button>
                </div>

                {/* 2-Column Mobile Product Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="category-empty-state">
                        <div className="empty-icon-art">🔍</div>
                        <h3>No Products Found</h3>
                        <p>Try clearing your active filters to see all available products.</p>
                        <button type="button" className="btn-primary-yellow" onClick={clearAllFilters}>
                            Clear Filters
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
                <div className="bottom-sheet-backdrop" onClick={() => setIsFilterSheetOpen(false)}>
                    <div className="bottom-sheet-card" onClick={(e) => e.stopPropagation()}>
                        <div className="sheet-drag-handle"></div>
                        <div className="sheet-header-row">
                            <h3>Filter Products</h3>
                            <button type="button" className="sheet-close-btn" onClick={() => setIsFilterSheetOpen(false)}>✕</button>
                        </div>

                        <div className="sheet-content-scroll">
                            {/* Brand Filters */}
                            <div className="sheet-filter-group">
                                <h4>Brand</h4>
                                <div className="sheet-chips-row">
                                    {allBrands.map(b => (
                                        <button
                                            key={b}
                                            type="button"
                                            className={`sheet-chip ${selectedBrands.includes(b) ? 'active' : ''}`}
                                            onClick={() => handleBrandToggle(b)}
                                        >
                                            {b}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Size Filters */}
                            <div className="sheet-filter-group">
                                <h4>Size</h4>
                                <div className="sheet-chips-row">
                                    {allSizes.map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            className={`sheet-chip ${selectedSizes.includes(s) ? 'active' : ''}`}
                                            onClick={() => handleSizeToggle(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Max Price Slider */}
                            <div className="sheet-filter-group">
                                <div className="sheet-filter-header-flex">
                                    <h4>Max Price</h4>
                                    <span className="price-tag">₹{priceRange}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="499" 
                                    max="6000" 
                                    step="100"
                                    value={priceRange} 
                                    onChange={(e) => setPriceRange(Number(e.target.value))}
                                    className="sheet-range-slider"
                                />
                                <div className="slider-limits">
                                    <span>₹499</span>
                                    <span>₹6,000</span>
                                </div>
                            </div>

                            {/* Discount Toggle */}
                            <div className="sheet-filter-group">
                                <label className="sheet-checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        checked={onlyDiscounted}
                                        onChange={(e) => setOnlyDiscounted(e.target.checked)}
                                    />
                                    <span>Discounted Items Only</span>
                                </label>
                            </div>
                        </div>

                        {/* Sheet Footer Action Buttons */}
                        <div className="sheet-footer-actions">
                            <button type="button" className="sheet-btn-clear" onClick={clearAllFilters}>
                                Clear All
                            </button>
                            <button 
                                type="button" 
                                className="sheet-btn-apply"
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
                <div className="bottom-sheet-backdrop" onClick={() => setIsSortSheetOpen(false)}>
                    <div className="bottom-sheet-card sort-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="sheet-drag-handle"></div>
                        <div className="sheet-header-row">
                            <h3>Sort Products</h3>
                            <button type="button" className="sheet-close-btn" onClick={() => setIsSortSheetOpen(false)}>✕</button>
                        </div>

                        <div className="sort-options-list">
                            {[
                                { key: 'recommended', label: 'Recommended' },
                                { key: 'price-low', label: 'Price: Low to High' },
                                { key: 'price-high', label: 'Price: High to Low' },
                                { key: 'rating', label: 'Customer Rating' },
                                { key: 'newest', label: 'Newest Arrivals' }
                            ].map(opt => (
                                <button
                                    key={opt.key}
                                    type="button"
                                    className={`sort-option-item ${sortMethod === opt.key ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSortMethod(opt.key);
                                        setIsSortSheetOpen(false);
                                    }}
                                >
                                    <span>{opt.label}</span>
                                    {sortMethod === opt.key && <span className="sort-check">✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
