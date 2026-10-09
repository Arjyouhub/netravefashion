import React, { useState, useEffect, useRef } from 'react';

export default function MyAccountPage({
    user,
    bookings = [],
    cart = [],
    cartCount = 0,
    wishlist = [],
    onLogout,
    onNavigate,
    onAddToCart,
    onUpdateUser,
    onOpenLogin,
    API_BASE_URL = 'http://localhost:5000/api',
    showToast,
    initialTab = 'profile'
}) {
    // Current user state
    const [currentUser, setCurrentUser] = useState(user || null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);

    // Active filter: 'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
    const [statusFilter, setStatusFilter] = useState('all');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Profile editing modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editWhatsapp, setEditWhatsapp] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editCity, setEditCity] = useState('');
    const [editPincode, setEditPincode] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [editError, setEditError] = useState('');

    // Saved payments modal state
    const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);

    // Sync user prop
    useEffect(() => {
        if (user) {
            setCurrentUser(user);
        } else {
            // Check localStorage or cookie fallback
            try {
                const saved = JSON.parse(localStorage.getItem('netrave_user'));
                if (saved) setCurrentUser(saved);
            } catch {}
        }
    }, [user]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Derived User Info
    const displayName = currentUser?.name || 'Arjun K K';
    const displayPhone = currentUser?.phone || '+91 9876543210';
    const displayEmail = currentUser?.email || 'customer@netrave.in';
    const isPhoneVerified = currentUser?.isPhoneVerified !== false; // Default verified in mockup

    // Derive avatar initials (e.g. "Arjun K K" -> "AK")
    const getInitials = (nameStr) => {
        if (!nameStr) return 'AK';
        const parts = nameStr.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return nameStr.slice(0, 2).toUpperCase();
    };
    const avatarInitials = getInitials(displayName);

    // Live Cart Items Count
    const liveCartCount = cartCount || (Array.isArray(cart) ? cart.reduce((s, i) => s + (i.quantity || 1), 0) : 0) || (() => {
        try {
            const saved = JSON.parse(localStorage.getItem('netrave_cart'));
            return Array.isArray(saved) ? saved.reduce((s, i) => s + (i.quantity || 1), 0) : 0;
        } catch {
            return 0;
        }
    })();

    // Default City / Location from addresses
    const defaultCity = (() => {
        try {
            const addrs = JSON.parse(localStorage.getItem('netrave_addresses'));
            if (Array.isArray(addrs) && addrs.length > 0) {
                const def = addrs.find(a => a.isDefault) || addrs[0];
                return def.city || def.district || 'Ernakulam';
            }
        } catch {}
        return currentUser?.district || currentUser?.city || 'Ernakulam';
    })();

    // Status classifier for real bookings
    const getStatusCategory = (rawStatus = '') => {
        const s = (rawStatus || '').toLowerCase().trim();
        if (s.includes('deliver')) return 'delivered';
        if (s.includes('ship') || s.includes('out for delivery') || s.includes('dispatch')) return 'shipped';
        if (s.includes('process')) return 'processing';
        if (s.includes('confirm')) return 'confirmed';
        if (s.includes('cancel')) return 'cancelled';
        if (s.includes('return')) return 'returned';
        if (s.includes('pend')) return 'pending';
        return 'pending';
    };

    // Filter bookings belonging to this customer
    const userOrders = (bookings || []).filter(b => {
        if (!b) return false;
        if (currentUser?.phone && (b.customer?.phone === currentUser.phone || b.customer?.whatsapp === currentUser.phone)) return true;
        if (currentUser?.email && b.customer?.email === currentUser.email) return true;
        return true;
    });

    // Real dynamic counts
    const allCount = userOrders.length;
    const pendingCount = userOrders.filter(b => getStatusCategory(b.status) === 'pending').length;
    const confirmedCount = userOrders.filter(b => getStatusCategory(b.status) === 'confirmed').length;
    const processingCount = userOrders.filter(b => getStatusCategory(b.status) === 'processing').length;
    const shippedCount = userOrders.filter(b => getStatusCategory(b.status) === 'shipped').length;
    const deliveredCount = userOrders.filter(b => getStatusCategory(b.status) === 'delivered').length;
    const cancelledCount = userOrders.filter(b => getStatusCategory(b.status) === 'cancelled').length;

    // Filtered orders according to active filter
    const displayedOrders = userOrders.filter(b => {
        if (statusFilter === 'all') return true;
        return getStatusCategory(b.status) === statusFilter;
    });

    // Filter pills list
    const filterTabs = [
        { key: 'all', label: 'All', fullLabel: 'All Orders', count: allCount },
        { key: 'pending', label: 'Pending', fullLabel: 'Pending', count: pendingCount },
        { key: 'confirmed', label: 'Confirmed', fullLabel: 'Confirmed', count: confirmedCount },
        { key: 'processing', label: 'Processing', fullLabel: 'Processing', count: processingCount },
        { key: 'shipped', label: 'Shipped', fullLabel: 'Shipped', count: shippedCount },
        { key: 'delivered', label: 'Delivered', fullLabel: 'Delivered', count: deliveredCount },
        { key: 'cancelled', label: 'Cancelled', fullLabel: 'Cancelled', count: cancelledCount }
    ];

    const currentTabObj = filterTabs.find(t => t.key === statusFilter) || filterTabs[0];

    // Open Edit Profile modal with prefilled data
    const handleOpenEditModal = () => {
        setEditName(displayName);
        setEditPhone(currentUser?.phone || '');
        setEditEmail(currentUser?.email || '');
        setEditWhatsapp(currentUser?.whatsapp || currentUser?.phone || '');
        setEditAddress(currentUser?.address || '');
        setEditCity(currentUser?.city || currentUser?.district || 'Ernakulam');
        setEditPincode(currentUser?.pincode || '');
        setEditError('');
        setIsEditModalOpen(true);
    };

    // Save profile changes
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setEditError('');

        if (!editName.trim()) {
            setEditError('Please enter your full name');
            return;
        }

        setIsSavingProfile(true);
        try {
            const updatedData = {
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

            // Call backend API if user has an identifier
            if (currentUser && (currentUser.phone || currentUser.email || currentUser._id)) {
                try {
                    const currentIdentifier = currentUser.phone || currentUser.email || currentUser._id;
                    const res = await fetch(`${API_BASE_URL}/users/profile`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            currentIdentifier,
                            ...updatedData
                        })
                    });
                    const data = await res.json();
                    if (res.ok && data.user) {
                        Object.assign(updatedData, data.user);
                    }
                } catch (apiErr) {
                    console.warn('Backend update failed, saving locally:', apiErr);
                }
            }

            setCurrentUser(updatedData);
            localStorage.setItem('netrave_user', JSON.stringify(updatedData));
            if (onUpdateUser) onUpdateUser(updatedData);
            if (showToast) showToast('Profile details updated successfully!', 'success');
            setIsEditModalOpen(false);
        } catch (err) {
            console.error('Error saving profile:', err);
            setEditError('Failed to save profile changes. Please try again.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Navigate helper
    const handleNavigation = (page, params = {}) => {
        if (onNavigate) {
            onNavigate(page, params);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Help Center action
    const handleHelpClick = () => {
        window.open('https://wa.me/919946550713?text=Hi%20Netrave%20Support%2C%20I%20need%20assistance%20with%20my%20account%20or%20orders.', '_blank');
    };

    // Retry loader
    const handleRetry = () => {
        setIsLoading(true);
        setLoadError(null);
        setTimeout(() => {
            setIsLoading(false);
        }, 400);
    };

    // Loading skeleton state
    if (isLoading) {
        return (
            <div className="netrave-account-page-wrapper">
                <div className="netrave-account-shell">
                    <div className="account-skeleton-dashboard">
                        <div className="account-skeleton-sidebar" />
                        <div className="account-skeleton-main">
                            <div className="account-skeleton-card card-lg" />
                            <div className="account-skeleton-grid" />
                            <div className="account-skeleton-card card-xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (loadError) {
        return (
            <div className="netrave-account-page-wrapper">
                <div className="netrave-account-shell">
                    <div className="account-error-container">
                        <div className="account-error-icon">⚠️</div>
                        <h2 className="account-error-title">Unable to load account details.</h2>
                        <p className="account-error-desc">Please verify your internet connection or try refreshing the dashboard.</p>
                        <button type="button" className="netrave-btn-primary" onClick={handleRetry}>
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="netrave-account-page-wrapper">
            <div className="netrave-account-shell">
                {/* ========================================================
                    DESKTOP 2-COLUMN DASHBOARD LAYOUT (1024px+)
                    ======================================================== */}
                <div className="account-dashboard-grid">
                    {/* LEFT SIDEBAR (Desktop only) */}
                    <aside className="account-left-sidebar" aria-label="Account Navigation">
                        <nav className="account-sidebar-menu">
                            <button
                                type="button"
                                className="sidebar-menu-btn active"
                                onClick={() => handleNavigation('account')}
                            >
                                <span className="sidebar-menu-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </span>
                                <span className="sidebar-menu-text">My Account</span>
                            </button>

                            <button
                                type="button"
                                className="sidebar-menu-btn"
                                onClick={() => handleNavigation('orders')}
                            >
                                <span className="sidebar-menu-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                        <line x1="12" y1="22.08" x2="12" y2="12" />
                                    </svg>
                                </span>
                                <span className="sidebar-menu-text">My Orders</span>
                            </button>

                            <button
                                type="button"
                                className="sidebar-menu-btn"
                                onClick={() => handleNavigation('cart')}
                            >
                                <span className="sidebar-menu-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="9" cy="21" r="1" />
                                        <circle cx="20" cy="21" r="1" />
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                    </svg>
                                </span>
                                <span className="sidebar-menu-text">My Cart</span>
                                {liveCartCount > 0 && (
                                    <span className="sidebar-menu-badge">{liveCartCount}</span>
                                )}
                            </button>

                            <button
                                type="button"
                                className="sidebar-menu-btn"
                                onClick={() => handleNavigation('addresses')}
                            >
                                <span className="sidebar-menu-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                </span>
                                <span className="sidebar-menu-text">Addresses</span>
                            </button>

                            <button
                                type="button"
                                className="sidebar-menu-btn"
                                onClick={() => handleNavigation('wishlist')}
                            >
                                <span className="sidebar-menu-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </span>
                                <span className="sidebar-menu-text">Wishlist</span>
                                {wishlist.length > 0 && (
                                    <span className="sidebar-menu-badge-subtle">{wishlist.length}</span>
                                )}
                            </button>

                            <button
                                type="button"
                                className="sidebar-menu-btn"
                                onClick={() => setIsPaymentsModalOpen(true)}
                            >
                                <span className="sidebar-menu-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                        <line x1="1" y1="10" x2="23" y2="10" />
                                    </svg>
                                </span>
                                <span className="sidebar-menu-text">Saved Payments</span>
                            </button>

                            <button
                                type="button"
                                className="sidebar-menu-btn"
                                onClick={handleOpenEditModal}
                            >
                                <span className="sidebar-menu-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </span>
                                <span className="sidebar-menu-text">Profile Settings</span>
                            </button>

                            <button
                                type="button"
                                className="sidebar-menu-btn"
                                onClick={() => handleNavigation('forgot-password')}
                            >
                                <span className="sidebar-menu-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <span className="sidebar-menu-text">Change Password</span>
                            </button>

                            <button
                                type="button"
                                className="sidebar-menu-btn"
                                onClick={handleHelpClick}
                            >
                                <span className="sidebar-menu-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                </span>
                                <span className="sidebar-menu-text">Help Center</span>
                            </button>

                            <div className="sidebar-menu-separator" />

                            <button
                                type="button"
                                className="sidebar-menu-btn logout-action-btn"
                                onClick={onLogout}
                            >
                                <span className="sidebar-menu-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                </span>
                                <span className="sidebar-menu-text">Logout</span>
                            </button>
                        </nav>
                    </aside>

                    {/* RIGHT MAIN CONTENT AREA */}
                    <main className="account-main-content">
                        {/* 1. Page Header Title */}
                        <div className="account-heading-header">
                            <h1 className="account-main-title">My Account</h1>
                            <p className="account-main-subtitle">Manage your orders, addresses, and account details</p>
                        </div>

                        {/* 2. Profile Card */}
                        <div 
                            className="account-profile-card"
                            onClick={() => {
                                if (window.innerWidth <= 767) {
                                    handleOpenEditModal();
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="profile-card-left">
                                <div className="profile-avatar-circle" aria-label="Avatar Initials">
                                    <span>{avatarInitials}</span>
                                </div>
                                <div className="profile-info-block">
                                    <div className="profile-name-row">
                                        <h2 className="profile-user-name">{displayName}</h2>
                                        {isPhoneVerified && (
                                            <span className="profile-verified-badge">
                                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                                                    <circle cx="12" cy="12" r="10" fill="#16a34a"/>
                                                    <path d="M7.5 12l3 3 6-6" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                <span>Phone Verified</span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="profile-meta-row">
                                        <div className="profile-meta-item">
                                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                            </svg>
                                            <span>{displayPhone}</span>
                                        </div>
                                        <div className="profile-meta-item">
                                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                <polyline points="22,6 12,13 2,6" />
                                            </svg>
                                            <span>{displayEmail}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="profile-edit-trigger-btn desktop-only-flex"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditModal();
                                }}
                            >
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                                <span>Edit Profile</span>
                            </button>

                            <span className="profile-card-chevron-mobile mobile-only-inline" aria-hidden="true">›</span>
                        </div>

                        {/* 3. Quick Account Cards (4 Cards: 4 in row on Desktop, 2x2 grid on Mobile) */}
                        <div className="account-quick-cards-grid">
                            {/* Card 1: My Orders */}
                            <div 
                                className="quick-account-card highlight-orders"
                                onClick={() => handleNavigation('orders')}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="quick-card-icon-box bg-yellow-soft">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                        <line x1="12" y1="22.08" x2="12" y2="12" />
                                    </svg>
                                </div>
                                <div className="quick-card-content">
                                    <h3 className="quick-card-title">My Orders</h3>
                                    <p className="quick-card-subtitle">{allCount} Total • {deliveredCount} Delivered</p>
                                </div>
                                <span className="quick-card-arrow">›</span>
                            </div>

                            {/* Card 2: My Cart */}
                            <div 
                                className="quick-account-card"
                                onClick={() => handleNavigation('cart')}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="quick-card-icon-box bg-gray-soft">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="9" cy="20" r="1.5" />
                                        <circle cx="19" cy="20" r="1.5" />
                                        <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 5H6" />
                                    </svg>
                                </div>
                                <div className="quick-card-content">
                                    <h3 className="quick-card-title">My Cart</h3>
                                    <p className="quick-card-subtitle">{liveCartCount} Items</p>
                                </div>
                                <span className="quick-card-arrow">›</span>
                            </div>

                            {/* Card 3: Addresses */}
                            <div 
                                className="quick-account-card"
                                onClick={() => handleNavigation('addresses')}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="quick-card-icon-box bg-red-soft">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="#ef4444">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
                                    </svg>
                                </div>
                                <div className="quick-card-content">
                                    <h3 className="quick-card-title">Addresses</h3>
                                    <p className="quick-card-subtitle">{defaultCity}</p>
                                </div>
                                <span className="quick-card-arrow">›</span>
                            </div>

                            {/* Card 4: Help Center */}
                            <div 
                                className="quick-account-card"
                                onClick={handleHelpClick}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="quick-card-icon-box bg-green-soft">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="#25D366">
                                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.27-2.42 5.82-1.56 1.55-3.63 2.41-5.83 2.41-1.43 0-2.83-.38-4.06-1.11l-.29-.17-3.02.79.81-2.94-.19-.3A8.188 8.188 0 0 1 3.8 11.91c0-4.54 3.7-8.24 8.25-8.24m4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.78.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z"/>
                                    </svg>
                                </div>
                                <div className="quick-card-content">
                                    <h3 className="quick-card-title">Help Center</h3>
                                    <p className="quick-card-subtitle">24×7 WhatsApp</p>
                                </div>
                                <span className="quick-card-arrow">›</span>
                            </div>
                        </div>

                        {/* 4. Orders & Delivered Status Section */}
                        <div className="account-orders-status-card">
                            {/* Section Header */}
                            <div className="orders-status-card-header">
                                <div className="orders-status-header-left">
                                    <div className="orders-header-icon-box desktop-only-flex">
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                            <line x1="12" y1="22.08" x2="12" y2="12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="orders-status-title">Orders & Delivered Status</h3>
                                        <p className="orders-status-subtitle">View and track all your orders</p>
                                    </div>
                                </div>

                                {/* Custom Dropdown Filter */}
                                <div className="orders-filter-dropdown-container" ref={dropdownRef}>
                                    <button
                                        type="button"
                                        className="orders-filter-dropdown-btn"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        aria-haspopup="true"
                                        aria-expanded={isDropdownOpen}
                                    >
                                        <span className="dropdown-box-icon desktop-only-inline">📦</span>
                                        <span className="dropdown-label-text">
                                            {currentTabObj.fullLabel || currentTabObj.label} ({currentTabObj.count})
                                        </span>
                                        <span className={`dropdown-chevron ${isDropdownOpen ? 'open' : ''}`}>⌄</span>
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="orders-filter-dropdown-menu">
                                            {filterTabs.map(tab => (
                                                <button
                                                    key={tab.key}
                                                    type="button"
                                                    className={`dropdown-menu-item ${statusFilter === tab.key ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setStatusFilter(tab.key);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                >
                                                    <span>{tab.fullLabel || tab.label}</span>
                                                    <span className="dropdown-item-count">({tab.count})</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status Filter Chips Row */}
                            <div className="orders-filter-chips-row">
                                {filterTabs.map(tab => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        className={`filter-chip-pill ${statusFilter === tab.key ? 'active' : ''}`}
                                        onClick={() => setStatusFilter(tab.key)}
                                    >
                                        {tab.label} ({tab.count})
                                    </button>
                                ))}
                            </div>

                            {/* Orders Content Area */}
                            <div className="orders-status-content-body">
                                {displayedOrders.length === 0 ? (
                                    /* Empty Order State matching screenshot */
                                    <div className="account-empty-orders-view">
                                        {/* Cute Shopping Bags Illustration */}
                                        <div className="empty-bags-art-container" aria-hidden="true">
                                            <svg viewBox="0 0 160 140" width="140" height="120" fill="none">
                                                {/* Yellow dynamic rays/sparks */}
                                                <line x1="32" y1="46" x2="22" y2="40" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                                                <line x1="30" y1="58" x2="18" y2="60" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                                                <line x1="128" y1="46" x2="138" y2="40" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                                                <line x1="130" y1="58" x2="142" y2="60" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                                                
                                                {/* Ground shadow */}
                                                <ellipse cx="80" cy="124" rx="55" ry="8" fill="#e2e8f0" opacity="0.6" />

                                                {/* Dark Navy/Charcoal Shopping Bag (Left) */}
                                                <path d="M48 60L42 118H78L84 60H48Z" fill="#1e293b" />
                                                <path d="M42 118L48 60L54 52H78L84 60L78 118H42Z" fill="#0f172a" opacity="0.9" />
                                                {/* Dark Bag Handle */}
                                                <path d="M56 60V48C56 42.48 60.48 38 66 38C71.52 38 76 42.48 76 48V60" stroke="#334155" strokeWidth="4" strokeLinecap="round" />

                                                {/* Golden Netrave Yellow Shopping Bag (Right) */}
                                                <path d="M74 68L68 122H112L118 68H74Z" fill="#f59e0b" />
                                                <path d="M74 68L80 58H106L112 68L106 122H68L74 68Z" fill="#fbbf24" />
                                                {/* Yellow Bag Handle */}
                                                <path d="M84 66V54C84 49.58 87.58 46 92 46C96.42 46 100 49.58 100 54V66" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" />
                                            </svg>
                                        </div>

                                        <h4 className="empty-orders-title">No orders found</h4>
                                        <p className="empty-orders-desc">When you book clothing, your delivered orders will appear here.</p>

                                        <button
                                            type="button"
                                            className="empty-continue-shopping-btn"
                                            onClick={() => handleNavigation('home')}
                                        >
                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                                                <line x1="3" y1="6" x2="21" y2="6"/>
                                                <path d="M16 10a4 4 0 0 1-8 0"/>
                                            </svg>
                                            <span>Continue Shopping</span>
                                            <span className="continue-shopping-arrow">→</span>
                                        </button>
                                    </div>
                                ) : (
                                    /* Populated Orders List */
                                    <div className="account-orders-list-stack">
                                        {displayedOrders.map((order, idx) => {
                                            const orderId = order.orderId || order._id || `NTR${1000 + idx}`;
                                            const status = order.status || 'Delivered';
                                            const statusCat = getStatusCategory(status);
                                            const firstItem = order.items?.[0] || order;
                                            const imgUrl = firstItem.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400';
                                            const title = firstItem.title || 'Streetwear Oversized Fit';
                                            const date = order.date || order.createdAt ? new Date(order.createdAt || order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '20 Sep 2026';
                                            const amount = order.totalAmount || order.price || 1999;
                                            const totalQty = Array.isArray(order.items) ? order.items.reduce((s, i) => s + (i.quantity || 1), 0) : 1;

                                            return (
                                                <div key={orderId} className="account-order-row-card">
                                                    <div className="order-row-thumb-box">
                                                        <img src={imgUrl} alt={title} className="order-row-thumb-img" />
                                                    </div>

                                                    <div className="order-row-details">
                                                        <div className="order-row-meta-top">
                                                            <span className="order-id-badge">#{orderId}</span>
                                                            <span className="order-date-text">Placed on {date}</span>
                                                        </div>
                                                        <h4 className="order-product-title">{title}</h4>
                                                        <p className="order-qty-price-meta">
                                                            Qty: {totalQty} • <strong className="order-price-highlight">₹{amount.toLocaleString()}</strong>
                                                        </p>
                                                    </div>

                                                    <div className="order-row-status-box">
                                                        <span className={`order-status-pill status-${statusCat}`}>
                                                            <span className="status-dot-indicator" />
                                                            <span>{status}</span>
                                                        </span>
                                                    </div>

                                                    <div className="order-row-actions-group">
                                                        <button
                                                            type="button"
                                                            className="order-action-btn track-btn"
                                                            onClick={() => handleNavigation('tracking', { query: orderId })}
                                                        >
                                                            Track Order
                                                        </button>
                                                        {onAddToCart && (
                                                            <button
                                                                type="button"
                                                                className="order-action-btn buy-again-btn"
                                                                onClick={() => {
                                                                    onAddToCart(firstItem, firstItem.size || 'M', 1);
                                                                    if (showToast) showToast('Added to cart!', 'success');
                                                                }}
                                                            >
                                                                Buy Again
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* ========================================================
                EDIT PROFILE MODAL
                ======================================================== */}
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
                                <p className="modal-subtitle">Update your personal and delivery details</p>
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
                                        placeholder="e.g. Ernakulam / Kozhikode"
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
                                    placeholder="Enter your complete street address"
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
                                    disabled={isSavingProfile}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="netrave-btn-primary"
                                    disabled={isSavingProfile}
                                >
                                    {isSavingProfile ? 'Saving Changes...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================
                SAVED PAYMENTS MODAL
                ======================================================== */}
            {isPaymentsModalOpen && (
                <div className="netrave-modal-backdrop" onClick={() => setIsPaymentsModalOpen(false)}>
                    <div 
                        className="netrave-modal-card" 
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="modal-card-header">
                            <div>
                                <h3 className="modal-title">Saved Payment Methods</h3>
                                <p className="modal-subtitle">Fast & secure one-click checkout enabled</p>
                            </div>
                            <button 
                                type="button" 
                                className="modal-close-icon-btn" 
                                onClick={() => setIsPaymentsModalOpen(false)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="saved-payments-body">
                            <div className="payment-method-item">
                                <div className="payment-icon-pill">UPI</div>
                                <div className="payment-info">
                                    <strong className="payment-name">Google Pay / PhonePe UPI</strong>
                                    <span className="payment-sub">{displayPhone.replace(/[^0-9]/g, '')}@okaxis</span>
                                </div>
                                <span className="payment-verified-tag">✓ Verified</span>
                            </div>

                            <div className="payment-method-item">
                                <div className="payment-icon-pill">CARD</div>
                                <div className="payment-info">
                                    <strong className="payment-name">HDFC Bank Debit Card</strong>
                                    <span className="payment-sub">•••• •••• •••• 4092 (Exp 08/29)</span>
                                </div>
                                <span className="payment-verified-tag">✓ Verified</span>
                            </div>

                            <div className="payment-method-item">
                                <div className="payment-icon-pill">COD</div>
                                <div className="payment-info">
                                    <strong className="payment-name">Cash On Delivery</strong>
                                    <span className="payment-sub">Available across Kerala</span>
                                </div>
                                <span className="payment-verified-tag">Active</span>
                            </div>
                        </div>

                        <div className="modal-actions-row">
                            <button
                                type="button"
                                className="netrave-btn-primary"
                                style={{ width: '100%' }}
                                onClick={() => setIsPaymentsModalOpen(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
