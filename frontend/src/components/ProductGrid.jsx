import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({
    products = [],
    categories = [],
    loading = false,
    activeCategory = 'all',
    onCategoryChange,
    searchQuery = '',
    onSearchChange,
    sortMethod = 'featured',
    onSortChange,
    onQuickView,
    activeTag,
    onTagChange,
    wishlist = [],
    onToggleWishlist,
    onAddToCart
}) {
    // Dynamic Filter States
    const [selectedSubcategory, setSelectedSubcategory] = useState('all');
    const [priceRangeFilter, setPriceRangeFilter] = useState('all'); // 'all', 'under-500', '500-999', '1000-1999', 'above-2000'
    const [selectedBrand, setSelectedBrand] = useState('all');
    const [selectedColor, setSelectedColor] = useState('all');
    const [selectedSize, setSelectedSize] = useState('all');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [minRating, setMinRating] = useState(0);
    const [minDiscount, setMinDiscount] = useState(0);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Extract dynamic brands, colors, sizes, and subcategories from products
    const availableBrands = useMemo(() => {
        const brandsSet = new Set();
        products.forEach(p => { if (p.brand) brandsSet.add(p.brand); });
        return Array.from(brandsSet);
    }, [products]);

    const availableColors = useMemo(() => {
        const colorsSet = new Set();
        products.forEach(p => {
            if (Array.isArray(p.colorVariants)) p.colorVariants.forEach(cv => { if (cv.color) colorsSet.add(cv.color); });
            if (Array.isArray(p.colors)) p.colors.forEach(c => colorsSet.add(c));
            if (Array.isArray(p.variants)) {
                p.variants.forEach(v => {
                    if (v.options?.Color) colorsSet.add(v.options.Color);
                });
            }
        });
        return Array.from(colorsSet);
    }, [products]);

    const availableSizes = useMemo(() => {
        const sizesSet = new Set();
        products.forEach(p => {
            if (Array.isArray(p.sizes)) p.sizes.forEach(s => sizesSet.add(s));
            if (Array.isArray(p.variants)) {
                p.variants.forEach(v => {
                    if (v.options?.Size) sizesSet.add(v.options.Size);
                });
            }
        });
        return Array.from(sizesSet);
    }, [products]);

    // Active Category's Subcategories
    const currentCategoryObj = categories.find(c => (c.slug || c.id) === activeCategory);
    const availableSubcategories = currentCategoryObj?.subcategories || [];

    // Filter Logic
    let filtered = products.filter(prod => {
        // 1. Category Filter
        if (activeCategory !== 'all') {
            const matchesCat = prod.category === activeCategory ||
                (currentCategoryObj && (
                    prod.category?.toLowerCase() === currentCategoryObj.name?.toLowerCase() ||
                    prod.category?.toLowerCase() === currentCategoryObj.slug?.toLowerCase() ||
                    String(prod.category) === String(currentCategoryObj.id)
                ));
            if (!matchesCat) return false;
        }

        // 2. Subcategory Filter
        if (selectedSubcategory !== 'all') {
            const matchesSub = prod.subcategory === selectedSubcategory ||
                prod.subcategory?.toLowerCase() === selectedSubcategory?.toLowerCase() ||
                (typeof selectedSubcategory === 'object' && (
                    prod.subcategory?.toLowerCase() === selectedSubcategory.name?.toLowerCase() ||
                    prod.subcategory?.toLowerCase() === selectedSubcategory.slug?.toLowerCase()
                ));
            if (!matchesSub) return false;
        }

        // 3. Tag Filter
        if (activeTag && !prod.tags?.some(t => t.toLowerCase() === activeTag.toLowerCase())) {
            return false;
        }

        // 4. Search Filter (title, SKU, category, subcategory, brand, tags, description)
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase().trim();
            const inTitle = prod.title?.toLowerCase().includes(q);
            const inSku = prod.sku?.toLowerCase().includes(q);
            const inCat = prod.category?.toLowerCase().includes(q);
            const inSubcat = prod.subcategory?.toLowerCase().includes(q);
            const inBrand = prod.brand?.toLowerCase().includes(q);
            const inDesc = prod.description?.toLowerCase().includes(q);
            const inTags = prod.tags?.some(t => t.toLowerCase().includes(q));
            if (!inTitle && !inSku && !inCat && !inSubcat && !inBrand && !inDesc && !inTags) {
                return false;
            }
        }

        // 5. Price Range Filter
        const price = Number(prod.price) || 0;
        if (priceRangeFilter === 'under-500' && price >= 500) return false;
        if (priceRangeFilter === '500-999' && (price < 500 || price > 999)) return false;
        if (priceRangeFilter === '1000-1999' && (price < 1000 || price > 1999)) return false;
        if (priceRangeFilter === 'above-2000' && price < 2000) return false;

        // 6. Brand Filter
        if (selectedBrand !== 'all' && prod.brand !== selectedBrand) return false;

        // 7. Color Filter
        if (selectedColor !== 'all') {
            const hasColor = prod.colorVariants?.some(cv => cv.color?.toLowerCase() === selectedColor.toLowerCase()) ||
                prod.colors?.some(c => c.toLowerCase() === selectedColor.toLowerCase()) ||
                prod.variants?.some(v => v.options?.Color?.toLowerCase() === selectedColor.toLowerCase());
            if (!hasColor) return false;
        }

        // 8. Size Filter
        if (selectedSize !== 'all') {
            const hasSize = prod.sizes?.includes(selectedSize) ||
                prod.variants?.some(v => v.options?.Size === selectedSize);
            if (!hasSize) return false;
        }

        // 9. Availability Filter
        if (inStockOnly && (prod.stock <= 0 || prod.inStock === false)) {
            return false;
        }

        // 10. Rating Filter
        if (minRating > 0 && (Number(prod.rating) || 0) < minRating) {
            return false;
        }

        // 11. Discount Filter
        if (minDiscount > 0) {
            if (!prod.originalPrice || prod.originalPrice <= prod.price) return false;
            const discPct = Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100);
            if (discPct < minDiscount) return false;
        }

        return true;
    });

    // Sorting Logic
    if (sortMethod === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortMethod === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortMethod === 'rating') {
        filtered.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    } else if (sortMethod === 'bestselling') {
        filtered.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    } else if (sortMethod === 'newest') {
        filtered.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0) || b.id - a.id);
    } else if (sortMethod === 'featured') {
        filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    const handleResetAllFilters = () => {
        onCategoryChange('all');
        setSelectedSubcategory('all');
        onSearchChange('');
        setPriceRangeFilter('all');
        setSelectedBrand('all');
        setSelectedColor('all');
        setSelectedSize('all');
        setInStockOnly(false);
        setMinRating(0);
        setMinDiscount(0);
        if (onTagChange) onTagChange(null);
        onSortChange('featured');
    };

    const isAnyFilterActive = activeCategory !== 'all' ||
        selectedSubcategory !== 'all' ||
        searchQuery.trim() !== '' ||
        priceRangeFilter !== 'all' ||
        selectedBrand !== 'all' ||
        selectedColor !== 'all' ||
        selectedSize !== 'all' ||
        inStockOnly ||
        minRating > 0 ||
        minDiscount > 0 ||
        !!activeTag;

    const capitalize = (str) => {
        if (!str) return '';
        return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <section className="products-section" id="products" style={{ padding: '40px 16px', maxWidth: '1360px', margin: '0 auto' }}>
            {/* Section Header */}
            <div className="section-header" style={{ marginBottom: '24px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: 'var(--primary)', padding: '5px 14px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    ⚡ NETRAVE OFFICIAL STORE
                </div>
                <h2 className="section-title" style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-0.3px', color: '#fff' }}>
                    Explore All Collections
                </h2>
                <p className="section-desc" style={{ fontSize: '13.5px', color: '#94a3b8', maxWidth: '560px', margin: '0 auto', lineHeight: '1.5' }}>
                    Oversized streetwear tees, breathable summer wear, and premium luxury casuals with 24h express dispatch across India.
                </p>
            </div>

            {/* Subcategory Pills Bar (if category is selected and has subcategories) */}
            {availableSubcategories.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
                    <button
                        type="button"
                        onClick={() => setSelectedSubcategory('all')}
                        style={{
                            background: selectedSubcategory === 'all' ? 'var(--primary)' : '#151928',
                            color: selectedSubcategory === 'all' ? '#000' : '#cbd5e1',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '20px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        All {currentCategoryObj?.name}
                    </button>
                    {availableSubcategories.map(sub => {
                        const subKey = typeof sub === 'object' ? (sub.id || sub.slug || sub.name) : sub;
                        const subSlug = typeof sub === 'object' ? (sub.slug || sub.name) : sub;
                        const subName = typeof sub === 'object' ? (sub.name || sub.slug) : sub;
                        const isSelected = selectedSubcategory === subSlug || selectedSubcategory === subName;
                        return (
                            <button
                                key={subKey}
                                type="button"
                                onClick={() => setSelectedSubcategory(subSlug)}
                                style={{
                                    background: isSelected ? 'var(--primary)' : '#151928',
                                    color: isSelected ? '#000' : '#cbd5e1',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '20px',
                                    padding: '6px 14px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {subName}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Filter & Sort Controls Top Bar */}
            <div style={{
                background: '#0e111c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '12px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                {/* Left: Results Count & Filter Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: isFilterDrawerOpen ? 'var(--primary)' : '#171c2c',
                            color: isFilterDrawerOpen ? '#000' : '#fff',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '10px',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span>⚙️</span>
                        <span>{isFilterDrawerOpen ? 'Hide Filters' : 'Filters'}</span>
                        {isAnyFilterActive && (
                            <span style={{
                                background: isFilterDrawerOpen ? '#000' : 'var(--primary)',
                                color: isFilterDrawerOpen ? '#fff' : '#000',
                                borderRadius: '50%',
                                fontSize: '10px',
                                padding: '2px 6px',
                                fontWeight: '900'
                            }}>
                                •
                            </span>
                        )}
                    </button>

                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                        Showing <strong style={{ color: '#fff' }}>{filtered.length}</strong> {filtered.length === 1 ? 'product' : 'products'}
                        {searchQuery && <span> for "<strong style={{ color: 'var(--primary)' }}>{searchQuery}</strong>"</span>}
                    </div>

                    {isAnyFilterActive && (
                        <button
                            type="button"
                            onClick={handleResetAllFilters}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Reset Filters ✕
                        </button>
                    )}
                </div>

                {/* Right: Sort Method Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: '600' }}>Sort by:</span>
                    <select
                        value={sortMethod}
                        onChange={(e) => onSortChange(e.target.value)}
                        style={{
                            background: '#151928',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#fff',
                            borderRadius: '10px',
                            padding: '8px 12px',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="featured">⭐ Featured First</option>
                        <option value="newest">🆕 Newest Arrivals</option>
                        <option value="bestselling">🔥 Best Selling</option>
                        <option value="price-low">💰 Price: Low → High</option>
                        <option value="price-high">💎 Price: High → Low</option>
                        <option value="rating">★ Highest Rated</option>
                    </select>
                </div>
            </div>

            {/* Expandable Advanced Filter Drawer / Panel */}
            {isFilterDrawerOpen && (
                <div style={{
                    background: '#0d101a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '24px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '20px',
                    animation: 'fadeIn 0.2s ease'
                }}>
                    {/* Category Filter */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                            Category
                        </label>
                        <select
                            value={activeCategory}
                            onChange={(e) => { onCategoryChange(e.target.value); setSelectedSubcategory('all'); }}
                            style={filterSelectStyle}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(c => (
                                <option key={c.slug || c.id} value={c.slug || c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Price Range */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                            Price Range
                        </label>
                        <select
                            value={priceRangeFilter}
                            onChange={(e) => setPriceRangeFilter(e.target.value)}
                            style={filterSelectStyle}
                        >
                            <option value="all">All Prices</option>
                            <option value="under-500">Under ₹500</option>
                            <option value="500-999">₹500 - ₹999</option>
                            <option value="1000-1999">₹1000 - ₹1999</option>
                            <option value="above-2000">₹2000 & Above</option>
                        </select>
                    </div>

                    {/* Brand Filter */}
                    {availableBrands.length > 0 && (
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                                Brand
                            </label>
                            <select
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                                style={filterSelectStyle}
                            >
                                <option value="all">All Brands</option>
                                {availableBrands.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Size Filter */}
                    {availableSizes.length > 0 && (
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                                Size
                            </label>
                            <select
                                value={selectedSize}
                                onChange={(e) => setSelectedSize(e.target.value)}
                                style={filterSelectStyle}
                            >
                                <option value="all">All Sizes</option>
                                {availableSizes.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Color Filter */}
                    {availableColors.length > 0 && (
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                                Color
                            </label>
                            <select
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                                style={filterSelectStyle}
                            >
                                <option value="all">All Colors</option>
                                {availableColors.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Quick Toggles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={inStockOnly}
                                onChange={(e) => setInStockOnly(e.target.checked)}
                                style={{ accentColor: 'var(--primary)' }}
                            />
                            In Stock Items Only
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={minDiscount >= 30}
                                onChange={(e) => setMinDiscount(e.target.checked ? 30 : 0)}
                                style={{ accentColor: 'var(--primary)' }}
                            />
                            Deals with 30%+ Discount
                        </label>
                    </div>
                </div>
            )}

            {/* Loading Skeleton */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ fontWeight: '700' }}>Loading products catalog...</p>
                </div>
            ) : filtered.length === 0 ? (
                /* No Results State */
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: '#0d101a',
                    border: '1px dashed rgba(255, 255, 255, 0.12)',
                    borderRadius: '20px',
                    margin: '20px 0'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '0 0 8px' }}>
                        No Matching Products Found
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '460px', margin: '0 auto 20px', lineHeight: '1.5' }}>
                        We couldn't find any products matching your active filters or search keyword. Try clearing filters or search for another term.
                    </p>
                    <button
                        type="button"
                        onClick={handleResetAllFilters}
                        className="cta-btn primary-cta"
                        style={{ padding: '10px 24px', borderRadius: '10px' }}
                    >
                        Clear All Filters
                    </button>
                </div>
            ) : (
                /* Products Grid */
                <div className="products-grid">
                    {filtered.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onQuickView={onQuickView}
                            isWishlisted={wishlist.includes(product.id)}
                            onToggleWishlist={onToggleWishlist}
                            onAddToCart={onAddToCart}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

const filterSelectStyle = {
    width: '100%',
    background: '#141828',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#fff',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '13px',
    fontWeight: '600',
    outline: 'none',
    cursor: 'pointer'
};
