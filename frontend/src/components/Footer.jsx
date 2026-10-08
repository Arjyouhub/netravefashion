import React from 'react';

export default function Footer({ onNavigate, categories = [] }) {
    const handleNav = (page, params = {}) => {
        if (onNavigate) {
            onNavigate(page, params);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="netrave-main-footer">
            <div className="footer-top-container">
                {/* Brand Column */}
                <div className="footer-col footer-col-brand">
                    <div className="footer-brand-logo" onClick={() => handleNav('home')} style={{ cursor: 'pointer' }}>
                        <img 
                            src="/assets/logo.png" 
                            alt="NETRAVE Logo" 
                            className="footer-logo-img" 
                        />
                        <div className="footer-logo-text">
                            <div className="footer-logo-title">
                                <span className="logo-net">NET</span>
                                <span className="logo-rave" style={{ color: 'var(--primary, #f59e0b)' }}>RAVE</span>
                            </div>
                            <span className="footer-logo-sub" style={{ color: 'var(--primary, #f59e0b)' }}>
                                CLOTHING & STYLE
                            </span>
                        </div>
                    </div>
                    <p className="footer-brand-desc">
                        Your one-stop destination for trendy fashion, watches, footwear and accessories. Quality products at unbeatable prices.
                    </p>
                    <div className="footer-social-links">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-social-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                            </svg>
                        </a>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="footer-social-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </a>
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="footer-social-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="footer-social-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>
                        <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" aria-label="Pinterest" className="footer-social-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Column: Quick Links */}
                <div className="footer-col">
                    <h4 className="footer-heading">Quick Links</h4>
                    <ul className="footer-links-list">
                        <li><button type="button" onClick={() => handleNav('home')}>Home</button></li>
                        <li><button type="button" onClick={() => handleNav('category', { category: 'all' })}>Shop All</button></li>
                        <li><button type="button" onClick={() => handleNav('category')}>Categories</button></li>
                        <li><button type="button" onClick={() => handleNav('offers')}>Offers & Deals</button></li>
                        <li><button type="button" onClick={() => handleNav('tracking')}>Track Order</button></li>
                    </ul>
                </div>

                {/* Column: Customer Care */}
                <div className="footer-col">
                    <h4 className="footer-heading">Customer Care</h4>
                    <ul className="footer-links-list">
                        <li><button type="button" onClick={() => handleNav('account', { tab: 'support' })}>Contact Us</button></li>
                        <li><button type="button" onClick={() => handleNav('account', { tab: 'support' })}>FAQ</button></li>
                        <li><button type="button" onClick={() => handleNav('account', { tab: 'support' })}>Returns & Refunds</button></li>
                        <li><button type="button" onClick={() => handleNav('account', { tab: 'support' })}>Shipping Policy</button></li>
                        <li><button type="button" onClick={() => handleNav('account', { tab: 'support' })}>Terms & Conditions</button></li>
                    </ul>
                </div>

                {/* Column: My Account */}
                <div className="footer-col">
                    <h4 className="footer-heading">My Account</h4>
                    <ul className="footer-links-list">
                        <li><button type="button" onClick={() => handleNav('orders')}>My Orders</button></li>
                        <li><button type="button" onClick={() => handleNav('wishlist')}>Wishlist</button></li>
                        <li><button type="button" onClick={() => handleNav('account', { tab: 'profile' })}>Profile</button></li>
                        <li><button type="button" onClick={() => handleNav('addresses')}>Addresses</button></li>
                        <li><button type="button" onClick={() => handleNav('cart')}>My Cart</button></li>
                    </ul>
                </div>

                {/* Column: Download App */}
                <div className="footer-col footer-col-app">
                    <h4 className="footer-heading">Download App</h4>
                    <p className="footer-app-desc">Get the Netrave App for a faster shopping experience & exclusive perks.</p>
                    <div className="footer-app-buttons">
                        <a href="#" className="app-badge-btn" onClick={(e) => e.preventDefault()}>
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
                                <path d="M3.609 1.814L13.792 12 3.61 22.186a2.08 2.08 0 0 1-.22-.964V2.778c0-.361.08-.696.219-.964zm11.238 11.241l2.482-2.483-11.89-6.75 9.408 9.233zm0 1.89l-9.408 9.233 11.89-6.75-2.482-2.483zm1.488-1.488l3.056 1.737c.883.502.883 1.324 0 1.826l-3.056 1.737-2.072-2.072 2.072-3.228z"/>
                            </svg>
                            <div className="app-badge-text">
                                <span className="app-badge-sub">GET IT ON</span>
                                <span className="app-badge-main">Google Play</span>
                            </div>
                        </a>
                        <a href="#" className="app-badge-btn" onClick={(e) => e.preventDefault()}>
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-.93.04-2.05.62-2.71 1.39-.58.67-1.08 1.76-.95 2.81 1.03.08 2.09-.5 2.72-1.27z"/>
                            </svg>
                            <div className="app-badge-text">
                                <span className="app-badge-sub">Download on the</span>
                                <span className="app-badge-main">App Store</span>
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="footer-bottom-bar">
                <div className="footer-bottom-inner">
                    <p className="footer-copyright">
                        &copy; 2026 <strong style={{ color: 'var(--primary, #f59e0b)' }}>Netrave</strong>. All rights reserved.
                    </p>
                    <div className="footer-payment-methods">
                        <span className="payment-pill">VISA</span>
                        <span className="payment-pill mastercard">Mastercard</span>
                        <span className="payment-pill">RuPay</span>
                        <span className="payment-pill upi">UPI</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
