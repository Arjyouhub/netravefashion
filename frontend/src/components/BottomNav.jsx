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
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z"/>
                    </svg>
                </div>
                <span className="bottom-nav-label">Home</span>
                {isHomeActive && <span className="bottom-nav-indicator" />}
            </button>

            <button 
                type="button" 
                className={`bottom-nav-item ${isCategoryActive ? 'active' : ''}`} 
                onClick={() => handleNav('category', { category: 'all' })}
                aria-label="Categories"
            >
                <div className="bottom-nav-icon-wrap">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                    </svg>
                </div>
                <span className="bottom-nav-label">Categories</span>
                {isCategoryActive && <span className="bottom-nav-indicator" />}
            </button>

            <button 
                type="button" 
                className={`bottom-nav-item ${isWishlistActive ? 'active' : ''}`} 
                onClick={() => handleNav('wishlist')}
                aria-label="Wishlist"
            >
                <div className="bottom-nav-icon-wrap">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {wishlistCount > 0 && <span className="bottom-nav-badge">{wishlistCount}</span>}
                </div>
                <span className="bottom-nav-label">Wishlist</span>
                {isWishlistActive && <span className="bottom-nav-indicator" />}
            </button>

            <button 
                type="button" 
                className={`bottom-nav-item ${isCartActive ? 'active' : ''}`} 
                onClick={() => handleNav('cart')}
                aria-label="Cart"
            >
                <div className="bottom-nav-icon-wrap">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="20" r="1.5"/>
                        <circle cx="19" cy="20" r="1.5"/>
                        <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 5H6"/>
                    </svg>
                    <span className="bottom-nav-badge yellow-badge">{cartCount}</span>
                </div>
                <span className="bottom-nav-label">Cart</span>
                {isCartActive && <span className="bottom-nav-indicator" />}
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
                <span className="bottom-nav-label">Account</span>
                {isAccountActive && <span className="bottom-nav-indicator" />}
            </button>
        </nav>
    );
}
