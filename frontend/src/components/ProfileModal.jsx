import React, { useState, useEffect } from 'react';

const KERALA_DISTRICTS = [
    'Alappuzha',
    'Ernakulam',
    'Idukki',
    'Kannur',
    'Kasaragod',
    'Kollam',
    'Kottayam',
    'Kozhikode',
    'Malappuram',
    'Palakkad',
    'Pathanamthitta',
    'Thiruvananthapuram',
    'Thrissur',
    'Wayanad',
    'Other District / State'
];

export default function ProfileModal({
    isOpen,
    onClose,
    user,
    bookings = [],
    cartItems = [],
    cartCount = 0,
    onOpenCart,
    whatsappNumber,
    onUpdateUser,
    onViewOrders,
    onLogout,
    API_BASE_URL,
    showToast
}) {
    const [activeTab, setActiveTab] = useState('orders'); // default to 'orders' or 'profile'
    const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'delivered' | 'active'

    // Profile form states
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [address, setAddress] = useState('');
    const [district, setDistrict] = useState('Ernakulam');
    const [pincode, setPincode] = useState('');
    const [sameAsPhone, setSameAsPhone] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user && isOpen) {
            setName(user.name || '');
            setPhone(user.phone || '');
            setEmail(user.email || '');
            setWhatsapp(user.whatsapp || user.phone || '');
            setAddress(user.address || '');
            setDistrict(user.district || 'Ernakulam');
            setPincode(user.pincode || '');
            setSameAsPhone(user.whatsapp === user.phone && Boolean(user.phone));
            setError('');
        }
    }, [user, isOpen]);

    if (!isOpen || !user) return null;

    // Filter orders belonging to this user
    const userBookings = (bookings || []).filter(b => {
        if (!b) return false;
        if (user.phone && (b.customer?.phone === user.phone || b.customer?.whatsapp === user.phone)) return true;
        if (user.email && b.customer?.email === user.email) return true;
        return true; // If bookings were already fetched for this user in App.jsx
    });

    const deliveredOrders = userBookings.filter(b => b.status?.toLowerCase() === 'delivered');
    const activeOrders = userBookings.filter(b => b.status?.toLowerCase() !== 'delivered' && b.status?.toLowerCase() !== 'cancelled');

    const displayedOrders = userBookings.filter(b => {
        if (orderFilter === 'delivered') return b.status?.toLowerCase() === 'delivered';
        if (orderFilter === 'active') return b.status?.toLowerCase() !== 'delivered' && b.status?.toLowerCase() !== 'cancelled';
        return true;
    });

    const handlePhoneChange = (val) => {
        const cleaned = val.replace(/[^0-9]/g, '');
        if (cleaned.length <= 10) {
            setPhone(cleaned);
            if (sameAsPhone) setWhatsapp(cleaned);
        }
    };

    const handleWhatsappChange = (val) => {
        const cleaned = val.replace(/[^0-9]/g, '');
        if (cleaned.length <= 10) setWhatsapp(cleaned);
    };

    const handleSameAsPhoneToggle = (checked) => {
        setSameAsPhone(checked);
        if (checked) setWhatsapp(phone);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Please enter your full name.');
            return;
        }

        if (phone && phone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }

        if (pincode && pincode.length !== 6) {
            setError('Pincode must be exactly 6 digits.');
            return;
        }

        setLoading(true);
        try {
            const currentIdentifier = user.phone || user.email || user.googleId;
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentIdentifier,
                    name: name.trim(),
                    phone: phone.trim(),
                    email: email.trim(),
                    whatsapp: whatsapp.trim() || phone.trim(),
                    address: address.trim(),
                    district,
                    pincode: pincode.trim()
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                if (onUpdateUser) {
                    onUpdateUser(data.user);
                }
                if (showToast) {
                    showToast('Profile and delivery details saved successfully!', 'success');
                }
            } else {
                setError(data.error || 'Failed to update profile.');
            }
        } catch (err) {
            console.error('Update profile network error:', err);
            setError('Network error saving profile details.');
        } finally {
            setLoading(false);
        }
    };

    // User Avatar initials
    const userInitials = (user.name || 'U')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const isProfileIncomplete = !user.phone || !user.address;

    const generateWhatsAppSupport = (order) => {
        const textTemplate = `👋 *Hi Netrave Support*,\nI am checking on my Order *#${order.orderId}*.\n\n*Status:* ${order.status}\n*Total:* ₹${order.total}\n*Date:* ${order.date}`;
        const targetNumber = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, '') : '919946550713';
        return `https://wa.me/${targetNumber}?text=${encodeURIComponent(textTemplate)}`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content profile-modal-content" onClick={e => e.stopPropagation()}>
                {/* Header Profile Summary */}
                <div className="profile-modal-header">
                    <div className="profile-user-summary">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="profile-avatar-img" />
                        ) : (
                            <div className="profile-avatar-circle">
                                {userInitials}
                            </div>
                        )}
                        <div className="profile-user-info">
                            <div className="profile-user-name-row">
                                <h3 className="profile-user-name">{user.name}</h3>
                                <span className={`profile-badge ${user.authProvider === 'google' ? 'google-badge' : 'phone-badge'}`}>
                                    {user.authProvider === 'google' ? '🌐 Google Verified' : '📱 Phone Verified'}
                                </span>
                            </div>
                            <p className="profile-user-meta">
                                {user.phone && <span className="profile-meta-item">📞 +91 {user.phone}</span>}
                                {user.email && <span className="profile-meta-item">✉️ {user.email}</span>}
                            </p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose} aria-label="Close Profile">&times;</button>
                </div>

                {/* Flipkart-Style 4 Quick Action Cards */}
                <div className="flipkart-profile-grid">
                    <div 
                        className={`flipkart-card ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        <div className="flipkart-card-icon">📦</div>
                        <div className="flipkart-card-info">
                            <span className="flipkart-card-title">My Orders</span>
                            <span className="flipkart-card-subtitle">{userBookings.length} Total • {deliveredOrders.length} Delivered</span>
                        </div>
                    </div>

                    <div 
                        className={`flipkart-card ${activeTab === 'cart' ? 'active' : ''}`}
                        onClick={() => {
                            if (onOpenCart) onOpenCart();
                            else setActiveTab('cart');
                        }}
                    >
                        <div className="flipkart-card-icon">🛒</div>
                        <div className="flipkart-card-info">
                            <span className="flipkart-card-title">My Cart</span>
                            <span className="flipkart-card-subtitle">{cartCount > 0 ? `${cartCount} Items` : '0 Items'}</span>
                        </div>
                    </div>

                    <div 
                        className={`flipkart-card ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <div className="flipkart-card-icon">📍</div>
                        <div className="flipkart-card-info">
                            <span className="flipkart-card-title">Addresses</span>
                            <span className="flipkart-card-subtitle">{district || 'Edit Details'}</span>
                        </div>
                    </div>

                    <a 
                        href={`https://wa.me/${(whatsappNumber || '919946550713').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi Netrave Customer Support, I need help with my account/orders.')}`}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flipkart-card flipkart-help-card"
                    >
                        <div className="flipkart-card-icon">💬</div>
                        <div className="flipkart-card-info">
                            <span className="flipkart-card-title">Help Center</span>
                            <span className="flipkart-card-subtitle">24x7 WhatsApp</span>
                        </div>
                    </a>
                </div>

                {/* Profile Navigation Tabs */}
                <div className="profile-tabs-header">
                    <button 
                        type="button" 
                        className={`profile-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        <span>📦 Orders & Delivered ({userBookings.length})</span>
                        {deliveredOrders.length > 0 && (
                            <span className="profile-tab-count-badge">{deliveredOrders.length} Delivered</span>
                        )}
                    </button>
                    <button 
                        type="button" 
                        className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <span>📍 Details & Address</span>
                    </button>
                    <button 
                        type="button" 
                        className={`profile-tab-btn ${activeTab === 'cart' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cart')}
                    >
                        <span>🛒 My Cart ({cartCount})</span>
                    </button>
                </div>

                {/* TAB 1: Profile & Delivery Address */}
                {activeTab === 'profile' && (
                    <div>
                        {/* Profile Incomplete Banner */}
                        {isProfileIncomplete && (
                            <div className="profile-notice-banner">
                                <span className="profile-notice-icon">💡</span>
                                <div className="profile-notice-text">
                                    <strong>Complete your delivery profile:</strong> Add your mobile number & address below for 1-click WhatsApp order confirmation and delivery tracking.
                                </div>
                            </div>
                        )}

                        {/* Error Banner */}
                        {error && (
                            <div className="profile-error-banner">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Profile Edit Form */}
                        <form onSubmit={handleSave} className="profile-edit-form">
                            <div className="profile-form-section-title">Personal & Contact Info</div>

                            <div className="profile-form-row">
                                <div className="profile-form-group">
                                    <label>Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Your full name"
                                        className="profile-input"
                                    />
                                </div>
                                <div className="profile-form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="name@domain.com"
                                        className="profile-input"
                                        disabled={user.authProvider === 'google' && Boolean(user.email)}
                                    />
                                </div>
                            </div>

                            <div className="profile-form-row">
                                <div className="profile-form-group">
                                    <label>10-Digit Mobile Number *</label>
                                    <div className="phone-input-wrap">
                                        <span className="prefix">+91</span>
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={e => handlePhoneChange(e.target.value)}
                                            placeholder="e.g. 9876543210"
                                            className="profile-input phone-inp"
                                        />
                                    </div>
                                </div>

                                <div className="profile-form-group">
                                    <div className="whatsapp-label-row">
                                        <label>WhatsApp Number</label>
                                        <label className="same-as-phone-check">
                                            <input
                                                type="checkbox"
                                                checked={sameAsPhone}
                                                onChange={e => handleSameAsPhoneToggle(e.target.checked)}
                                            />
                                            <span>Same as mobile</span>
                                        </label>
                                    </div>
                                    <div className="phone-input-wrap">
                                        <span className="prefix">+91</span>
                                        <input
                                            type="tel"
                                            value={whatsapp}
                                            onChange={e => handleWhatsappChange(e.target.value)}
                                            placeholder="e.g. 9876543210"
                                            disabled={sameAsPhone}
                                            className="profile-input phone-inp"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="profile-form-section-title" style={{ marginTop: '16px' }}>Default Delivery Address</div>

                            <div className="profile-form-group">
                                <label>House / Flat No., Street, Landmark</label>
                                <textarea
                                    rows="2"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="e.g. Flat 3B, Olive Heights, MG Road, near Metro station"
                                    className="profile-input profile-textarea"
                                />
                            </div>

                            <div className="profile-form-row">
                                <div className="profile-form-group">
                                    <label>District</label>
                                    <select
                                        value={district}
                                        onChange={e => setDistrict(e.target.value)}
                                        className="profile-input profile-select"
                                    >
                                        {KERALA_DISTRICTS.map(dist => (
                                            <option key={dist} value={dist}>{dist}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="profile-form-group">
                                    <label>Pincode</label>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        value={pincode}
                                        onChange={e => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                                        placeholder="e.g. 682001"
                                        className="profile-input"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="profile-modal-actions">
                                <button
                                    type="submit"
                                    className="profile-save-btn"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving Changes...' : '💾 Save Profile Details'}
                                </button>

                                <div className="profile-secondary-actions">
                                    <button
                                        type="button"
                                        className="profile-orders-btn"
                                        onClick={() => setActiveTab('orders')}
                                    >
                                        📦 View Delivered & Active Orders
                                    </button>
                                    <button
                                        type="button"
                                        className="profile-logout-btn"
                                        onClick={() => {
                                            onClose();
                                            if (onLogout) onLogout();
                                        }}
                                    >
                                        🚪 Log Out
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB 2: Orders & Delivered Status */}
                {activeTab === 'orders' && (
                    <div className="profile-orders-tab-content">
                        {/* Order Filter Pills */}
                        <div className="profile-orders-filter-row">
                            <button 
                                type="button" 
                                className={`profile-filter-pill ${orderFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setOrderFilter('all')}
                            >
                                All ({userBookings.length})
                            </button>
                            <button 
                                type="button" 
                                className={`profile-filter-pill ${orderFilter === 'delivered' ? 'active' : ''}`}
                                onClick={() => setOrderFilter('delivered')}
                            >
                                ✅ Delivered ({deliveredOrders.length})
                            </button>
                            <button 
                                type="button" 
                                className={`profile-filter-pill ${orderFilter === 'active' ? 'active' : ''}`}
                                onClick={() => setOrderFilter('active')}
                            >
                                🚚 Processing / In Transit ({activeOrders.length})
                            </button>
                        </div>

                        {/* Orders List */}
                        <div className="profile-orders-scroll-list">
                            {displayedOrders.length === 0 ? (
                                <div className="profile-empty-orders">
                                    <span style={{ fontSize: '32px' }}>🛍️</span>
                                    <h4>No {orderFilter !== 'all' ? orderFilter : ''} orders found</h4>
                                    <p>When you book clothing, your delivered and tracking details will appear right here.</p>
                                </div>
                            ) : (
                                displayedOrders.map((order) => {
                                    const isDelivered = order.status?.toLowerCase() === 'delivered';
                                    const isCancelled = order.status?.toLowerCase() === 'cancelled';
                                    return (
                                        <div className={`profile-order-card ${isDelivered ? 'card-delivered' : ''}`} key={order.orderId}>
                                            <div className="profile-order-card-header">
                                                <div>
                                                    <span className="order-id-label">Order #{order.orderId}</span>
                                                    <span className="order-date-text">{order.date}</span>
                                                </div>
                                                <span className={`order-status-badge ${isDelivered ? 'delivered' : isCancelled ? 'cancelled' : 'in-transit'}`}>
                                                    {isDelivered ? '✅ Delivered' : isCancelled ? '❌ Cancelled' : `🚚 ${order.status}`}
                                                </span>
                                            </div>

                                            {/* Products in this order */}
                                            <div className="profile-order-items-list">
                                                {(order.items || []).map((item, idx) => (
                                                    <div key={idx} className="profile-order-item-row">
                                                        <span className="item-title-col">• {item.title}</span>
                                                        <span className="item-size-pill">Size: {item.size}</span>
                                                        <span className="item-qty-col">Qty: {item.quantity}</span>
                                                        <span className="item-price-col">₹{item.price * item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Delivery Address Details */}
                                            <div className="profile-order-address-box">
                                                <span className="address-header-label">📍 Delivery Address:</span>
                                                <p className="address-detail-p">
                                                    {order.customer?.address || user.address || 'Address on file'}, {order.customer?.district || user.district || ''} {order.customer?.pincode ? `- ${order.customer.pincode}` : ''}
                                                </p>
                                                <span className="address-recipient-meta">
                                                    Recipient: <strong>{order.customer?.name || user.name}</strong> • 📞 +91 {order.customer?.phone || user.phone}
                                                </span>
                                            </div>

                                            {/* Order Footer & Actions */}
                                            <div className="profile-order-footer">
                                                <div className="order-total-info">
                                                    Total: <strong>₹{order.total}</strong>
                                                    <span className="payment-type-tag">({order.customer?.payment || 'COD'})</span>
                                                </div>

                                                <div className="order-actions-group">
                                                    <a 
                                                        href={generateWhatsAppSupport(order)} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="profile-order-whatsapp-btn"
                                                    >
                                                        💬 WhatsApp Support
                                                    </a>
                                                    {isDelivered && (
                                                        <button 
                                                            type="button" 
                                                            className="profile-order-review-btn"
                                                            onClick={() => {
                                                                onClose();
                                                                if (onViewOrders) onViewOrders();
                                                            }}
                                                        >
                                                            ⭐ Write Review
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 3: My Cart */}
                {activeTab === 'cart' && (
                    <div className="profile-cart-tab-content">
                        {cartItems.length === 0 ? (
                            <div className="profile-empty-orders">
                                <span style={{ fontSize: '36px' }}>🛒</span>
                                <h4>Your Shopping Cart is Empty</h4>
                                <p>Discover our latest oversized graphic tees and modern streetwear collection!</p>
                                <button 
                                    type="button" 
                                    className="profile-save-btn" 
                                    style={{ maxWidth: '220px', margin: '14px auto 0' }}
                                    onClick={onClose}
                                >
                                    🛍️ Start Shopping Now
                                </button>
                            </div>
                        ) : (
                            <div className="profile-cart-summary-box">
                                <div className="profile-cart-items-list">
                                    {cartItems.map((item, idx) => (
                                        <div key={idx} className="profile-cart-item-row">
                                            {item.image && (
                                                <img src={item.image} alt={item.title} className="profile-cart-item-thumb" />
                                            )}
                                            <div className="profile-cart-item-info">
                                                <div className="profile-cart-item-title">{item.title}</div>
                                                <div className="profile-cart-item-meta">
                                                    Size: <strong>{item.size}</strong> • Qty: <strong>{item.quantity}</strong>
                                                </div>
                                            </div>
                                            <div className="profile-cart-item-price">
                                                ₹{item.price * item.quantity}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="profile-cart-actions-bar">
                                    <div className="profile-cart-total-label">
                                        Total Amount: <strong>₹{cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0)}</strong>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="profile-checkout-now-btn"
                                        onClick={() => {
                                            if (onOpenCart) onOpenCart();
                                        }}
                                    >
                                        🛍️ View Cart & Checkout →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Flipkart Style Footer Logout Button */}
                <div className="profile-modal-footer">
                    <button 
                        type="button" 
                        className="profile-flipkart-logout-btn"
                        onClick={() => {
                            onClose();
                            if (onLogout) onLogout();
                        }}
                    >
                        🚪 Log Out of Account
                    </button>
                </div>
            </div>
        </div>
    );
}
