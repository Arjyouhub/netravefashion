import React, { useState, useEffect, useRef } from 'react';

export default function Header({
    cartCount = 0,
    wishlistCount = 0,
    onCartOpen,
    onWishlistOpen,
    onBookingsOpen,
    onProfileOpen,
    activeCategory = 'all',
    onCategoryChange,
    searchQuery = '',
    onSearchChange,
    mobileDrawerOpen: propMobileDrawerOpen,
    setMobileDrawerOpen: propSetMobileDrawerOpen,
    activeTag,
    onTagChange,
    setIsAdminView,
    onSortChange,
    user,
    onLogout,
    onLoginClick,
    onTrackingOpen,
    categories = [],
    products = []
}) {
    const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
    const [localDrawerOpen, setLocalDrawerOpen] = useState(false);
    const [categoriesExpanded, setCategoriesExpanded] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [recentSearches, setRecentSearches] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('netrave_recent_searches')) || ['Oversized', 'Linen', 'Cargo'];
        } catch {
            return ['Oversized', 'Linen', 'Cargo'];
        }
    });

    const searchRef = useRef(null);

    const mobileDrawerOpen = propMobileDrawerOpen !== undefined ? propMobileDrawerOpen : localDrawerOpen;
    const setMobileDrawerOpen = propSetMobileDrawerOpen !== undefined ? propSetMobileDrawerOpen : setLocalDrawerOpen;

    // Use backend categories or fallback to default categories if still loading
    const displayCategories = [
        { id: 'all', slug: 'all', name: 'All Items' },
        ...(categories.length > 0 ? categories : [
            { id: 1, slug: 't-shirt', name: 'T-Shirts' },
            { id: 2, slug: 'shirt', name: 'Shirts' },
            { id: 3, slug: 'hoodies', name: 'Jackets & Hoodies' },
            { id: 4, slug: 'pants', name: 'Pants & Cargos' },
            { id: 5, slug: 'footwear', name: 'Footwear & Shoes' },
            { id: 6, slug: 'saree', name: 'Sarees' },
            { id: 7, slug: 'kurti', name: 'Kurtis & Ethnic' }
        ])
    ];

    // Filter live search suggestions based on query
    const searchSuggestions = searchQuery.trim().length >= 1
        ? products.filter(p => {
            const q = searchQuery.toLowerCase().trim();
            return (
                p.title?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q) ||
                p.subcategory?.toLowerCase().includes(q) ||
                p.sku?.toLowerCase().includes(q) ||
                p.brand?.toLowerCase().includes(q) ||
                p.tags?.some(t => t.toLowerCase().includes(q))
            );
        }).slice(0, 5)
        : [];

    const handleSelectSuggestion = (title) => {
        onSearchChange(title);
        setIsSearchFocused(false);
        setMobileSearchVisible(false);
        saveRecentSearch(title);
        scrollToProducts();
    };

    const saveRecentSearch = (query) => {
        if (!query || !query.trim()) return;
        const trimmed = query.trim();
        const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
        setRecentSearches(updated);
        try {
            localStorage.setItem('netrave_recent_searches', JSON.stringify(updated));
        } catch { }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            saveRecentSearch(searchQuery);
            setIsSearchFocused(false);
            setMobileSearchVisible(false);
            scrollToProducts();
        }
    };

    const scrollToProducts = () => {
        setTimeout(() => {
            const prodSec = document.getElementById('products');
            if (prodSec) prodSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
    };

    // Close suggestions dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCategoryClick = (catSlug, isMobile = false) => {
        onCategoryChange(catSlug);
        if (onTagChange) onTagChange(null);
        if (isMobile) {
            setMobileDrawerOpen(false);
        }
        scrollToProducts();
    };

    const triggerHome = () => {
        setIsAdminView(false);
        onCategoryChange('all');
        if (onTagChange) onTagChange(null);
        onSearchChange('');
        setMobileDrawerOpen(false);
        window.history.pushState({}, '', '/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <header className="main-header" style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(9, 11, 17, 0.94)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div className="header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', maxWidth: '1360px', margin: '0 auto', gap: '16px' }}>
                    {/* 1. LOGO */}
                    <div className="header-left-group" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); triggerHome(); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                            <img src="/assets/logo.png" alt="NETRAVE Logo" className="logo-img" style={{ height: '38px', width: 'auto' }} />
                            <div className="logo-text" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="logo-accent" style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.3px', lineHeight: '1.1' }}>
                                    <span className="logo-net" style={{ color: '#ffffff' }}>NET</span>
                                    <span className="logo-rave" style={{ color: 'var(--primary)' }}>RAVE</span>
                                </div>
                                <span className="logo-sub" style={{ fontSize: '7.5px', letterSpacing: '1.6px', color: 'var(--primary)', fontWeight: '800' }}>
                                    CLOTHING & STYLE
                                </span>
                            </div>
                        </a>

                        {/* 2. DESKTOP CATEGORY NAVIGATION */}
                        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none', maxWidth: '550px' }}>
                            <ul style={{ display: 'flex', gap: '6px', listStyle: 'none', margin: 0, padding: 0 }}>
                                {displayCategories.map(cat => {
                                    const slug = cat.slug || cat.id;
                                    const isActive = activeCategory === slug && !activeTag;
                                    return (
                                        <li key={slug}>
                                            <button
                                                type="button"
                                                className={`nav-link ${isActive ? 'active' : ''}`}
                                                onClick={() => handleCategoryClick(slug)}
                                                style={{
                                                    background: isActive ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                                                    color: isActive ? 'var(--primary)' : '#cbd5e1',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '8px 12px',
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {cat.name}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                    </div>

                    {/* 3. SEARCH BAR (Desktop) WITH SUGGESTIONS & RECENT SEARCHES */}
                    <div ref={searchRef} className="desktop-search-header" style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
                        <div className="search-input-wrapper" style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: '#121624',
                            border: isSearchFocused ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '12px',
                            padding: '6px 14px',
                            transition: 'all 0.2s ease',
                            width: '100%'
                        }}>
                            <span style={{ marginRight: '8px', opacity: 0.6 }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Search products, brands, SKU, tags..."
                                className="search-input"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onKeyDown={handleSearchKeyDown}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#ffffff',
                                    outline: 'none',
                                    width: '100%',
                                    fontSize: '13px',
                                    fontFamily: 'inherit'
                                }}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => onSearchChange('')}
                                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
                                >
                                    &times;
                                </button>
                            )}
                        </div>

                        {/* Search Suggestions Popover */}
                        {isSearchFocused && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 6px)',
                                left: 0,
                                right: 0,
                                background: '#111422',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '14px',
                                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)',
                                padding: '12px',
                                zIndex: 1100,
                                maxHeight: '380px',
                                overflowY: 'auto'
                            }}>
                                {/* Matching Products */}
                                {searchSuggestions.length > 0 ? (
                                    <div>
                                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.8px', marginBottom: '8px', textTransform: 'uppercase' }}>
                                            ⚡ Matching Products ({searchSuggestions.length})
                                        </div>
                                        {searchSuggestions.map(item => (
                                            <div
                                                key={`sug-${item.id}`}
                                                onClick={() => handleSelectSuggestion(item.title)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.15s ease'
                                                }}
                                                className="search-item-hover"
                                            >
                                                <img src={item.image} alt={item.title} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {item.title}
                                                    </div>
                                                    <div style={{ fontSize: '11.5px', color: '#94a3b8', display: 'flex', gap: '8px' }}>
                                                        <span>₹{item.price}</span>
                                                        <span>•</span>
                                                        <span>{item.category}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : searchQuery.trim().length >= 1 ? (
                                    <div style={{ padding: '10px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
                                        No direct matches for "{searchQuery}". Press Enter to search all.
                                    </div>
                                ) : null}

                                {/* Recent Searches */}
                                {recentSearches.length > 0 && (
                                    <div style={{ marginTop: searchSuggestions.length > 0 ? '12px' : '0', paddingTop: searchSuggestions.length > 0 ? '10px' : '0', borderTop: searchSuggestions.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>🕒 Recent Searches</span>
                                            <span
                                                onClick={() => { setRecentSearches([]); localStorage.removeItem('netrave_recent_searches'); }}
                                                style={{ cursor: 'pointer', color: '#ef4444' }}
                                            >
                                                Clear
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {recentSearches.map((term, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => handleSelectSuggestion(term)}
                                                    style={{
                                                        background: '#191e30',
                                                        border: '1px solid rgba(255,255,255,0.08)',
                                                        color: '#cbd5e1',
                                                        borderRadius: '20px',
                                                        padding: '4px 10px',
                                                        fontSize: '11.5px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 4. ACTIONS (Account, Wishlist, Cart) */}
                    <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Mobile Search Toggle */}
                        <button
                            type="button"
                            className="action-btn mobile-search-trigger"
                            onClick={() => setMobileSearchVisible(!mobileSearchVisible)}
                            aria-label="Search"
                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px' }}
                        >
                            <span style={{ fontSize: '18px' }}>🔍</span>
                        </button>

                        {/* Customer Account / Login (Desktop) */}
                        {user ? (
                            <button
                                type="button"
                                className="header-profile-chip desktop-only-action"
                                onClick={onProfileOpen}
                                title={`Account (${user.name})`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#141828',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: '24px',
                                    padding: '5px 12px 5px 6px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    background: 'var(--primary)',
                                    color: '#0a0b0e',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '900',
                                    fontSize: '12px'
                                }}>
                                    {(user.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <span>{user.name?.split(' ')[0] || 'Account'}</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="action-btn header-login-chip desktop-only-action"
                                onClick={onLoginClick}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '10px',
                                    padding: '7px 14px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <span>👤</span>
                                <span>Login</span>
                            </button>
                        )}

                        {/* Live Courier Tracking Chip */}
                        <button
                            type="button"
                            className="action-btn header-track-chip desktop-only-action"
                            onClick={onTrackingOpen}
                            title="Track Order Live"
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '10px',
                                padding: '7px 12px',
                                color: '#cbd5e1',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <span>🚚</span>
                            <span>Track</span>
                        </button>

                        {/* Wishlist Button (Responsive: visible on both Mobile and Desktop) */}
                        <button
                            type="button"
                            className="action-btn header-wishlist-chip"
                            onClick={onWishlistOpen}
                            title="My Wishlist"
                            style={{
                                position: 'relative',
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                padding: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <span style={{ fontSize: '19px' }}>❤️</span>
                            {wishlistCount > 0 && (
                                <span className="cart-badge" style={{
                                    position: 'absolute',
                                    top: '-2px',
                                    right: '-2px',
                                    background: '#ef4444',
                                    color: '#fff',
                                    borderRadius: '50%',
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    padding: '2px 5px',
                                    lineHeight: 1
                                }}>
                                    {wishlistCount}
                                </span>
                            )}
                        </button>

                        {/* Shopping Bag / Cart */}
                        <button
                            type="button"
                            className="action-btn header-cart-chip"
                            onClick={onCartOpen}
                            title="Shopping Bag"
                            style={{
                                position: 'relative',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#0a0b0e',
                                padding: '8px 14px',
                                fontWeight: '800',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <span>🛒</span>
                            <span className="cart-badge" style={{
                                background: '#0a0b0e',
                                color: '#fff',
                                borderRadius: '20px',
                                fontSize: '11px',
                                padding: '2px 6px',
                                fontWeight: '800'
                            }}>
                                {cartCount}
                            </span>
                        </button>

                        {/* Mobile Hamburger Drawer Button */}
                        <button
                            type="button"
                            className="action-btn mobile-menu-btn"
                            onClick={() => setMobileDrawerOpen(true)}
                            aria-label="Navigation Menu"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                padding: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            <span style={{ fontSize: '22px' }}>☰</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Search Input Overlay */}
                {mobileSearchVisible && (
                    <div style={{ padding: '8px 16px 12px', background: '#090a10', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="search-input-wrapper" style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: '#131826',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '10px',
                            padding: '6px 12px'
                        }}>
                            <span style={{ marginRight: '8px' }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Search products, brands, SKU..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                autoFocus
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                    outline: 'none',
                                    width: '100%',
                                    fontSize: '13px',
                                    fontFamily: 'inherit'
                                }}
                            />
                            {searchQuery && (
                                <button type="button" onClick={() => onSearchChange('')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '16px' }}>
                                    &times;
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* RESPONSIVE MOBILE NAVIGATION DRAWER */}
            <div className={`mobile-nav-drawer ${mobileDrawerOpen ? 'open' : ''}`} style={{
                position: 'fixed',
                top: 0,
                bottom: 0,
                left: 0,
                width: '300px',
                maxWidth: '85vw',
                background: '#0d101a',
                borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                zIndex: 2000,
                transform: mobileDrawerOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '10px 0 30px rgba(0,0,0,0.7)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="/assets/logo.png" alt="NETRAVE" style={{ height: '28px' }} />
                        <span style={{ fontWeight: '900', color: '#fff', fontSize: '15px' }}>NETRAVE STORE</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMobileDrawerOpen(false)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}
                    >
                        &times;
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                    {/* User profile state */}
                    <div style={{ marginBottom: '20px', padding: '12px', background: '#141828', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
                                        {(user.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', color: '#fff', fontSize: '14px' }}>{user.name}</div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user.phone || user.email}</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setMobileDrawerOpen(false); onProfileOpen(); }}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                                >
                                    Edit
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '8px' }}>Sign in to track orders & save wishlist</div>
                                <button
                                    type="button"
                                    onClick={() => { setMobileDrawerOpen(false); onLoginClick(); }}
                                    className="cta-btn primary-cta"
                                    style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: '8px' }}
                                >
                                    Login / Register
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Navigation Items */}
                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '1px', marginBottom: '10px', textTransform: 'uppercase' }}>
                        Browse Categories
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
                        {displayCategories.map(cat => {
                            const slug = cat.slug || cat.id;
                            const isActive = activeCategory === slug;
                            return (
                                <button
                                    key={`mob-${slug}`}
                                    type="button"
                                    onClick={() => handleCategoryClick(slug, true)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 14px',
                                        background: isActive ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                                        color: isActive ? 'var(--primary)' : '#cbd5e1',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: '700',
                                        fontSize: '14px',
                                        textAlign: 'left',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span>{cat.name}</span>
                                    {cat.subcategories?.length > 0 && (
                                        <span style={{ fontSize: '11px', color: '#64748b' }}>({cat.subcategories.length})</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Tools */}
                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '1px', marginBottom: '10px', textTransform: 'uppercase' }}>
                        Quick Shortcuts
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button
                            type="button"
                            onClick={() => { setMobileDrawerOpen(false); onTrackingOpen(); }}
                            style={drawerToolBtnStyle}
                        >
                            <span>🚚</span> Track Shipment
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMobileDrawerOpen(false); onWishlistOpen(); }}
                            style={drawerToolBtnStyle}
                        >
                            <span>❤️</span> Saved Wishlist ({wishlistCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMobileDrawerOpen(false); onCartOpen(); }}
                            style={drawerToolBtnStyle}
                        >
                            <span>🛒</span> Shopping Bag ({cartCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setMobileDrawerOpen(false);
                                setTimeout(() => {
                                    const footer = document.querySelector('.main-footer');
                                    if (footer) footer.scrollIntoView({ behavior: 'smooth' });
                                }, 120);
                            }}
                            style={drawerToolBtnStyle}
                        >
                            <span>💬</span> WhatsApp Support
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Drawer Backdrop */}
            {mobileDrawerOpen && (
                <div
                    onClick={() => setMobileDrawerOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 1999
                    }}
                />
            )}
        </>
    );
}

const drawerToolBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: '#131828',
    color: '#e2e8f0',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '13.5px',
    textAlign: 'left',
    cursor: 'pointer'
};
