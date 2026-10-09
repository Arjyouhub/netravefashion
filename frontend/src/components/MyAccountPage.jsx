import React, { useState, useEffect } from 'react';

export default function MyAccountPage({
    user,
    bookings = [],
    cart = [],
    cartCount = 0,
    wishlist = [],
    onLogout,
    onNavigate,
    onUpdateUser,
    onOpenLogin,
    API_BASE_URL = 'http://localhost:5000/api',
    showToast
}) {
    const [currentUser, setCurrentUser] = useState(user || null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editWhatsapp, setEditWhatsapp] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editCity, setEditCity] = useState('');
    const [editPincode, setEditPincode] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState('');

    useEffect(() => {
        if (user) {
            setCurrentUser(user);
        } else {
            try {
                const saved = JSON.parse(localStorage.getItem('netrave_user'));
                if (saved) setCurrentUser(saved);
            } catch {}
        }
    }, [user]);

    const displayName = currentUser?.name || 'Customer';
    const displayPhone = currentUser?.phone || '';
    const displayEmail = currentUser?.email || '';

    // Initials helper
    const getInitials = (nameStr) => {
        if (!nameStr) return 'NC';
        const parts = nameStr.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return nameStr.slice(0, 2).toUpperCase();
    };

    // Open Edit Profile Modal
    const handleOpenEdit = () => {
        setEditName(currentUser?.name || '');
        setEditPhone(currentUser?.phone || '');
        setEditEmail(currentUser?.email || '');
        setEditWhatsapp(currentUser?.whatsapp || currentUser?.phone || '');
        setEditAddress(currentUser?.address || '');
        setEditCity(currentUser?.city || currentUser?.district || 'Ernakulam');
        setEditPincode(currentUser?.pincode || '');
        setEditError('');
        setIsEditModalOpen(true);
    };

    // Save profile details
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setEditError('');

        if (!editName.trim()) {
            setEditError('Please enter your full name');
            return;
        }

        setIsSaving(true);
        try {
            const updated = {
                ...(currentUser || {}),
                name: editName.trim(),
                phone: editPhone.trim(),
                email: editEmail.trim(),
                whatsapp: editWhatsapp.trim() || editPhone.trim(),
                address: editAddress.trim(),
                city: editCity.trim(),
                district: editCity.trim(),
                pincode: editPincode.trim(),
                isPhoneVerified: true
            };

            // Backend sync if user identifier exists
            if (currentUser && (currentUser.phone || currentUser.email || currentUser._id)) {
                try {
                    const currentIdentifier = currentUser.phone || currentUser.email || currentUser._id;
                    const res = await fetch(`${API_BASE_URL}/users/profile`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ currentIdentifier, ...updated })
                    });
                    const data = await res.json();
                    if (res.ok && data.user) {
                        Object.assign(updated, data.user);
                    }
                } catch (apiErr) {
                    console.warn('Backend update failed, saving locally:', apiErr);
                }
            }

            setCurrentUser(updated);
            localStorage.setItem('netrave_user', JSON.stringify(updated));
            if (onUpdateUser) onUpdateUser(updated);
            if (showToast) showToast('Profile details updated successfully!', 'success');
            setIsEditModalOpen(false);
        } catch (err) {
            console.error('Error saving profile:', err);
            setEditError('Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleNav = (page, params = {}) => {
        if (onNavigate) onNavigate(page, params);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleWhatsAppSupport = () => {
        window.open('https://wa.me/919946550713?text=Hi%20Netrave%20Support%2C%20I%20need%20assistance%20with%20my%20account%20or%20orders.', '_blank');
    };

    // If user is not logged in, show clean modern Guest entry point
    if (!currentUser) {
        return (
            <div className="netrave-account-page-wrapper">
                <div className="netrave-account-shell">
                    <div className="account-hub-guest-card">
                        <div className="account-hub-guest-icon">👤</div>
                        <h2 className="account-hub-guest-title">Welcome to Netrave</h2>
                        <p className="account-hub-guest-desc">Sign in to track orders, manage saved addresses, and view your personalized wishlist.</p>
                        <button
                            type="button"
                            className="netrave-btn-primary account-hub-login-btn"
                            onClick={() => (onOpenLogin ? onOpenLogin() : handleNav('login'))}
                        >
                            Sign In / Register
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const orderCount = Array.isArray(bookings) ? bookings.length : 0;
    const wishlistCount = Array.isArray(wishlist) ? wishlist.length : 0;

    return (
        <div className="netrave-account-page-wrapper">
            <div className="netrave-account-shell">
                {/* Desktop Breadcrumb */}
                <div className="account-hub-breadcrumb">
                    <button type="button" onClick={() => handleNav('home')}>Home</button>
                    <span>/</span>
                    <span className="current">My Account</span>
                </div>

                {/* 1. Modern Customer Profile Banner */}
                <div className="account-hub-profile-banner">
                    <div className="account-hub-profile-left">
                        <div className="account-hub-avatar" aria-label="Avatar Initials">
                            <span>{getInitials(displayName)}</span>
                        </div>
                        <div className="account-hub-profile-meta">
                            <div className="account-hub-name-row">
                                <h1 className="account-hub-name">{displayName}</h1>
                                <span className="account-hub-verified-pill">
                                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
                                        <circle cx="12" cy="12" r="10" fill="#16a34a"/>
                                        <path d="M7.5 12l3 3 6-6" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <span>Verified</span>
                                </span>
                            </div>
                            <div className="account-hub-contact-row">
                                {displayPhone && (
                                    <span className="account-hub-contact-item">
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                        </svg>
                                        <span>{displayPhone}</span>
                                    </span>
                                )}
                                {displayEmail && (
                                    <span className="account-hub-contact-item">
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                        <span>{displayEmail}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="account-hub-edit-btn"
                        onClick={handleOpenEdit}
                        aria-label="Edit Profile"
                    >
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>Edit Details</span>
                    </button>
                </div>

                {/* 2. Modern Account Navigation Grid */}
                <div className="account-hub-menu-section">
                    <h2 className="account-hub-section-heading">Account & Orders</h2>
                    <div className="account-hub-grid">
                        {/* 1. My Orders */}
                        <div
                            className="account-hub-card highlight-card"
                            onClick={() => handleNav('orders')}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="account-hub-card-icon-wrap icon-amber">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                    <line x1="12" y1="22.08" x2="12" y2="12" />
                                </svg>
                            </div>
                            <div className="account-hub-card-body">
                                <div className="account-hub-card-title-row">
                                    <h3 className="account-hub-card-title">My Orders</h3>
                                    {orderCount > 0 && (
                                        <span className="account-hub-badge-pill">{orderCount}</span>
                                    )}
                                </div>
                                <p className="account-hub-card-desc">View, track, return, and buy again</p>
                            </div>
                            <span className="account-hub-card-arrow">›</span>
                        </div>

                        {/* 2. Saved Addresses */}
                        <div
                            className="account-hub-card"
                            onClick={() => handleNav('addresses')}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="account-hub-card-icon-wrap icon-rose">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                            </div>
                            <div className="account-hub-card-body">
                                <h3 className="account-hub-card-title">Saved Addresses</h3>
                                <p className="account-hub-card-desc">Manage delivery locations & defaults</p>
                            </div>
                            <span className="account-hub-card-arrow">›</span>
                        </div>

                        {/* 3. Wishlist */}
                        <div
                            className="account-hub-card"
                            onClick={() => handleNav('wishlist')}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="account-hub-card-icon-wrap icon-indigo">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </div>
                            <div className="account-hub-card-body">
                                <div className="account-hub-card-title-row">
                                    <h3 className="account-hub-card-title">My Wishlist</h3>
                                    {wishlistCount > 0 && (
                                        <span className="account-hub-badge-pill">{wishlistCount}</span>
                                    )}
                                </div>
                                <p className="account-hub-card-desc">Your curated favorites & styles</p>
                            </div>
                            <span className="account-hub-card-arrow">›</span>
                        </div>

                        {/* 4. Track Order */}
                        <div
                            className="account-hub-card"
                            onClick={() => handleNav('tracking')}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="account-hub-card-icon-wrap icon-blue">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="1" y="3" width="15" height="13" />
                                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                    <circle cx="5.5" cy="18.5" r="2.5" />
                                    <circle cx="18.5" cy="18.5" r="2.5" />
                                </svg>
                            </div>
                            <div className="account-hub-card-body">
                                <h3 className="account-hub-card-title">Track Order</h3>
                                <p className="account-hub-card-desc">Live status & shipment tracking</p>
                            </div>
                            <span className="account-hub-card-arrow">›</span>
                        </div>

                        {/* 5. Help & WhatsApp Support */}
                        <div
                            className="account-hub-card"
                            onClick={handleWhatsAppSupport}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="account-hub-card-icon-wrap icon-emerald">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.27-2.42 5.82-1.56 1.55-3.63 2.41-5.83 2.41-1.43 0-2.83-.38-4.06-1.11l-.29-.17-3.02.79.81-2.94-.19-.3A8.188 8.188 0 0 1 3.8 11.91c0-4.54 3.7-8.24 8.25-8.24m4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.78.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z"/>
                                </svg>
                            </div>
                            <div className="account-hub-card-body">
                                <h3 className="account-hub-card-title">24×7 WhatsApp Support</h3>
                                <p className="account-hub-card-desc">Need assistance? Chat directly with us</p>
                            </div>
                            <span className="account-hub-card-arrow">›</span>
                        </div>

                        {/* 6. Log Out */}
                        <div
                            className="account-hub-card logout-card"
                            onClick={() => {
                                if (onLogout) onLogout();
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="account-hub-card-icon-wrap icon-red">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </div>
                            <div className="account-hub-card-body">
                                <h3 className="account-hub-card-title text-danger">Sign Out</h3>
                                <p className="account-hub-card-desc">Log out of your Netrave account</p>
                            </div>
                            <span className="account-hub-card-arrow">›</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="netrave-modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
                    <div
                        className="netrave-modal-card profile-edit-modal-box"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="modal-card-header">
                            <div>
                                <h3 className="modal-title">Edit Profile</h3>
                                <p className="modal-subtitle">Update your personal contact details</p>
                            </div>
                            <button
                                type="button"
                                className="modal-close-icon-btn"
                                onClick={() => setIsEditModalOpen(false)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {editError && (
                            <div className="modal-alert-error">{editError}</div>
                        )}

                        <form onSubmit={handleSaveProfile} className="profile-edit-modal-form">
                            <div className="form-grid-2col">
                                <div className="form-field-unit">
                                    <label htmlFor="edit-name">Full Name *</label>
                                    <input
                                        id="edit-name"
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="e.g. Arjun K K"
                                        required
                                    />
                                </div>

                                <div className="form-field-unit">
                                    <label htmlFor="edit-phone">Mobile Number</label>
                                    <input
                                        id="edit-phone"
                                        type="tel"
                                        value={editPhone}
                                        onChange={(e) => setEditPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                                        placeholder="+91 9876543210"
                                    />
                                </div>
                            </div>

                            <div className="form-grid-2col">
                                <div className="form-field-unit">
                                    <label htmlFor="edit-email">Email Address</label>
                                    <input
                                        id="edit-email"
                                        type="email"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        placeholder="customer@netrave.in"
                                    />
                                </div>

                                <div className="form-field-unit">
                                    <label htmlFor="edit-city">City / District</label>
                                    <input
                                        id="edit-city"
                                        type="text"
                                        value={editCity}
                                        onChange={(e) => setEditCity(e.target.value)}
                                        placeholder="e.g. Kozhikode"
                                    />
                                </div>
                            </div>

                            <div className="form-field-unit">
                                <label htmlFor="edit-address">Street / Door No / Landmark</label>
                                <textarea
                                    id="edit-address"
                                    rows="2"
                                    value={editAddress}
                                    onChange={(e) => setEditAddress(e.target.value)}
                                    placeholder="Enter your street address"
                                />
                            </div>

                            <div className="form-field-unit">
                                <label htmlFor="edit-pincode">Pincode</label>
                                <input
                                    id="edit-pincode"
                                    type="text"
                                    maxLength="6"
                                    value={editPincode}
                                    onChange={(e) => setEditPincode(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="673525"
                                />
                            </div>

                            <div className="modal-actions-row">
                                <button
                                    type="button"
                                    className="netrave-btn-secondary"
                                    onClick={() => setIsEditModalOpen(false)}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="netrave-btn-primary"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
