import React, { useState } from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({
    products,
    loading = false,
    activeCategory,
    onCategoryChange,
    searchQuery,
    onSearchChange,
    sortMethod,
    onSortChange,
    onQuickView,
    activeTag,
    onTagChange,
    wishlist = [],
    onToggleWishlist
}) {
    const [filterPill, setFilterPill] = useState('all'); // 'all', 'deal', 'rated', 'budget', 'freedel'

    const categories = [
        { id: 'all', label: 'All Items' },
        { id: 'summer-t-shirt', label: 'Summer T-Shirts' },
        { id: 't-shirt', label: 'T-Shirts' },
        { id: 'shirt', label: 'Shirts' },
        { id: 'pants', label: 'Pants' }
    ];

    // Filter logic
    let filtered = products.filter(prod => {
        if (activeCategory !== 'all' && prod.category !== activeCategory) return false;
        if (activeTag && !prod.tags?.some(t => t.toLowerCase() === activeTag.toLowerCase())) return false;
        
        // Flipkart/Amazon style secondary filter chips
        if (filterPill === 'deal') {
            const hasBigDiscount = prod.originalPrice && ((prod.originalPrice - prod.price) / prod.originalPrice) >= 0.3;
            if (!hasBigDiscount) return false;
        } else if (filterPill === 'rated') {
            if ((prod.rating || 0) < 4.5) return false;
        } else if (filterPill === 'budget') {
            if (prod.price > 699) return false;
        } else if (filterPill === 'freedel') {
            if (prod.price < 499) return false;
        }

        return true;
    });

    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(prod => 
            prod.title.toLowerCase().includes(query) || 
            prod.description.toLowerCase().includes(query) ||
            prod.category.toLowerCase().includes(query)
        );
    }

    // Sort logic
    if (sortMethod === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortMethod === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortMethod === 'rating') {
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortMethod === 'discount') {
        filtered.sort((a, b) => {
            const discA = a.originalPrice ? ((a.originalPrice - a.price) / a.originalPrice) : 0;
            const discB = b.originalPrice ? ((b.originalPrice - b.price) / b.originalPrice) : 0;
            return discB - discA;
        });
    }

    const capitalize = (str) => {
        if (!str) return '';
        return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const handleResetFilters = () => {
        onCategoryChange('all');
        onSearchChange('');
        setFilterPill('all');
        if (onTagChange) onTagChange(null);
    };

    const isFiltered = activeCategory !== 'all' || searchQuery.trim() !== '' || !!activeTag || filterPill !== 'all';

    return (
        <section className="products-section" id="products">
            <div className="section-header" style={{ marginBottom: '24px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: 'var(--primary)', padding: '5px 14px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    ⚡ NETRAVE OFFICIAL STORE
                </div>
                <h2 className="section-title" style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-0.3px', color: '#fff' }}>
                    Explore Our Collections
                </h2>
                <p className="section-desc" style={{ fontSize: '13.5px', color: '#94a3b8', maxWidth: '520px', margin: '0 auto', lineHeight: '1.5' }}>
                    Oversized tees, premium linen shirts, and trending summer wear curated with express courier dispatch.
                </p>
            </div>

            {/* Modern Dropdown Filters & Sort Bar */}
            <div className="catalog-filters-bar" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
                marginBottom: '16px',
                width: '100%'
            }}>
                {/* 1. Category Filter Dropdown */}
                <div style={{ position: 'relative' }}>
                    <select
                        id="categorySelect"
                        value={activeCategory}
                        onChange={(e) => {
                            onCategoryChange(e.target.value);
                            if (onTagChange) onTagChange(null);
                        }}
                        aria-label="Filter by category"
                        style={{
                            width: '100%',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            background: '#12141c',
                            border: (activeCategory !== 'all' && !activeTag) ? '1.5px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.12)',
                            color: (activeCategory !== 'all' && !activeTag) ? 'var(--primary)' : '#ffffff',
                            padding: '11px 32px 11px 14px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            outline: 'none',
                            boxShadow: (activeCategory !== 'all' && !activeTag) ? '0 0 12px rgba(245, 158, 11, 0.2)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <option value="all">📁 All Categories</option>
                        <option value="summer-t-shirt">☀️ Summer T-Shirts</option>
                        <option value="t-shirt">👕 T-Shirts Collection</option>
                        <option value="shirt">👔 Casual & Formal Shirts</option>
                        <option value="pants">👖 Cargoes & Pants</option>
                    </select>
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', fontSize: '11px' }}>▼</span>
                </div>

                {/* 2. Special Deals & Offers Dropdown */}
                <div style={{ position: 'relative' }}>
                    <select
                        id="offerSelect"
                        value={filterPill}
                        onChange={(e) => setFilterPill(e.target.value)}
                        aria-label="Filter by deals & offers"
                        style={{
                            width: '100%',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            background: '#12141c',
                            border: filterPill !== 'all' ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                            color: filterPill !== 'all' ? '#34d399' : '#cbd5e1',
                            padding: '11px 32px 11px 14px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            outline: 'none',
                            boxShadow: filterPill !== 'all' ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <option value="all">⚡ All Deals & Offers</option>
                        <option value="deal">🔥 30%+ Off Deals</option>
                        <option value="rated">⭐ 4.5+ Top Rated</option>
                        <option value="budget">💰 Under ₹699 Budget</option>
                        <option value="freedel">🚚 Free Delivery Eligible</option>
                    </select>
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', fontSize: '11px' }}>▼</span>
                </div>

                {/* 3. Sort By Dropdown */}
                <div style={{ position: 'relative' }}>
                    <select
                        id="sortBy"
                        className="sort-select"
                        value={sortMethod}
                        onChange={(e) => onSortChange(e.target.value)}
                        aria-label="Sort products"
                        style={{
                            width: '100%',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            background: '#12141c',
                            border: sortMethod !== 'default' ? '1.5px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#ffffff',
                            padding: '11px 32px 11px 14px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <option value="default">⇅ Sort: Featured</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Top Customer Rated</option>
                        <option value="discount">Biggest Discount %</option>
                    </select>
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', fontSize: '11px' }}>▼</span>
                </div>
            </div>

            {/* Results Count & Active Filter Tags */}
            <div className="catalog-meta-bar" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '18px', 
                fontSize: '12.5px', 
                color: '#94a3b8', 
                flexWrap: 'wrap', 
                gap: '10px' 
            }}>
                <div>
                    Showing <strong style={{ color: '#fff' }}>{filtered.length}</strong> {filtered.length === 1 ? 'item' : 'items'}
                </div>
                {isFiltered && (
                    <div className="active-filter-status" style={{ margin: 0, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span>
                            Filtered: <strong>
                                {activeTag === 'New' ? 'New Arrivals' : activeTag ? `${activeTag}` : (activeCategory === 'all' ? 'All' : capitalize(activeCategory))}
                                {filterPill !== 'all' ? ` • ${filterPill.toUpperCase()}` : ''}
                                {searchQuery.trim() !== '' ? ` • "${searchQuery}"` : ''}
                            </strong>
                        </span>
                        <button className="clear-filters-link" onClick={handleResetFilters} style={{ marginLeft: '6px' }}>
                            ✕ Clear All
                        </button>
                    </div>
                )}
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="products-grid">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                        <div key={n} className="skeleton-card">
                            <div className="skeleton-image" />
                            <div className="skeleton-info">
                                <div className="skeleton-title" />
                                <div className="skeleton-text" style={{ width: '40%' }} />
                                <div className="skeleton-text" style={{ width: '60%' }} />
                                <div className="skeleton-button" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <div className="products-grid">
                    {filtered.map(product => (
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                            onQuickView={onQuickView}
                            isWishlisted={wishlist.includes(product.id)}
                            onToggleWishlist={onToggleWishlist}
                        />
                    ))}
                </div>
            ) : (
                /* Empty State */
                <div className="products-empty-state">
                    <svg viewBox="0 0 24 24" className="empty-icon">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <h3>No Products Found</h3>
                    <p>We couldn't find anything matching your filters or search keywords. Try checking spelling or resetting filters.</p>
                    <button className="cta-btn primary-cta" onClick={handleResetFilters}>
                        View All Products
                    </button>
                </div>
            )}
        </section>
    );
}
