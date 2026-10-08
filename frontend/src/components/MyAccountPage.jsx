import React, { useState } from 'react';

export default function MyAccountPage({
    user,
    bookings = [],
    wishlist = [],
    onLogout,
    onNavigate,
    initialTab = 'profile'
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [profileName, setProfileName] = useState(user?.name || 'Arjun K K');
    const [profileEmail, setProfileEmail] = useState(user?.email || 'arjun@email.com');
    const [profilePhone, setProfilePhone] = useState(user?.phone || '+91 98765 43210');

    const handleSaveProfile = (e) => {
        e.preventDefault();
        setIsEditing(false);
    };

    return (
        <div className="netrave-page-wrapper my-account-screen">
            <div className="netrave-container account-container-narrow">
                {/* Top Profile Card Matching Screen 12 */}
                <div className="mobile-profile-card">
                    <div className="profile-card-avatar">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="#111111">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                    </div>
                    <div className="profile-card-details">
                        <h3 className="profile-card-name">{profileName}</h3>
                        <p className="profile-card-email">{profileEmail}</p>
                    </div>
                    <button 
                        type="button" 
                        className="profile-card-edit-btn"
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                </div>

                {isEditing && (
                    <form className="profile-edit-inline-form" onSubmit={handleSaveProfile}>
                        <div className="form-group-sm">
                            <label>Full Name</label>
                            <input 
                                type="text" 
                                value={profileName} 
                                onChange={(e) => setProfileName(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="form-group-sm">
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                value={profileEmail} 
                                onChange={(e) => setProfileEmail(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="form-group-sm">
                            <label>Phone Number</label>
                            <input 
                                type="tel" 
                                value={profilePhone} 
                                onChange={(e) => setProfilePhone(e.target.value)} 
                                required 
                            />
                        </div>
                        <button type="submit" className="btn-primary-yellow" style={{ width: '100%', marginTop: '8px' }}>
                            Save Profile
                        </button>
                    </form>
                )}

                {/* Account Navigation Menu List Matching Screen 12 */}
                <div className="account-menu-list-card">
                    <button 
                        type="button" 
                        className="account-menu-row"
                        onClick={() => onNavigate && onNavigate('orders')}
                    >
                        <div className="menu-row-left">
                            <span className="menu-icon">📦</span>
                            <span className="menu-label">My Orders</span>
                        </div>
                        <span className="menu-chevron">›</span>
                    </button>

                    <button 
                        type="button" 
                        className="account-menu-row"
                        onClick={() => onNavigate && onNavigate('wishlist')}
                    >
                        <div className="menu-row-left">
                            <span className="menu-icon">♡</span>
                            <span className="menu-label">Wishlist</span>
                        </div>
                        <span className="menu-chevron">›</span>
                    </button>

                    <button 
                        type="button" 
                        className="account-menu-row"
                        onClick={() => onNavigate && onNavigate('addresses')}
                    >
                        <div className="menu-row-left">
                            <span className="menu-icon">📍</span>
                            <span className="menu-label">Addresses</span>
                        </div>
                        <span className="menu-chevron">›</span>
                    </button>

                    <button 
                        type="button" 
                        className="account-menu-row"
                        onClick={() => alert('Saved payments: UPI (Google Pay, PhonePe), VISA card ending 4092')}
                    >
                        <div className="menu-row-left">
                            <span className="menu-icon">💳</span>
                            <span className="menu-label">Saved Payments</span>
                        </div>
                        <span className="menu-chevron">›</span>
                    </button>

                    <button 
                        type="button" 
                        className="account-menu-row"
                        onClick={() => setIsEditing(true)}
                    >
                        <div className="menu-row-left">
                            <span className="menu-icon">👤</span>
                            <span className="menu-label">Profile</span>
                        </div>
                        <span className="menu-chevron">›</span>
                    </button>

                    <button 
                        type="button" 
                        className="account-menu-row"
                        onClick={() => onNavigate && onNavigate('forgot-password')}
                    >
                        <div className="menu-row-left">
                            <span className="menu-icon">🔒</span>
                            <span className="menu-label">Change Password</span>
                        </div>
                        <span className="menu-chevron">›</span>
                    </button>

                    <button 
                        type="button" 
                        className="account-menu-row"
                        onClick={() => alert('No new notifications')}
                    >
                        <div className="menu-row-left">
                            <span className="menu-icon">🔔</span>
                            <span className="menu-label">Notifications</span>
                        </div>
                        <span className="menu-chevron">›</span>
                    </button>

                    <button 
                        type="button" 
                        className="account-menu-row"
                        onClick={() => window.open('https://wa.me/919946550713', '_blank')}
                    >
                        <div className="menu-row-left">
                            <span className="menu-icon">❓</span>
                            <span className="menu-label">Help & Support</span>
                        </div>
                        <span className="menu-chevron">›</span>
                    </button>

                    <button 
                        type="button" 
                        className="account-menu-row logout-row"
                        onClick={onLogout}
                    >
                        <div className="menu-row-left">
                            <span className="menu-icon">🚪</span>
                            <span className="menu-label">Logout</span>
                        </div>
                        <span className="menu-chevron">›</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
