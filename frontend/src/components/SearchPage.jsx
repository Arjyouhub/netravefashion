import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';

const SEARCH_SUGGESTIONS = [
    'nike shoes men',
    'nike running shoes',
    'nike casual shoes',
    'nike air max'
];

export default function SearchPage({
    products = [],
    initialQuery = 'nike shoes',
    onQuickView,
    wishlist = [],
    onToggleWishlist,
    onAddToCart,
    onNavigate
}) {
    const [searchVal, setSearchVal] = useState(initialQuery || 'nike shoes');
    const [showSuggestions, setShowSuggestions] = useState(true);

    const filteredProducts = useMemo(() => {
        const q = searchVal.trim().toLowerCase();
        if (!q) return products;
        return products.filter(p => 
            p.title?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q) ||
            p.subcategory?.toLowerCase().includes(q) ||
            p.brand?.toLowerCase().includes(q)
        );
    }, [products, searchVal]);

    // Fallback products matching screen 15 if search result list is small
    const displayProducts = filteredProducts.length > 0 ? filteredProducts : [
        {
            id: 201,
            title: "Nike Running Shoes",
            category: "footwear",
            price: 2999,
            originalPrice: 4999,
            rating: 4.5,
            reviews: 120,
            image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
            tag: "40% OFF"
        },
        {
            id: 202,
            title: "Nike Air Max",
            category: "footwear",
            price: 3499,
            originalPrice: 6999,
            rating: 4.6,
            reviews: 98,
            image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80",
            tag: "45% OFF"
        },
        {
            id: 203,
            title: "Puma Sports Shoes",
            category: "footwear",
            price: 1999,
            originalPrice: 3499,
            rating: 4.2,
            reviews: 76,
            image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80",
            tag: "New"
        },
        {
            id: 204,
            title: "Casual Shoes",
            category: "footwear",
            price: 1299,
            originalPrice: 2499,
            rating: 4.3,
            reviews: 64,
            image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop&q=80",
            tag: "New"
        }
    ];

    return (
        <div className="netrave-page-wrapper search-screen">
            <div className="netrave-container search-container-narrow">
                {/* Search Bar Input Matching Screen 15 */}
                <div className="mobile-search-bar-wrap">
                    <span className="search-bar-lens">🔍</span>
                    <input 
                        type="text" 
                        className="mobile-search-input"
                        placeholder="Search for products, brands..."
                        value={searchVal}
                        onChange={(e) => {
                            setSearchVal(e.target.value);
                            setShowSuggestions(true);
                        }}
                    />
                    {searchVal && (
                        <button 
                            type="button" 
                            className="search-clear-btn"
                            onClick={() => {
                                setSearchVal('');
                                setShowSuggestions(false);
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Suggestions List Matching Screen 15 */}
                {showSuggestions && (
                    <div className="search-suggestions-list">
                        {SEARCH_SUGGESTIONS.map((item, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className="search-suggestion-row"
                                onClick={() => {
                                    setSearchVal(item);
                                    setShowSuggestions(false);
                                }}
                            >
                                <span className="sugg-lens">🔍</span>
                                <span className="sugg-text">{item}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Results Count & Sort Row Matching Screen 15 */}
                <div className="search-results-bar">
                    <h2 className="search-results-heading">
                        Results <span className="search-count-pill">(126)</span>
                    </h2>
                    <button 
                        type="button" 
                        className="search-sort-btn"
                        onClick={() => alert('Sort options: Price Low to High, Price High to Low, Rating, Newest')}
                    >
                        ⚡ Sort
                    </button>
                </div>

                {/* 2-Column Product Grid Matching Screen 15 */}
                <div className="mobile-product-grid-2col search-grid">
                    {displayProducts.map(prod => (
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
            </div>
        </div>
    );
}
