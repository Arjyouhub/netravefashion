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
    const [activeSidebarTab, setActiveSidebarTab] = useState(initialTab || 'profile');

    const handleSaveProfile = (e) => {
        e.preventDefault();
        setIsEditing(false);
    };

    // Calculate live statistics
    const totalOrdersCount = bookings.length > 0 ? bookings.length : 3;
    const activeOrdersCount = bookings.filter(b => (b.status || '').toLowerCase().includes('shipped') || (b.status || '').toLowerCase().includes('active')).length || 1;
    const deliveredCount = bookings.filter(b => (b.status || '').toLowerCase().includes('deliver')).length || 2;
    const wishlistCount = wishlist.length > 0 ? wishlist.length : 4;

    const sampleRecentOrders = [
        {
            id: 'NTR124456',
            title: 'Nike Running Shoes',
            date: '20 Sep 2026',
            amount: 2999,
            status: 'Delivered',
            statusType: 'delivered',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80'
        },
        {
            id: 'NTR126001',
            title: 'Analog Watch',
            date: '20 Sep 2026',
            amount: 1999,
            status: 'Shipped',
            statusType: 'shipped',
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80'
        }
    ];

    const displayOrders = bookings.length > 0 ? bookings.slice(0, 3).map((b, i) => ({
        id: b.orderId || `NTR124${456 + i}`,
        title: b.items?.[0]?.title || 'Streetwear Fashion Item',
        date: b.date || '20 Sep 2026',
        amount: b.totalAmount || 2999,
        status: b.status || (i === 0 ? 'Delivered' : 'Shipped'),
        statusType: (b.status || '').toLowerCase().includes('deliver') ? 'delivered' : 'shipped',
        image: b.items?.[0]?.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'
    })) : sampleRecentOrders;

    return (
        <div className="netrave-page-wrapper my-account-screen">
            <div className="netrave-container account-container-responsive">
                {/* Desktop Breadcrumb */}
                <div className="netrave-desktop-breadcrumb">
                    <button type="button" onClick={() => onNavigate && onNavigate('home')}>Home</button>
                    <span>/</span>
                    <span className="current">My Account</span>
                </div>

                {/* DESKTOP LAYOUT (Sidebar ~260px + Main Dashboard) */}
                <div className="account-desktop-dashboard-layout">
                    {/* LEFT SIDEBAR (Desktop) */}
                    <aside className="account-desktop-sidebar">
                        <div className="account-sidebar-user-card">
                            <div className="sidebar-avatar-circle">
                                <span>{profileName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="sidebar-user-meta">
                                <h3 className="sidebar-user-name">{profileName}</h3>
                                <p className="sidebar-user-email">{profileEmail}</p>
                                <span className="sidebar-member-badge">⚡ VIP Member</span>
                            </div>
                        </div>

                        <nav className="account-sidebar-nav">
                            <button
                                type="button"
                                className={`sidebar-nav-item ${activeSidebarTab === 'profile' ? 'active' : ''}`}
                                onClick={() => setActiveSidebarTab('profile')}
                            >
                                <span className="nav-icon">👤</span>
                                <span>Profile Dashboard</span>
                            </button>

                            <button
                                type="button"
                                className="sidebar-nav-item"
                                onClick={() => onNavigate && onNavigate('orders')}
                            >
                                <span className="nav-icon">📦</span>
                                <span>My Orders</span>
                                <span className="nav-badge-pill">{totalOrdersCount}</span>
                            </button>

                            <button
                                type="button"
                                className="sidebar-nav-item"
                                onClick={() => onNavigate && onNavigate('wishlist')}
                            >
                                <span className="nav-icon">♡</span>
                                <span>Wishlist</span>
                                <span className="nav-badge-pill">{wishlistCount}</span>
                            </button>

                            <button
                                type="button"
                                className="sidebar-nav-item"
                                onClick={() => onNavigate && onNavigate('addresses')}
                            >
                                <span className="nav-icon">📍</span>
                                <span>Addresses</span>
                            </button>

                            <button
                                type="button"
                                className="sidebar-nav-item"
                                onClick={() => alert('Saved Payments: UPI (Google Pay, PhonePe), VISA card ending 4092')}
                            >
                                <span className="nav-icon">💳</span>
                                <span>Saved Payments</span>
                            </button>

                            <button
                                type="button"
                                className="sidebar-nav-item"
                                onClick={() => { setActiveSidebarTab('profile'); setIsEditing(true); }}
                            >
                                <span className="nav-icon">⚙️</span>
                                <span>Profile Settings</span>
                            </button>

                            <button
                                type="button"
                                className="sidebar-nav-item"
                                onClick={() => onNavigate && onNavigate('forgot-password')}
                            >
                                <span className="nav-icon">🔒</span>
                                <span>Change Password</span>
                            </button>

                            <button
                                type="button"
                                className="sidebar-nav-item"
                                onClick={() => alert('No new notifications')}
                            >
                                <span className="nav-icon">🔔</span>
                                <span>Notifications</span>
                            </button>

                            <button
                                type="button"
                                className="sidebar-nav-item"
                                onClick={() => window.open('https://wa.me/919946550713', '_blank')}
                            >
                                <span className="nav-icon">❓</span>
                                <span>Help & Support</span>
                            </button>

                            <div className="sidebar-divider" />

                            <button
                                type="button"
                                className="sidebar-nav-item nav-item-logout"
                                onClick={onLogout}
                            >
                                <span className="nav-icon">🚪</span>
                                <span>Logout</span>
                            </button>
                        </nav>
                    </aside>

                    {/* RIGHT MAIN CONTENT (Desktop Dashboard) */}
                    <main className="account-desktop-main-content">
                        {/* Welcome Banner */}
                        <div className="account-welcome-banner">
                            <div className="welcome-text-block">
                                <h1 className="welcome-heading">Welcome back, {profileName}!</h1>
                                <p className="welcome-subtext">Manage your orders, profile details, and shipping addresses from your account dashboard.</p>
                            </div>
                            <button
                                type="button"
                                className="btn-secondary-outline-sm"
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                {isEditing ? 'Cancel Edit' : 'Edit Profile ✎'}
                            </button>
                        </div>

                        {/* Inline Profile Edit Form (if editing) */}
                        {isEditing && (
                            <div className="account-profile-edit-box">
                                <h3 className="section-title-sm">Update Profile Information</h3>
                                <form className="account-form-2col" onSubmit={handleSaveProfile}>
                                    <div className="form-group-field">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            value={profileName}
                                            onChange={(e) => setProfileName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group-field">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            value={profileEmail}
                                            onChange={(e) => setProfileEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group-field">
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            value={profilePhone}
                                            onChange={(e) => setProfilePhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group-field" style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                                        <button type="submit" className="btn-primary-yellow" style={{ height: '42px', padding: '0 24px' }}>
                                            Save Changes
                                        </button>
                                        <button type="button" className="btn-secondary" style={{ height: '42px', padding: '0 20px' }} onClick={() => setIsEditing(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Order Statistics KPI Cards (4-column grid on desktop) */}
                        <div className="account-kpi-grid">
                            <div className="account-kpi-card" onClick={() => onNavigate && onNavigate('orders')}>
                                <div className="kpi-icon-wrap bg-amber">📦</div>
                                <div className="kpi-info">
                                    <span className="kpi-num">{totalOrdersCount}</span>
                                    <span className="kpi-label">Total Orders</span>
                                </div>
                            </div>

                            <div className="account-kpi-card" onClick={() => onNavigate && onNavigate('orders')}>
                                <div className="kpi-icon-wrap bg-blue">🚚</div>
                                <div className="kpi-info">
                                    <span className="kpi-num">{activeOrdersCount}</span>
                                    <span className="kpi-label">Active Orders</span>
                                </div>
                            </div>

                            <div className="account-kpi-card" onClick={() => onNavigate && onNavigate('orders')}>
                                <div className="kpi-icon-wrap bg-green">✅</div>
                                <div className="kpi-info">
                                    <span className="kpi-num">{deliveredCount}</span>
                                    <span className="kpi-label">Delivered</span>
                                </div>
                            </div>

                            <div className="account-kpi-card" onClick={() => onNavigate && onNavigate('wishlist')}>
                                <div className="kpi-icon-wrap bg-rose">♡</div>
                                <div className="kpi-info">
                                    <span className="kpi-num">{wishlistCount}</span>
                                    <span className="kpi-label">Wishlist Items</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Orders Section */}
                        <div className="account-section-card">
                            <div className="account-section-header">
                                <div>
                                    <h2 className="account-section-title">Recent Orders</h2>
                                    <p className="account-section-sub">Track your active shipments and view past purchases</p>
                                </div>
                                <button
                                    type="button"
                                    className="link-view-all"
                                    onClick={() => onNavigate && onNavigate('orders')}
                                >
                                    View All Orders →
                                </button>
                            </div>

                            <div className="account-recent-orders-list">
                                {displayOrders.map(order => (
                                    <div key={order.id} className="desktop-recent-order-row">
                                        <img src={order.image} alt={order.title} className="recent-order-thumb" />
                                        <div className="recent-order-info">
                                            <h4 className="recent-order-title">{order.title}</h4>
                                            <span className="recent-order-meta">Order #{order.id} • Placed on {order.date}</span>
                                        </div>
                                        <div className="recent-order-price">
                                            <span>₹{order.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="recent-order-status">
                                            <span className={`order-status-badge badge-${order.statusType}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="recent-order-action">
                                            <button
                                                type="button"
                                                className="btn-secondary-outline-sm"
                                                onClick={() => onNavigate && onNavigate('tracking', { query: order.id })}
                                            >
                                                Track Order
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Profile Summary & Quick Details Card */}
                        <div className="account-section-card">
                            <h2 className="account-section-title">Personal Information & Security</h2>
                            <div className="account-details-grid-2col">
                                <div className="profile-detail-field">
                                    <span className="detail-label">Full Name</span>
                                    <strong className="detail-val">{profileName}</strong>
                                </div>
                                <div className="profile-detail-field">
                                    <span className="detail-label">Email Address</span>
                                    <strong className="detail-val">{profileEmail}</strong>
                                </div>
                                <div className="profile-detail-field">
                                    <span className="detail-label">Phone Number</span>
                                    <strong className="detail-val">{profilePhone}</strong>
                                </div>
                                <div className="profile-detail-field">
                                    <span className="detail-label">Default Shipping</span>
                                    <strong className="detail-val">Door No 4B, Emerald Green, Kozhikode</strong>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>

                {/* MOBILE ONLY VIEW (Preserved from Screen 12 for screens < 768px) */}
                <div className="account-mobile-view-wrap">
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
                                <span className="menu-label">Profile Settings</span>
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
        </div>
    );
}
