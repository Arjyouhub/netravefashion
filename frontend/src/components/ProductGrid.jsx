import React from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({
    products,
    activeCategory,
    onCategoryChange,
    searchQuery,
    onSearchChange,
    sortMethod,
    onSortChange,
    onQuickView,
    activeTag,
    onTagChange
}) {
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
        filtered.sort((a, b) => b.rating - a.rating);
    }

    const capitalize = (str) => {
        if (!str) return '';
        return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const handleResetFilters = () => {
        onCategoryChange('all');
        onSearchChange('');
        if (onTagChange) onTagChange(null);
    };

    const isFiltered = activeCategory !== 'all' || searchQuery.trim() !== '' || !!activeTag;

    return (
        <section className="products-section" id="products">
            <div className="section-header">
                <h2 className="section-title">Explore Collection</h2>
                <p className="section-desc">Browse through our curated collection of premium men's clothing.</p>
            </div>

            {/* Controls (Category Filter, Search, Sort) */}
            <div className="controls-container">
                {/* Desktop Search (Always visible) */}
                <div className="desktop-search">
                    <svg viewBox="0 0 24 24" className="search-icon">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        className="search-input" 
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                {/* Category Select Dropdown (Visible on Mobile) */}
                <div className="mobile-category-select-wrapper">
                    <label htmlFor="categoryFilter">Category: </label>
                    <select
                        id="categoryFilter"
                        className="category-select"
                        value={activeTag ? 'all' : activeCategory}
                        onChange={(e) => onCategoryChange(e.target.value)}
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Category Tabs (Visible on Desktop) */}
                <div className="category-tabs">
                    {categories.map(cat => (
                        <button 
                            key={cat.id} 
                            className={`tab-btn ${activeCategory === cat.id && !activeTag ? 'active' : ''}`}
                            onClick={() => onCategoryChange(cat.id)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Sort Control */}
                <div className="sort-wrapper">
                    <label htmlFor="sortBy">Sort By: </label>
                    <select 
                        id="sortBy" 
                        className="sort-select" 
                        value={sortMethod} 
                        onChange={(e) => onSortChange(e.target.value)}
                    >
                        <option value="default">Featured</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Rating</option>
                    </select>
                </div>
            </div>

            {/* Active Filters Info Banner */}
            {isFiltered && (
                <div className="active-filter-status">
                    <span>
                        Active filters: <strong>
                            {activeTag === 'New' ? 'Modern New Arrivals' : activeTag ? `${activeTag} Arrivals` : (activeCategory === 'all' ? 'All Items' : capitalize(activeCategory) + 's')}
                            {searchQuery.trim() !== '' ? ` matching "${searchQuery}"` : ''}
                        </strong>
                    </span>
                    <button className="clear-filters-link" onClick={handleResetFilters}>
                        Reset Filters
                    </button>
                </div>
            )}

            {/* Products Grid */}
            {filtered.length > 0 ? (
                <div className="products-grid">
                    {filtered.map(product => (
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                            onQuickView={onQuickView} 
                        />
                    ))}
                </div>
            ) : (
                /* Empty State */
                <div className="products-empty-state">
                    <svg viewBox="0 0 24 24" class="empty-icon">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <h3>No Products Found</h3>
                    <p>We couldn't find anything matching your filters or search keywords. Try checking spelling or changing categories.</p>
                    <button className="cta-btn primary-cta" onClick={handleResetFilters}>
                        View All Products
                    </button>
                </div>
            )}
        </section>
    );
}
