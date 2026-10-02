import React, { useState } from 'react';

export default function Header({
    cartCount,
    onCartOpen,
    onBookingsOpen,
    onProfileOpen,
    activeCategory,
    onCategoryChange,
    searchQuery,
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
    wishlistCount = 0,
    onWishlistOpen,
    onTrackingOpen
}) {
    const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
    const [localDrawerOpen, setLocalDrawerOpen] = useState(false);
    const [categoriesExpanded, setCategoriesExpanded] = useState(false);

    const mobileDrawerOpen = propMobileDrawerOpen !== undefined ? propMobileDrawerOpen : localDrawerOpen;
    const setMobileDrawerOpen = propSetMobileDrawerOpen !== undefined ? propSetMobileDrawerOpen : setLocalDrawerOpen;

    const categories = [
        { id: 'all', label: 'All Items' },
        { id: 't-shirt', label: 'T-Shirts' },
        { id: 'shirt', label: 'Shirts' },
        { id: 'pants', label: 'Pants' }
    ];

    const handleCategoryClick = (catId, isMobile = false) => {
        onCategoryChange(catId);
        if (isMobile) {
            setMobileDrawerOpen(false);
        }
    };

    // Nav Drawer trigger functions
    const triggerHome = () => {
        setIsAdminView(false);
        onCategoryChange('all');
        onTagChange(null);
        onSearchChange('');
        setMobileDrawerOpen(false);
        window.history.pushState({}, '', '/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const triggerShop = () => {
        setIsAdminView(false);
        onCategoryChange('all');
        onTagChange(null);
        onSearchChange('');
        setMobileDrawerOpen(false);
        window.history.pushState({}, '', '/');
        setTimeout(() => {
            const prodSec = document.getElementById('products');
            if (prodSec) prodSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    };

    const triggerNewArrivals = () => {
        setIsAdminView(false);
        onTagChange('New');
        onSearchChange('');
        setMobileDrawerOpen(false);
        window.history.pushState({}, '', '/');
        setTimeout(() => {
            const prodSec = document.getElementById('products');
            if (prodSec) prodSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    };

    const triggerBestSellers = () => {
        setIsAdminView(false);
        onSortChange('rating');
        onTagChange(null);
        onCategoryChange('all');
        onSearchChange('');
        setMobileDrawerOpen(false);
        window.history.pushState({}, '', '/');
        setTimeout(() => {
            const prodSec = document.getElementById('products');
            if (prodSec) prodSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    };

    const triggerCart = () => {
        setMobileDrawerOpen(false);
        onCartOpen();
    };

    const triggerTrackOrder = () => {
        setMobileDrawerOpen(false);
        if (onTrackingOpen) {
            onTrackingOpen();
        } else {
            onBookingsOpen();
        }
    };

    const triggerWishlist = () => {
        setMobileDrawerOpen(false);
        if (onWishlistOpen) onWishlistOpen();
    };

    const triggerContact = () => {
        setMobileDrawerOpen(false);
        setTimeout(() => {
            const footer = document.querySelector('.main-footer');
            if (footer) footer.scrollIntoView({ behavior: 'smooth' });
        }, 150);
    };

    return (
        <>
            {/* Header Section */}
            <header className="main-header">
                <div className="header-container">
                    <div className="header-left-group">
                        {/* Logo */}
                        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); triggerHome(); }}>
                            <img src="/assets/logo.png" alt="NETRAVE Logo" className="logo-img" />
                            <div className="logo-text">
                                <div className="logo-accent">
                                    <span className="logo-net">NET</span>
                                    <span className="logo-rave">RAVE</span>
                                </div>
                                <span className="logo-sub">CLOTHING & STYLE</span>
                            </div>
                        </a>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="desktop-nav">
                        <ul>
                            {categories.map(cat => (
                                <li key={cat.id}>
                                    <button 
                                        className={`nav-link ${activeCategory === cat.id && !activeTag ? 'active' : ''}`}
                                        onClick={() => handleCategoryClick(cat.id)}
                                    >
                                        {cat.id === 'all' ? 'Home' : cat.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Action Buttons */}
                    <div className="header-actions">
                        <div className="search-input-wrapper desktop-search-header">
                            <input 
                                type="text" 
                                placeholder="Search T-shirts, Shirts, Pants..." 
                                className="search-input" 
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                            {searchQuery && (
                                <button className="clear-search-btn" onClick={() => onSearchChange('')}>
                                    &times;
                                </button>
                            )}
                        </div>

                        {/* Search Toggle (Mobile) */}
                        <button 
                            className="action-btn mobile-search-trigger" 
                            onClick={() => setMobileSearchVisible(!mobileSearchVisible)}
                            aria-label="Search Toggle"
                            title="Search"
                        >
                            <svg viewBox="0 0 24 24" className="icon"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                        </button>

                        {/* Desktop: Live Courier Tracking Quick Action */}
                        <button 
                            className="action-btn header-track-chip desktop-only-action"
                            onClick={onTrackingOpen}
                            title="Live Courier Delivery Telemetry"
                            aria-label="Track Courier Live"
                        >
                            <span style={{ fontSize: '15px' }}>🚚</span>
                            <span className="track-text-label">Track</span>
                        </button>

                        {/* Desktop: Wishlist Button */}
                        <button 
                            className="action-btn header-wishlist-chip desktop-only-action"
                            onClick={onWishlistOpen}
                            title="My Saved Wishlist"
                            aria-label="Wishlist"
                        >
                            <span style={{ fontSize: '15px' }}>❤️</span>
                            {wishlistCount > 0 && (
                                <span className="cart-badge wishlist-badge">
                                    {wishlistCount}
                                </span>
                            )}
                        </button>

                        {/* Desktop: User Profile / Login */}
                        {user ? (
                            <button 
                                className="header-profile-chip desktop-only-action"
                                onClick={onProfileOpen}
                                title={`View Profile (${user.name})`}
                                aria-label="View Customer Profile"
                            >
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="header-profile-avatar-mini" />
                                ) : (
                                    <div className="header-profile-avatar-fallback">
                                        {(user.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className="header-profile-name">{user.name?.split(' ')[0] || 'Profile'}</span>
                            </button>
                        ) : (
                            <button 
                                className="action-btn header-login-chip desktop-only-action" 
                                onClick={onLoginClick}
                                aria-label="Sign In / Register"
                                title="Sign In with Google or Phone"
                            >
                                <svg viewBox="0 0 24 24" className="icon" style={{ fill: '#ffffff', width: '18px', height: '18px' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                                <span className="login-text-label">Login</span>
                            </button>
                        )}

                        {/* Shopping Cart Button (Mobile & Desktop) */}
                        <button 
                            className="action-btn header-cart-chip" 
                            onClick={onCartOpen}
                            aria-label="View Cart"
                            title="View Shopping Cart"
                        >
                            <div className="cart-icon-wrapper" style={{ position: 'relative' }}>
                                <svg viewBox="0 0 24 24" className="icon" style={{ width: '20px', height: '20px' }}><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
                                <span className="cart-badge">{cartCount}</span>
                            </div>
                        </button>

                        {/* Mobile Menu Toggle Button (Visible on mobile only) */}
                        <button 
                            className="action-btn mobile-menu-btn" 
                            onClick={() => setMobileDrawerOpen(true)}
                            aria-label="Toggle Navigation Menu"
                            title="Menu"
                        >
                            <svg viewBox="0 0 24 24" className="icon" style={{ width: '22px', height: '22px' }}><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Search Input Overlay */}
                {mobileSearchVisible && (
                    <div style={{ padding: '8px 16px', background: '#090a0f', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="search-input-wrapper" style={{ width: '100%' }}>
                            <input 
                                type="text" 
                                placeholder="Search T-shirts, Shirts, Pants..." 
                                className="search-input" 
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                autoFocus
                            />
                            {searchQuery && (
                                <button className="clear-search-btn" onClick={() => onSearchChange('')}>
                                    &times;
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Mobile Navigation Drawer */}
            <div className={`mobile-nav-drawer ${mobileDrawerOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="/assets/logo.png" alt="NETRAVE" style={{ height: '24px' }} />
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>NETRAVE FASHION</h3>
                    </div>
                    <button className="close-btn" onClick={() => setMobileDrawerOpen(false)}>&times;</button>
                </div>
                
                {/* Mobile Drawer Search Bar */}
                <div className="drawer-search" style={{ marginBottom: '14px' }}>
                    <div className="search-input-wrapper">
                        <input 
                            type="text" 
                            placeholder="Search streetwear clothing..." 
                            className="search-input" 
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="clear-search-btn" onClick={() => onSearchChange('')}>
                                &times;
                            </button>
                        )}
                    </div>
                </div>

                <ul className="mobile-nav-links">
                    {/* 1. Home */}
                    <li>
                        <button className="mob-link" onClick={triggerHome}>
                            <svg viewBox="0 0 24 24" className="drawer-icon"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                            <span>Home</span>
                        </button>
                    </li>

                    {/* 2. Shop */}
                    <li>
                        <button className="mob-link" onClick={triggerShop}>
                            <svg viewBox="0 0 24 24" className="drawer-icon"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM9 4h6v2H9V4zm11 15H4V8h16v11z"/></svg>
                            <span>Shop All Collections</span>
                        </button>
                    </li>

                    {/* 3. Wishlist */}
                    <li>
                        <button className="mob-link" onClick={triggerWishlist}>
                            <span style={{ fontSize: '18px', marginRight: '10px' }}>❤️</span>
                            <span>My Wishlist ({wishlistCount})</span>
                        </button>
                    </li>

                    {/* 4. Categories (Accordion) */}
                    <li>
                        <button 
                            className={`mob-link ${categoriesExpanded ? 'expanded' : ''}`}
                            onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                        >
                            <svg viewBox="0 0 24 24" className="drawer-icon"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
                            <span>Categories</span>
                            <svg viewBox="0 0 24 24" className={`caret-icon ${categoriesExpanded ? 'rotated' : ''}`}>
                                <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
                            </svg>
                        </button>

                        {categoriesExpanded && (
                            <ul className="drawer-sub-links">
                                {categories.filter(c => c.id !== 'all').map(cat => (
                                    <li key={cat.id}>
                                        <button 
                                            className={`sub-mob-link ${activeCategory === cat.id && !activeTag ? 'active' : ''}`}
                                            onClick={() => handleCategoryClick(cat.id, true)}
                                        >
                                            {cat.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>

                    {/* 5. Modern New */}
                    <li>
                        <button className={`mob-link ${activeTag === 'New' ? 'active' : ''}`} onClick={triggerNewArrivals}>
                            <svg viewBox="0 0 24 24" className="drawer-icon"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                            <span>Modern New Arrivals</span>
                        </button>
                    </li>

                    {/* 6. Best Sellers */}
                    <li>
                        <button className="mob-link" onClick={triggerBestSellers}>
                            <svg viewBox="0 0 24 24" className="drawer-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>
                            <span>Best Sellers</span>
                        </button>
                    </li>

                    {/* 7. My Cart */}
                    <li>
                        <button className="mob-link" onClick={triggerCart}>
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}>
                                <svg viewBox="0 0 24 24" className="drawer-icon"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
                                <span>My Cart</span>
                                {cartCount > 0 && (
                                    <span className="drawer-cart-badge">{cartCount}</span>
                                )}
                            </div>
                        </button>
                    </li>

                    {/* 8. Track Order / Login */}
                    {!user ? (
                        <li>
                            <button className="mob-link" onClick={() => { setMobileDrawerOpen(false); onLoginClick(); }} style={{ color: 'var(--primary)' }}>
                                <svg viewBox="0 0 24 24" className="drawer-icon" style={{ fill: 'var(--primary)' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Login / Register</span>
                            </button>
                        </li>
                    ) : (
                        <>
                            <li>
                                <button className="mob-link" onClick={() => { if (onProfileOpen) onProfileOpen(); setMobileDrawerOpen(false); }}>
                                    <svg viewBox="0 0 24 24" className="drawer-icon" style={{ fill: 'var(--primary)' }}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                    <span>My Profile ({user.name})</span>
                                </button>
                            </li>
                            <li>
                                <button className="mob-link" onClick={triggerTrackOrder}>
                                    <svg viewBox="0 0 24 24" className="drawer-icon"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                                    <span>My Orders & Bookings</span>
                                </button>
                            </li>
                            <li>
                                <button className="mob-link" onClick={() => { onLogout(); setMobileDrawerOpen(false); }} style={{ color: 'var(--error)' }}>
                                    <svg viewBox="0 0 24 24" className="drawer-icon" style={{ fill: 'var(--error)' }}><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                                    <span style={{ color: 'var(--error)' }}>Logout</span>
                                </button>
                            </li>
                        </>
                    )}

                    {/* 9. Contact Us */}
                    <li>
                        <button className="mob-link" onClick={triggerContact}>
                            <svg viewBox="0 0 24 24" className="drawer-icon"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-.1z"/></svg>
                            <span>Contact Us</span>
                        </button>
                    </li>

                    <li className="drawer-divider-label">Follow & Support</li>

                    {/* 10. WhatsApp */}
                    <li>
                        <a href="https://wa.me/919946550713" target="_blank" rel="noopener noreferrer" className="mob-link social-drawer-link" onClick={() => setMobileDrawerOpen(false)}>
                            <span style={{ fontSize: '18px', marginRight: '10px' }}>💬</span>
                            <span>WhatsApp Support (+91 99465 50713)</span>
                        </a>
                    </li>
                </ul>
            </div>
            <div 
                className={`drawer-overlay ${mobileDrawerOpen ? 'show' : ''}`} 
                onClick={() => setMobileDrawerOpen(false)}
            />
        </>
    );
}
