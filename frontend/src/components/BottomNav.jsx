import React from 'react';

export default function BottomNav({
    currentPage = 'home',
    cartCount = 0,
    wishlistCount = 0,
    user,
    onNavigate,
    onLoginClick
}) {
    const isCartActive = currentPage === 'cart';
    const isWishlistActive = currentPage === 'wishlist';
    const isHomeActive = currentPage === 'home';
    const isCategoryActive = currentPage === 'category';
    const isAccountActive = currentPage === 'account' || currentPage === 'orders' || currentPage === 'addresses' || currentPage === 'login' || currentPage === 'signup';

    const handleNav = (page, params = {}) => {
        if (onNavigate) {
            onNavigate(page, params);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <nav className="netrave-bottom-nav">
            <button 
                type="button" 
                className={`bottom-nav-item ${isHomeActive ? 'active' : ''}`} 
                onClick={() => handleNav('home')}
                aria-label="Home"
            >
                <div className="bottom-nav-icon-wrap">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                    </svg>
                </div>
                <span className="bottom-nav-label">Home</span>
            </button>

            <button 
                type="button" 
                className={`bottom-nav-item ${isCategoryActive ? 'active' : ''}`} 
                onClick={() => handleNav('category', { category: 'all' })}
                aria-label="Categories"
            >
                <div className="bottom-nav-icon-wrap">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M4 11h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1zm1-6h4v4H5V5zm9-2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-6zm5 6h-4V5h4v4zM4 21h6a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1zm1-6h4v4H5v-4zm9 6h6a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1zm1-6h4v4h-4v-4z"/>
                    </svg>
                </div>
                <span className="bottom-nav-label">Categories</span>
            </button>

            <button 
                type="button" 
                className={`bottom-nav-item ${isWishlistActive ? 'active' : ''}`} 
                onClick={() => handleNav('wishlist')}
                aria-label="Wishlist"
            >
                <div className="bottom-nav-icon-wrap">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    {wishlistCount > 0 && <span className="bottom-nav-badge">{wishlistCount}</span>}
                </div>
                <span className="bottom-nav-label">Wishlist</span>
            </button>

            <button 
                type="button" 
                className={`bottom-nav-item ${isCartActive ? 'active' : ''}`} 
                onClick={() => handleNav('cart')}
                aria-label="Cart"
            >
                <div className="bottom-nav-icon-wrap">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                    <span className="bottom-nav-badge yellow-badge">{cartCount}</span>
                </div>
                <span className="bottom-nav-label">Cart</span>
            </button>

            <button 
                type="button" 
                className={`bottom-nav-item ${isAccountActive ? 'active' : ''}`} 
                onClick={() => {
                    if (user) handleNav('account');
                    else if (onLoginClick) onLoginClick();
                    else handleNav('login');
                }}
                aria-label="Account"
            >
                <div className="bottom-nav-icon-wrap">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                </div>
                <span className="bottom-nav-label">{user ? 'Account' : 'Account'}</span>
            </button>
        </nav>
    );
}
