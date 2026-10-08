import React, { useState, useEffect, useRef } from 'react';

export default function Header({
    cartCount = 0,
    wishlistCount = 0,
    onCartOpen,
    onWishlistOpen,
    onTrackingOpen,
    activeCategory = 'all',
    onCategoryChange,
    searchQuery = '',
    onSearchChange,
    user,
    onLogout,
    onLoginClick,
    onNavigate,
    categories = [],
    products = [],
    currentPage = 'home'
}) {
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);
    const categoryDropdownRef = useRef(null);
    const userMenuRef = useRef(null);

    // Live search suggestions
    const trimmedQuery = searchQuery.trim().toLowerCase();
    const suggestions = trimmedQuery.length >= 1
        ? products.filter(p => {
            return (
                p.title?.toLowerCase().includes(trimmedQuery) ||
                p.category?.toLowerCase().includes(trimmedQuery) ||
                p.brand?.toLowerCase().includes(trimmedQuery) ||
                p.tags?.some(t => t.toLowerCase().includes(trimmedQuery))
            );
        }).slice(0, 5)
        : [];

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setIsSearchFocused(false);
            }
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
                setIsCategoryDropdownOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        setIsSearchFocused(false);
        if (onNavigate) {
            onNavigate('search', { query: searchQuery });
        }
    };

    const handleSelectSuggestion = (title) => {
        onSearchChange(title);
        setIsSearchFocused(false);
        if (onNavigate) {
            onNavigate('search', { query: title });
        }
    };

    const handleNav = (page, params = {}) => {
        setIsMobileDrawerOpen(false);
        setIsCategoryDropdownOpen(false);
        setIsUserMenuOpen(false);
        if (onNavigate) {
            onNavigate(page, params);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCategoryClick = (catSlug) => {
        setIsMobileDrawerOpen(false);
        setIsCategoryDropdownOpen(false);
        if (onCategoryChange) {
            onCategoryChange(catSlug);
        }
        if (onNavigate) {
            onNavigate('category', { category: catSlug });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <header className="netrave-header-master">
            {/* 1. Yellow Top Announcement Bar (Desktop & Tablet) */}
            <div className="netrave-top-bar">
                <div className="netrave-header-container top-bar-inner">
                    <div className="top-bar-left">
                        <span className="top-bar-shipping-icon">🚚</span>
                        <span className="top-bar-text">Free Shipping on Orders Above ₹999</span>
                    </div>
                    <div className="top-bar-right">
                        <button type="button" className="top-bar-link" onClick={() => handleNav('tracking')}>
                            Track Order
                        </button>
                        <span className="top-bar-divider">|</span>
                        <button type="button" className="top-bar-link" onClick={() => handleNav('account', { tab: 'support' })}>
                            Help
                        </button>
                        <span className="top-bar-divider">|</span>
                        <button type="button" className="top-bar-link" onClick={() => handleNav('account', { tab: 'support' })}>
                            Contact
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Main Deep Black Header */}
            <div className="netrave-main-header">
                <div className="netrave-header-container main-header-inner">
                    {/* Left: Mobile Hamburger & Exact Netrave Logo */}
                    <div className="header-left-cluster">
                        <button 
                            type="button" 
                            className="mobile-hamburger-btn" 
                            onClick={() => setIsMobileDrawerOpen(prev => !prev)}
                            aria-label="Toggle navigation menu"
                        >
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>

                        {/* EXACT PRESERVED NETRAVE BRAND LOGO */}
                        <div 
                            className="header-brand-link" 
                            onClick={() => handleNav('home')} 
                            role="button" 
                            tabIndex={0}
                            style={{ cursor: 'pointer' }}
                        >
                            <img 
                                src="/assets/logo.png" 
                                alt="NETRAVE Logo" 
                                className="header-logo-image" 
                            />
                            <div className="header-brand-text">
                                <div className="header-brand-title">
                                    <span className="logo-net">Net</span>
                                    <span className="logo-rave" style={{ color: 'var(--netrave-yellow, #FFD400)' }}>rave</span>
                                </div>
                                <span className="header-brand-sub" style={{ color: 'var(--netrave-yellow, #FFD400)' }}>
                                    CLOTHING & STYLE
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Center: Desktop Search Input Box */}
                    <div className="header-search-container" ref={searchContainerRef}>
                        <form className="header-search-form" onSubmit={handleSearchSubmit}>
                            <input 
                                ref={searchInputRef}
                                type="text" 
                                className="header-search-input" 
                                placeholder="Search for products, brands and more..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                            />
                            {searchQuery && (
                                <button 
                                    type="button" 
                                    className="search-clear-btn" 
                                    onClick={() => onSearchChange('')}
                                    aria-label="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                            <button type="submit" className="header-search-submit-btn" aria-label="Search">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                </svg>
                            </button>
                        </form>

                        {/* Search Dropdown Suggestions */}
                        {isSearchFocused && suggestions.length > 0 && (
                            <div className="search-dropdown-menu">
                                <div className="search-dropdown-label">Suggested Products</div>
                                {suggestions.map(item => (
                                    <div 
                                        key={item.id} 
                                        className="search-suggestion-item"
                                        onClick={() => handleSelectSuggestion(item.title)}
                                    >
                                        <img src={item.image} alt={item.title} className="suggestion-img" />
                                        <div className="suggestion-info">
                                            <span className="suggestion-title">{item.title}</span>
                                            <span className="suggestion-price">₹{item.price}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Actions Cluster (Search, Wishlist, Cart, Account) */}
                    <div className="header-actions-cluster">
                        {/* Mobile Search Icon Button */}
                        <button 
                            type="button" 
                            className="mobile-search-toggle-btn"
                            onClick={() => handleNav('search')}
                            aria-label="Search"
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                        </button>

                        {/* Wishlist Button with Badge */}
                        <button 
                            type="button" 
                            className="header-action-btn header-wishlist-action-btn"
                            onClick={() => handleNav('wishlist')}
                            title="Saved to Wishlist"
                            aria-label="Wishlist"
                        >
                            <div className="action-icon-badge-wrap">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="header-action-icon">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                                {wishlistCount > 0 && (
                                    <span className="action-badge-count">{wishlistCount}</span>
                                )}
                            </div>
                            <span className="header-action-label desktop-only-text">Wishlist</span>
                        </button>

                        {/* Cart Button with Yellow Badge */}
                        <button 
                            type="button" 
                            className="header-action-btn cart-action-btn"
                            onClick={() => handleNav('cart')}
                            title="View Shopping Cart"
                            aria-label="Cart"
                        >
                            <div className="action-icon-badge-wrap">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="header-action-icon">
                                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                                </svg>
                                <span className="cart-badge-yellow">{cartCount}</span>
                            </div>
                            <span className="header-action-label desktop-only-text">Cart</span>
                        </button>

                        {/* Desktop Account Dropdown Button */}
                        <div className="account-dropdown-wrapper desktop-only-flex" ref={userMenuRef}>
                            <button 
                                type="button" 
                                className="header-action-btn"
                                onClick={() => {
                                    if (!user) {
                                        if (onLoginClick) onLoginClick();
                                        else handleNav('login');
                                    } else {
                                        setIsUserMenuOpen(prev => !prev);
                                    }
                                }}
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="header-action-icon">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                                <span className="header-action-label">
                                    {user ? (user.name ? user.name.split(' ')[0] : 'Account') : 'Account'}
                                </span>
                            </button>

                            {/* User Menu Dropdown */}
                            {user && isUserMenuOpen && (
                                <div className="user-dropdown-popover">
                                    <div className="user-dropdown-header">
                                        <div className="user-dropdown-avatar">
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div className="user-dropdown-meta">
                                            <strong>{user.name || 'Member'}</strong>
                                            <span>{user.phone || user.email || 'Netrave Customer'}</span>
                                        </div>
                                    </div>
                                    <hr className="dropdown-divider" />
                                    <button type="button" className="dropdown-menu-link" onClick={() => handleNav('account', { tab: 'profile' })}>
                                        👤 My Profile
                                    </button>
                                    <button type="button" className="dropdown-menu-link" onClick={() => handleNav('orders')}>
                                        📦 My Orders
                                    </button>
                                    <button type="button" className="dropdown-menu-link" onClick={() => handleNav('wishlist')}>
                                        ❤️ My Wishlist
                                    </button>
                                    <button type="button" className="dropdown-menu-link" onClick={() => handleNav('addresses')}>
                                        📍 Saved Addresses
                                    </button>
                                    <button type="button" className="dropdown-menu-link" onClick={() => handleNav('tracking')}>
                                        🚚 Track Orders
                                    </button>
                                    <hr className="dropdown-divider" />
                                    <button 
                                        type="button" 
                                        className="dropdown-menu-link text-danger" 
                                        onClick={() => {
                                            setIsUserMenuOpen(false);
                                            if (onLogout) onLogout();
                                        }}
                                    >
                                        🚪 Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sub-Header Mobile Search Bar Pill (Shown on Home and Category as in reference) */}
                {(currentPage === 'home' || currentPage === 'category') && (
                    <div className="mobile-search-pill-container">
                        <div 
                            className="mobile-search-pill" 
                            onClick={() => handleNav('search')}
                            role="button"
                            tabIndex={0}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="#9ca3af">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                            <span className="search-pill-placeholder">
                                {currentPage === 'category' ? `Search in ${activeCategory === 'all' ? 'All Collections' : activeCategory}...` : 'Search for products, brands...'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Category Navigation Bar (Desktop & Tablet) */}
            <nav className="netrave-category-bar desktop-only-flex">
                <div className="netrave-header-container category-bar-inner">
                    <div className="all-categories-btn-wrapper" ref={categoryDropdownRef}>
                        <button 
                            type="button" 
                            className="all-categories-btn"
                            onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                        >
                            <span className="categories-hamburger-icon">☰</span>
                            <span className="categories-btn-label">All Categories</span>
                            <span className="categories-chevron">▼</span>
                        </button>

                        {isCategoryDropdownOpen && (
                            <div className="all-categories-dropdown-menu">
                                <button type="button" className="cat-drop-item" onClick={() => handleCategoryClick('all')}>
                                    🛍️ All Products
                                </button>
                                <button type="button" className="cat-drop-item" onClick={() => handleCategoryClick('t-shirt')}>
                                    👕 Streetwear T-Shirts
                                </button>
                                <button type="button" className="cat-drop-item" onClick={() => handleCategoryClick('shirt')}>
                                    👔 Casual & Linen Shirts
                                </button>
                                <button type="button" className="cat-drop-item" onClick={() => handleCategoryClick('hoodies')}>
                                    🧥 Jackets & Hoodies
                                </button>
                                <button type="button" className="cat-drop-item" onClick={() => handleCategoryClick('pants')}>
                                    👖 Jeans & Cargos
                                </button>
                                <button type="button" className="cat-drop-item" onClick={() => handleCategoryClick('footwear')}>
                                    👟 Footwear & Sneakers
                                </button>
                                <button type="button" className="cat-drop-item" onClick={() => handleCategoryClick('watches')}>
                                    ⌚ Premium Watches
                                </button>
                                <button type="button" className="cat-drop-item" onClick={() => handleCategoryClick('saree')}>
                                    🥻 Sarees & Ethnic Wear
                                </button>
                                <button type="button" className="cat-drop-item" onClick={() => handleCategoryClick('kurti')}>
                                    👗 Designer Kurtis
                                </button>
                                <button type="button" className="cat-drop-item" onClick={() => handleCategoryClick('accessories')}>
                                    🕶️ Accessories & Bags
                                </button>
                            </div>
                        )}
                    </div>

                    <ul className="category-links-list">
                        <li>
                            <button 
                                type="button" 
                                className={`cat-link-item ${activeCategory === 'shirt' ? 'active' : ''}`}
                                onClick={() => handleCategoryClick('shirt')}
                            >
                                Men
                            </button>
                        </li>
                        <li>
                            <button 
                                type="button" 
                                className={`cat-link-item ${activeCategory === 'saree' ? 'active' : ''}`}
                                onClick={() => handleCategoryClick('saree')}
                            >
                                Women
                            </button>
                        </li>
                        <li>
                            <button 
                                type="button" 
                                className={`cat-link-item ${activeCategory === 'watches' ? 'active' : ''}`}
                                onClick={() => handleCategoryClick('watches')}
                            >
                                Watches
                            </button>
                        </li>
                        <li>
                            <button 
                                type="button" 
                                className={`cat-link-item ${activeCategory === 'footwear' ? 'active' : ''}`}
                                onClick={() => handleCategoryClick('footwear')}
                            >
                                Footwear
                            </button>
                        </li>
                        <li>
                            <button 
                                type="button" 
                                className={`cat-link-item ${activeCategory === 'accessories' ? 'active' : ''}`}
                                onClick={() => handleCategoryClick('accessories')}
                            >
                                Accessories
                            </button>
                        </li>
                        <li>
                            <button 
                                type="button" 
                                className="cat-link-item highlight-new"
                                onClick={() => handleCategoryClick('all')}
                            >
                                New Arrivals
                            </button>
                        </li>
                        <li>
                            <button 
                                type="button" 
                                className="cat-link-item highlight-offers"
                                onClick={() => handleNav('offers')}
                            >
                                Offers 🔥
                            </button>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* 4. Mobile Slide-out Drawer */}
            {isMobileDrawerOpen && (
                <div className="mobile-drawer-overlay" onClick={() => setIsMobileDrawerOpen(false)}>
                    <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-drawer-header">
                            <div className="header-brand-link">
                                <img src="/assets/logo.png" alt="NETRAVE Logo" className="header-logo-image" style={{ height: '30px' }} />
                                <div className="header-brand-title">
                                    <span className="logo-net">Net</span>
                                    <span className="logo-rave" style={{ color: 'var(--netrave-yellow, #FFD400)' }}>rave</span>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                className="mobile-drawer-close-btn"
                                onClick={() => setIsMobileDrawerOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mobile-drawer-user-card">
                            {user ? (
                                <div className="mobile-user-row">
                                    <div className="user-avatar-circle">
                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div>
                                        <strong>Hello, {user.name || 'Member'}</strong>
                                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{user.phone || user.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    type="button" 
                                    className="mobile-login-trigger-btn"
                                    onClick={() => {
                                        setIsMobileDrawerOpen(false);
                                        if (onLoginClick) onLoginClick();
                                        else handleNav('login');
                                    }}
                                >
                                    Login / Sign Up →
                                </button>
                            )}
                        </div>

                        <div className="mobile-drawer-nav-section">
                            <h4 className="mobile-drawer-section-title">Categories</h4>
                            <ul className="mobile-drawer-list">
                                <li><button type="button" onClick={() => handleCategoryClick('all')}>🛍️ All Products</button></li>
                                <li><button type="button" onClick={() => handleCategoryClick('shirt')}>👔 Men's Collection</button></li>
                                <li><button type="button" onClick={() => handleCategoryClick('saree')}>🥻 Women's Fashion</button></li>
                                <li><button type="button" onClick={() => handleCategoryClick('watches')}>⌚ Premium Watches</button></li>
                                <li><button type="button" onClick={() => handleCategoryClick('footwear')}>👟 Footwear & Sneakers</button></li>
                                <li><button type="button" onClick={() => handleCategoryClick('t-shirt')}>👕 Streetwear T-Shirts</button></li>
                                <li><button type="button" onClick={() => handleCategoryClick('pants')}>👖 Jeans & Cargos</button></li>
                                <li><button type="button" onClick={() => handleCategoryClick('accessories')}>🕶️ Accessories</button></li>
                                <li><button type="button" onClick={() => handleNav('offers')}>🔥 Special Offers</button></li>
                            </ul>

                            <h4 className="mobile-drawer-section-title">Account & Orders</h4>
                            <ul className="mobile-drawer-list">
                                <li><button type="button" onClick={() => handleNav('orders')}>📦 My Orders</button></li>
                                <li><button type="button" onClick={() => handleNav('tracking')}>🚚 Track Order</button></li>
                                <li><button type="button" onClick={() => handleNav('wishlist')}>❤️ Wishlist ({wishlistCount})</button></li>
                                <li><button type="button" onClick={() => handleNav('cart')}>🛒 Shopping Cart ({cartCount})</button></li>
                                <li><button type="button" onClick={() => handleNav('addresses')}>📍 Manage Addresses</button></li>
                                <li><button type="button" onClick={() => handleNav('account', { tab: 'support' })}>💬 24/7 Support</button></li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
