import React, { useState } from 'react';

export default function Header({
    cartCount,
    onCartOpen,
    onBookingsOpen,
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
    onLoginClick
}) {
    const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
    const [localDrawerOpen, setLocalDrawerOpen] = useState(false);
    const [categoriesExpanded, setCategoriesExpanded] = useState(false);

    const mobileDrawerOpen = propMobileDrawerOpen !== undefined ? propMobileDrawerOpen : localDrawerOpen;
    const setMobileDrawerOpen = propSetMobileDrawerOpen !== undefined ? propSetMobileDrawerOpen : setLocalDrawerOpen;

    const categories = [
        { id: 'all', label: 'All Items' },
        { id: 'summer-t-shirt', label: 'Summer T-Shirts' },
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
        onBookingsOpen();
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
                    {/* Mobile Menu Toggle */}
                    <button 
                        className="mobile-menu-btn" 
                        onClick={() => setMobileDrawerOpen(true)}
                        aria-label="Toggle Navigation Menu"
                    >
                        <svg viewBox="0 0 24 24" className="icon"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
                    </button>

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

                        <button 
                            className="action-btn mobile-search-trigger" 
                            onClick={() => setMobileSearchVisible(!mobileSearchVisible)}
                            aria-label="Search Toggle"
                        >
                            <svg viewBox="0 0 24 24" className="icon"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                        </button>

                        <button 
                            className="action-btn mobile-bookings-trigger" 
                            onClick={user ? onBookingsOpen : onLoginClick}
                            aria-label="View Booking History"
                            title={user ? `Logged in as ${user.name} - View Bookings` : "Track Order / Sign In"}
                        >
                            {user ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <svg viewBox="0 0 24 24" className="icon" style={{ fill: 'var(--primary)' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                                    <span className="desktop-search-header" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>My Orders</span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <svg viewBox="0 0 24 24" className="icon" style={{ fill: '#ffffff' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                                    <span className="desktop-search-header" style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>Login</span>
                                </div>
                            )}
                        </button>

                        {user && (
                            <button 
                                className="action-btn text-action desktop-search-header" 
                                onClick={onLogout}
                                title="Sign Out"
                                style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', height: '36px' }}
                            >
                                Logout
                            </button>
                        )}

                        <button 
                            className="action-btn" 
                            onClick={onCartOpen}
                            aria-label="View Cart"
                        >
                            <div className="cart-icon-wrapper">
                                <svg viewBox="0 0 24 24" className="icon"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
                                <span className="cart-badge">{cartCount}</span>
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            <div className={`mobile-nav-drawer ${mobileDrawerOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <h3>NETRAVE MENU</h3>
                    <button className="close-btn" onClick={() => setMobileDrawerOpen(false)}>&times;</button>
                </div>
                
                {/* Mobile Drawer Search Bar */}
                <div className="drawer-search" style={{ marginBottom: '20px' }}>
                    <div className="search-input-wrapper">
                        <input 
                            type="text" 
                            placeholder="Search clothing..." 
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
                            <span>Shop All</span>
                        </button>
                    </li>

                    {/* 3. Categories (Accordion) */}
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

                    {/* 4. Modern New */}
                    <li>
                        <button className={`mob-link ${activeTag === 'New' ? 'active' : ''}`} onClick={triggerNewArrivals}>
                            <svg viewBox="0 0 24 24" className="drawer-icon"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                            <span>Modern New</span>
                        </button>
                    </li>

                    {/* 5. Best Sellers */}
                    <li>
                        <button className="mob-link" onClick={triggerBestSellers}>
                            <svg viewBox="0 0 24 24" className="drawer-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>
                            <span>Best Sellers</span>
                        </button>
                    </li>

                    {/* 6. My Cart */}
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

                    {/* 7. Track Order */}
                    <li>
                        <button className="mob-link" onClick={() => { if (user) { triggerTrackOrder(); } else { setMobileDrawerOpen(false); onLoginClick(); } }}>
                            <svg viewBox="0 0 24 24" className="drawer-icon"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                            <span>{user ? `My Orders (${user.name})` : 'Track Order'}</span>
                        </button>
                    </li>

                    {user && (
                        <li>
                            <button className="mob-link" onClick={() => { onLogout(); setMobileDrawerOpen(false); }} style={{ color: 'var(--error)' }}>
                                <svg viewBox="0 0 24 24" className="drawer-icon" style={{ fill: 'var(--error)' }}><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                                <span style={{ color: 'var(--error)' }}>Logout</span>
                            </button>
                        </li>
                    )}

                    {/* 8. Contact Us */}
                    <li>
                        <button className="mob-link" onClick={triggerContact}>
                            <svg viewBox="0 0 24 24" className="drawer-icon"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-.1z"/></svg>
                            <span>Contact Us</span>
                        </button>
                    </li>

                    <li className="drawer-divider-label">Follow & Support</li>

                    {/* 9. Instagram */}
                    <li>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="mob-link social-drawer-link" onClick={() => setMobileDrawerOpen(false)}>
                            <svg viewBox="0 0 24 24" className="drawer-icon"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                            <span>Instagram</span>
                        </a>
                    </li>

                    {/* 10. WhatsApp */}
                    <li>
                        <a href="https://wa.me/919946550713" target="_blank" rel="noopener noreferrer" className="mob-link social-drawer-link" onClick={() => setMobileDrawerOpen(false)}>
                            <svg viewBox="0 0 24 24" className="drawer-icon"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.248 8.477 3.517 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.453 5.461 0 9.903-4.44 9.907-9.902.002-2.646-1.02-5.133-2.873-6.988C16.591 1.862 14.103.839 11.45.839c-5.463 0-9.904 4.44-9.908 9.9.001 2.072.547 4.093 1.59 5.891L2.162 21.8l5.588-1.464-.103-.182zM17.06 14.382c-.272-.136-1.61-.794-1.86-.885-.25-.092-.432-.136-.613.136-.18.273-.704.885-.863 1.067-.159.182-.318.204-.59.068-.272-.136-1.15-.424-2.19-1.353-.81-.722-1.357-1.615-1.516-1.888-.159-.272-.017-.42.12-.556.122-.123.272-.318.408-.477.136-.159.182-.272.272-.454.09-.182.046-.341-.023-.477-.068-.136-.613-1.477-.84-2.022-.222-.533-.487-.463-.66-.463-.17 0-.363-.01-.556-.01-.193 0-.51.072-.777.363-.267.292-1.02 1.002-1.02 2.445 0 1.442 1.049 2.836 1.196 3.033.147.197 2.062 3.148 4.996 4.413.698.302 1.243.482 1.668.617.7.223 1.338.192 1.843.117.562-.083 1.61-.659 1.838-1.295.228-.636.228-1.182.159-1.295-.068-.114-.25-.205-.523-.341z"/></svg>
                            <span>WhatsApp Support</span>
                        </a>
                    </li>

                    {/* 11. Facebook */}
                    <li>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="mob-link social-drawer-link" onClick={() => setMobileDrawerOpen(false)}>
                            <svg viewBox="0 0 24 24" className="drawer-icon"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            <span>Facebook</span>
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
