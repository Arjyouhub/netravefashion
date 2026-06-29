import React, { useState, useEffect } from 'react';
import { getCookie, setCookie, eraseCookie } from '../utils/cookies';

export default function AdminPanel({
    products,
    bookings,
    settings,
    onAddProduct,
    onEditProduct,
    onDeleteProduct,
    onUpdateBookingStatus,
    onSaveSettings,
    onClose,
    API_BASE_URL
}) {
    const [activeTab, setActiveTab] = useState('products');

    // Coupon states
    const [coupons, setCoupons] = useState([]);
    const [couponCode, setCouponCode] = useState('');
    const [discountType, setDiscountType] = useState('flat');
    const [discountValue, setDiscountValue] = useState('');
    const [minSubtotal, setMinSubtotal] = useState('');
    const [couponError, setCouponError] = useState('');

    // User states
    const [users, setUsers] = useState([]);
    const [userError, setUserError] = useState('');
    const [deletingUserPhone, setDeletingUserPhone] = useState(null);
    const [blockingUserPhone, setBlockingUserPhone] = useState(null);
    const [successBanner, setSuccessBanner] = useState('');
    const [actionError, setActionError] = useState('');
    const [deletingProductId, setDeletingProductId] = useState(null);
    const [deletingCouponCode, setDeletingCouponCode] = useState(null);
    const [productFormError, setProductFormError] = useState('');

    // Admin Auth States
    const [isLoggedIn, setIsLoggedIn] = useState(() => getCookie('isAdminLoggedIn') === 'true');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    // Admin Password Change States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // 1. Products Tab States
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [prodTitle, setProdTitle] = useState('');
    const [prodCategory, setProdCategory] = useState('t-shirt');
    const [prodPrice, setProdPrice] = useState('');
    const [prodOriginalPrice, setProdOriginalPrice] = useState('');
    const [prodImage, setProdImage] = useState('');
    const [prodDesc, setProdDesc] = useState('');
    const [prodSizes, setProdSizes] = useState(['M', 'L', 'XL']);
    const [prodTags, setProdTags] = useState([]);
    const [prodStock, setProdStock] = useState(50);
    const [prodInStock, setProdInStock] = useState(true);
    const [uploading, setUploading] = useState(false);

    // 2. Bookings Tab States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const bookingsPerPage = 8;

    // 3. Settings Tab States
    const [whatsappNum, setWhatsappNum] = useState(settings?.whatsappNumber || '919876543210');
    const [newUsername, setNewUsername] = useState(settings?.adminUsername || 'admin');
    const [maintMode, setMaintMode] = useState(settings?.maintenanceMode || false);
    const [maintMsg, setMaintMsg] = useState(settings?.maintenanceMessage || 'We are currently performing scheduled maintenance.');
    const [maintExpiry, setMaintExpiry] = useState(settings?.maintenanceExpiry ? new Date(settings.maintenanceExpiry - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '');
    const [offerNotif, setOfferNotif] = useState(settings?.offerNotification || '');

    useEffect(() => {
        if (settings) {
            setWhatsappNum(settings.whatsappNumber);
            setNewUsername(settings.adminUsername || 'admin');
            setMaintMode(settings.maintenanceMode || false);
            setMaintMsg(settings.maintenanceMessage || 'We are currently performing scheduled maintenance.');
            setMaintExpiry(settings.maintenanceExpiry ? new Date(settings.maintenanceExpiry - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '');
            setOfferNotif(settings.offerNotification || '');
        }
    }, [settings]);

    const fetchCoupons = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/coupons`);
            if (response.ok) {
                const data = await response.json();
                setCoupons(data);
            }
        } catch (err) {
            console.error('Failed to fetch coupons:', err);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchCoupons();
        }
    }, [isLoggedIn]);

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        setCouponError('');
        if (!couponCode || !discountValue) return;

        try {
            const response = await fetch(`${API_BASE_URL}/coupons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: couponCode,
                    discountType,
                    discountValue: Number(discountValue),
                    minSubtotal: Number(minSubtotal) || 0
                })
            });
            const data = await response.json();
            if (response.ok) {
                setCoupons([data, ...coupons]);
                setCouponCode('');
                setDiscountValue('');
                setMinSubtotal('');
                setDiscountType('flat');
            } else {
                setCouponError(data.error || 'Failed to create coupon.');
            }
        } catch (err) {
            setCouponError('Network error creating coupon.');
        }
    };

    const handleDeleteCoupon = async (code) => {
        try {
            const response = await fetch(`${API_BASE_URL}/coupons/${code}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setCoupons(coupons.filter(c => c.code !== code));
                setDeletingCouponCode(null);
            }
        } catch (err) {
            console.error('Delete coupon error:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: { 'x-admin-session': getCookie('adminSessionToken') }
            });
            if (response.status === 401) {
                handleLogout();
                return;
            }
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (err) {
            console.error('Failed to fetch users list:', err);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchUsers();
        }
    }, [isLoggedIn]);

    const showSuccess = (msg) => {
        setSuccessBanner(msg);
        setActionError('');
        setTimeout(() => setSuccessBanner(''), 4000);
    };

    const showError = (msg) => {
        setActionError(msg);
        setSuccessBanner('');
        setTimeout(() => setActionError(''), 4000);
    };

    const handleUnblockUser = async (phone) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/unblock/${phone}`, {
                method: 'POST',
                headers: { 'x-admin-session': getCookie('adminSessionToken') }
            });
            if (response.ok) {
                setUsers(users.map(u => u.phone === phone ? { ...u, isBlocked: false, blockedAt: 0, loginAttempts: 0, lockUntil: 0 } : u));
                showSuccess(`User account ${phone} has been unblocked.`);
            } else {
                const data = await response.json();
                showError(data.error || 'Failed to unblock user.');
            }
        } catch (err) {
            console.error('Unblock error:', err);
            showError('Network error unblocking user.');
        }
    };

    const handleBlockUser = async (phone) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/block/${phone}`, {
                method: 'POST',
                headers: { 'x-admin-session': getCookie('adminSessionToken') }
            });
            if (response.ok) {
                setUsers(users.map(u => u.phone === phone ? { ...u, isBlocked: true, blockedAt: Date.now() } : u));
                setBlockingUserPhone(null);
                showSuccess(`User account ${phone} has been blocked.`);
            } else {
                const data = await response.json();
                showError(data.error || 'Failed to block user.');
            }
        } catch (err) {
            console.error('Block error:', err);
            showError('Network error blocking user.');
        }
    };

    const handleDeleteUser = async (phone) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${phone}`, {
                method: 'DELETE',
                headers: { 'x-admin-session': getCookie('adminSessionToken') }
            });
            if (response.ok) {
                setUsers(users.filter(u => u.phone !== phone));
                setDeletingUserPhone(null);
                showSuccess(`User account ${phone} has been permanently deleted.`);
            } else {
                const data = await response.json();
                showError(data.error || 'Failed to delete user.');
            }
        } catch (err) {
            console.error('Delete user error:', err);
            showError('Network error deleting user.');
        }
    };

    const getUserStatus = (user) => {
        if (user.isBlocked) return { label: 'Blocked', class: 'inactive' };
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const remainingMins = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return { label: `Locked (${remainingMins}m)`, class: 'pending' };
        }
        return { label: 'Active', class: 'active' };
    };

    const formatDateTime = (timestamp) => {
        if (!timestamp) return 'N/A';
        const d = new Date(timestamp);
        return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        try {
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error("Non-JSON response from server:", text);
                if (response.status === 404) {
                    setLoginError("Login route not found on server (404). Please ensure your Render backend is deployed with the latest code.");
                } else {
                    setLoginError(`Server error: ${response.status} ${response.statusText}`);
                }
                return;
            }

            const data = await response.json();
            if (response.ok && data.success) {
                setCookie('isAdminLoggedIn', 'true');
                setCookie('adminSessionToken', data.sessionToken);
                setIsLoggedIn(true);
                setLoginError('');
                setUsername('');
                setPassword('');
            } else {
                setLoginError(data.error || 'Invalid username or password');
            }
        } catch (err) {
            console.error('Admin login error:', err);
            setLoginError('Network error connecting to backend.');
        }
    };

    const handleLogout = () => {
        eraseCookie('isAdminLoggedIn');
        setIsLoggedIn(false);
    };

    if (!isLoggedIn) {
        return (
            <div className="admin-login-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05070c', padding: '20px' }}>
                <style>{`
                    .modern-admin-input:focus {
                        border-color: #f59e0b !important;
                        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15) !important;
                        background: #161924 !important;
                    }
                    .modern-admin-btn {
                        background: linear-gradient(135deg, #f59e0b, #d97706) !important;
                        color: #0a0b0e !important;
                        border: none !important;
                        border-radius: 10px !important;
                        font-weight: 800 !important;
                        font-size: 15px !important;
                        padding: 14px !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        width: 100% !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.5px !important;
                    }
                    .modern-admin-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35) !important;
                    }
                    .modern-admin-btn:active {
                        transform: translateY(0);
                    }
                `}</style>
                <div className="admin-login-card" style={{ 
                    maxWidth: '430px', 
                    width: '100%', 
                    padding: '40px 32px', 
                    background: 'rgba(10, 11, 14, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(245, 158, 11, 0.25)', 
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 35px rgba(245,158,11,0.08)',
                    borderRadius: '16px',
                    position: 'relative'
                }}>
                    <div className="login-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{ 
                            width: '64px', 
                            height: '64px', 
                            background: 'rgba(245, 158, 11, 0.1)', 
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            boxShadow: '0 0 15px rgba(245,158,11,0.05)'
                        }}>
                            <svg viewBox="0 0 24 24" style={{ width: '28px', height: '28px', fill: '#f59e0b' }}>
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                            </svg>
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px', color: '#fff', letterSpacing: '0.5px' }}>Admin Portal Login</h3>
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>Sign in to manage your store catalog and bookings</p>
                    </div>
                    <form onSubmit={handleLoginSubmit} className="admin-login-form">
                        <div className="form-field" style={{ marginBottom: '20px' }}>
                            <label htmlFor="admin-username" style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Username</label>
                            <input
                                id="admin-username"
                                type="text"
                                className="modern-admin-input"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Enter admin username"
                                style={{ width: '100%', padding: '13px 16px', background: '#12141c', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box' }}
                                required
                            />
                        </div>
                        <div className="form-field" style={{ marginBottom: '24px' }}>
                            <label htmlFor="admin-password" style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Password</label>
                            <input
                                id="admin-password"
                                type="password"
                                className="modern-admin-input"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter admin password"
                                style={{ width: '100%', padding: '13px 16px', background: '#12141c', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box' }}
                                required
                            />
                        </div>
                        {loginError && (
                            <div style={{ 
                                background: 'rgba(239,68,68,0.1)', 
                                color: '#ef4444', 
                                border: '1px solid rgba(239,68,68,0.2)', 
                                padding: '12px 16px', 
                                borderRadius: '8px', 
                                fontSize: '13px', 
                                marginBottom: '20px',
                                textAlign: 'center',
                                fontWeight: '500'
                            }}>{loginError}</div>
                        )}
                        <button type="submit" className="modern-admin-btn">
                            Sign In
                        </button>
                        <button type="button" className="cta-btn secondary-cta login-cancel-btn" onClick={onClose} style={{ marginTop: '12px', width: '100%', borderRadius: '10px', borderColor: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                            Return to Store
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Handle Form Reset
    const resetProductForm = () => {
        setEditingProduct(null);
        setProdTitle('');
        setProdCategory('t-shirt');
        setProdPrice('');
        setProdOriginalPrice('');
        setProdImage('');
        setProdDesc('');
        setProdSizes(['M', 'L', 'XL']);
        setProdTags([]);
        setProdStock(50);
        setProdInStock(true);
        setProductFormError('');
    };

    // Open Add Form
    const handleOpenAdd = () => {
        resetProductForm();
        setIsProductFormOpen(true);
    };

    // Open Edit Form
    const handleOpenEdit = (product) => {
        setEditingProduct(product);
        setProdTitle(product.title || '');
        setProdCategory(product.category || 't-shirt');
        setProdPrice(product.price || '');
        setProdOriginalPrice(product.originalPrice || '');
        setProdImage(product.image || '');
        setProdDesc(product.description || '');
        setProdSizes(product.sizes || ['M', 'L', 'XL']);
        setProdTags(product.tags || []);
        setProdStock(product.stock !== undefined ? product.stock : 50);
        setProdInStock(product.inStock !== undefined ? product.inStock : true);
        setIsProductFormOpen(true);
    };

    // Submit Product Form (Add or Edit)
    const handleProductSubmit = (e) => {
        e.preventDefault();
        setProductFormError('');
        if (!prodTitle || !prodCategory || !prodPrice) {
            setProductFormError('Please fill out all required fields.');
            return;
        }

        const productPayload = {
            title: prodTitle,
            category: prodCategory,
            price: parseFloat(prodPrice),
            originalPrice: prodOriginalPrice ? parseFloat(prodOriginalPrice) : undefined,
            image: prodImage,
            description: prodDesc,
            sizes: prodSizes,
            tags: prodTags,
            stock: parseInt(prodStock) || 0,
            inStock: prodInStock
        };

        if (editingProduct) {
            onEditProduct(editingProduct.id, productPayload);
        } else {
            onAddProduct(productPayload);
        }
        setIsProductFormOpen(false);
        resetProductForm();
    };

    // File Upload Handler
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                const data = await response.json();
                setProdImage(data.fileUrl);
            } else {
                alert('Image upload failed.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Error connecting to upload server.');
        } finally {
            setUploading(false);
        }
    };

    // Handle Size Toggles
    const toggleSize = (size) => {
        if (prodSizes.includes(size)) {
            setProdSizes(prodSizes.filter(s => s !== size));
        } else {
            setProdSizes([...prodSizes, size]);
        }
    };

    // Handle Tag Input (Comma separated)
    const handleTagsChange = (val) => {
        const arr = val.split(',').map(t => t.trim()).filter(t => t !== '');
        setProdTags(arr);
    };

    // Booking Filtering and Searching
    const filteredBookings = bookings.filter(b => {
        const matchesQuery = 
            b.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.customer.phone.includes(searchQuery);
        
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        return matchesQuery && matchesStatus;
    });

    // Pagination Calculation
    const indexOfLastBooking = currentPage * bookingsPerPage;
    const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
    const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
    const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

    const handleSaveSettingsSubmit = (e) => {
        e.preventDefault();
        onSaveSettings({ 
            whatsappNumber: whatsappNum,
            maintenanceMode: maintMode,
            maintenanceMessage: maintMsg,
            maintenanceExpiry: maintExpiry ? new Date(maintExpiry).getTime() : 0,
            offerNotification: offerNotif
        });
    };

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/change-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-session': getCookie('adminSessionToken')
                },
                body: JSON.stringify({ currentPassword, newUsername, newPassword })
            });
            const data = await response.json();
            if (response.ok) {
                setPasswordSuccess('Admin credentials changed successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setPasswordError(data.error || 'Failed to change password.');
            }
        } catch (err) {
            console.error('Password change error:', err);
            setPasswordError('Network error changing password.');
        }
    };

    return (
        <div className="admin-dashboard-container container">
            <div className="admin-header-row">
                <h2>Admin Control Center</h2>
                <div className="admin-header-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button className="cta-btn secondary-cta" onClick={handleLogout}>
                        Log Out
                    </button>
                    <button className="cta-btn secondary-cta" onClick={onClose}>
                        Return to Store
                    </button>
                </div>
            </div>

            {/* Admin Tabs */}
            <div className="admin-tabs-row">
                <button 
                    className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    Manage Products
                </button>
                <button 
                    className={`admin-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('bookings'); setCurrentPage(1); }}
                >
                    Orders & Bookings ({bookings.length})
                </button>
                <button 
                    className={`admin-tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
                    onClick={() => setActiveTab('coupons')}
                >
                    Manage Coupons ({coupons.length})
                </button>
                <button 
                    className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Manage Users ({users.length})
                </button>
                <button 
                    className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    Shop Settings
                </button>
            </div>

            {/* TAB CONTENT: PRODUCTS */}
            {activeTab === 'products' && (
                <div className="admin-tab-content">
                    <div className="tab-actions-bar">
                        <h3>Current Store Catalog</h3>
                        <button className="cta-btn primary-cta" onClick={handleOpenAdd}>
                            + Add New Product
                        </button>
                    </div>

                    {isProductFormOpen && (
                        <div className="admin-form-overlay">
                            <div className="admin-modal-content">
                                <div className="modal-header">
                                    <h4>{editingProduct ? 'Edit Product details' : 'Add New Product'}</h4>
                                    <button className="close-btn" onClick={() => setIsProductFormOpen(false)}>&times;</button>
                                </div>
                                <form onSubmit={handleProductSubmit} className="admin-product-form">
                                    <div className="form-group-row">
                                        <div className="form-field">
                                            <label>Product Title *</label>
                                            <input 
                                                type="text" 
                                                required 
                                                value={prodTitle} 
                                                onChange={e => setProdTitle(e.target.value)} 
                                                placeholder="e.g. Premium Linen Shirt"
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Category *</label>
                                            <select value={prodCategory} onChange={e => setProdCategory(e.target.value)}>
                                                <option value="summer-t-shirt">Summer T-Shirts</option>
                                                <option value="t-shirt">T-Shirts</option>
                                                <option value="shirt">Shirts</option>
                                                <option value="pants">Pants</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group-row">
                                        <div className="form-field">
                                            <label>Selling Price (₹) *</label>
                                            <input 
                                                type="number" 
                                                required 
                                                value={prodPrice} 
                                                onChange={e => setProdPrice(e.target.value)} 
                                                placeholder="e.g. 799"
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Original Price (₹) (Optional)</label>
                                            <input 
                                                type="number" 
                                                value={prodOriginalPrice} 
                                                onChange={e => setProdOriginalPrice(e.target.value)} 
                                                placeholder="e.g. 1499"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group-row">
                                        <div className="form-field">
                                            <label>Stock Count</label>
                                            <input 
                                                type="number" 
                                                value={prodStock} 
                                                onChange={e => setProdStock(e.target.value)} 
                                                placeholder="e.g. 50"
                                            />
                                        </div>
                                        <div className="form-field toggle-field">
                                            <label>Product Availability</label>
                                            <div className="checkbox-wrapper">
                                                <input 
                                                    type="checkbox" 
                                                    id="inStockCheckbox"
                                                    checked={prodInStock} 
                                                    onChange={e => setProdInStock(e.target.checked)}
                                                />
                                                <label htmlFor="inStockCheckbox">In Stock & Listed</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-field">
                                        <label>Product Image Link / Upload</label>
                                        <div className="image-input-group">
                                            <input 
                                                type="text" 
                                                value={prodImage} 
                                                onChange={e => setProdImage(e.target.value)} 
                                                placeholder="Paste Unsplash image URL or upload file"
                                            />
                                            <div className="file-upload-btn-wrapper">
                                                <button type="button" className="file-btn">Upload Image</button>
                                                <input type="file" accept="image/*" onChange={handleFileUpload} />
                                            </div>
                                        </div>
                                        {uploading && <span className="upload-indicator">Uploading to server...</span>}
                                        {prodImage && (
                                            <div className="image-preview-box">
                                                <img src={prodImage} alt="Preview" style={{ maxHeight: '100px', borderRadius: '4px', marginTop: '10px' }} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-field">
                                        <label>Sizes Available (Select all that apply)</label>
                                        <div className="sizes-checkboxes">
                                            {['S', 'M', 'L', 'XL', 'XXL', 'One Size'].map(sz => (
                                                <button 
                                                    key={sz}
                                                    type="button"
                                                    className={`admin-size-select-btn ${prodSizes.includes(sz) ? 'selected' : ''}`}
                                                    onClick={() => toggleSize(sz)}
                                                >
                                                    {sz}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-field">
                                        <label>Product Description</label>
                                        <textarea 
                                            value={prodDesc} 
                                            onChange={e => setProdDesc(e.target.value)} 
                                            rows="3"
                                            placeholder="Write brief description for card..."
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Tags (Comma separated values)</label>
                                        <input 
                                            type="text" 
                                            value={prodTags.join(', ')} 
                                            onChange={e => handleTagsChange(e.target.value)} 
                                            placeholder="e.g. New, Oversized, Trending"
                                        />
                                    </div>

                                    {productFormError && (
                                        <div className="validation-err" style={{ display: 'block', marginBottom: '15px' }}>
                                            {productFormError}
                                        </div>
                                    )}

                                    <div className="modal-footer-actions">
                                        <button type="button" className="cta-btn secondary-cta" onClick={() => setIsProductFormOpen(false)}>Cancel</button>
                                        <button type="submit" className="cta-btn primary-cta">Save Product</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Products list Table */}
                    <div className="responsive-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(prod => (
                                    <tr key={prod.id}>
                                        <td>
                                            <img src={prod.image} alt={prod.title} className="table-thumbnail" />
                                        </td>
                                        <td className="bold-td">{prod.title}</td>
                                        <td>{prod.category}</td>
                                        <td>₹{prod.price}</td>
                                        <td>{prod.stock !== undefined ? prod.stock : 50}</td>
                                        <td>
                                            <span className={`status-pill ${prod.stock > 0 && prod.inStock ? 'active' : 'inactive'}`}>
                                                {prod.stock > 0 && prod.inStock ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                {deletingProductId === prod.id ? (
                                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                        <button 
                                                            className="edit-action-btn" 
                                                            onClick={() => onDeleteProduct(prod.id)}
                                                            style={{ background: 'var(--error)', color: '#ffffff', border: '1px solid var(--error)', padding: '4px 10px', fontSize: '12px' }}
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button 
                                                            className="delete-action-btn" 
                                                            onClick={() => setDeletingProductId(null)}
                                                            style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)', background: 'transparent', padding: '4px 10px', fontSize: '12px' }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button className="edit-action-btn" onClick={() => handleOpenEdit(prod)}>
                                                            Edit
                                                        </button>
                                                        <button className="delete-action-btn" onClick={() => setDeletingProductId(prod.id)}>
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: BOOKINGS */}
            {activeTab === 'bookings' && (
                <div className="admin-tab-content">
                    <div className="tab-filters-bar">
                        <div className="search-box-wrapper">
                            <input 
                                type="text" 
                                placeholder="Search Booking ID, Customer, Phone..." 
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="admin-search-input"
                            />
                        </div>
                        <div className="filter-dropdown-wrapper">
                            <label>Filter Status: </label>
                            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                                <option value="all">All Orders</option>
                                <option value="Pending">Pending</option>
                                <option value="Order Placed">Order Placed</option>
                                <option value="Payment Confirmed">Payment Confirmed</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div className="responsive-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Booking ID</th>
                                    <th>Date</th>
                                    <th>Customer Name</th>
                                    <th>Phone / WhatsApp</th>
                                    <th>Items (Qty)</th>
                                    <th>Total Price</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                            No matching bookings found.
                                        </td>
                                    </tr>
                                ) : (
                                    currentBookings.map(book => (
                                        <tr key={book.orderId}>
                                            <td className="bold-td highlight-order-id">{book.orderId}</td>
                                            <td style={{ fontSize: '13px' }}>{book.date}</td>
                                            <td className="bold-td">{book.customer.name}</td>
                                            <td>
                                                <div style={{ fontSize: '13px' }}>📞 {book.customer.phone}</div>
                                                <div style={{ fontSize: '13px', color: 'var(--accent)' }}>💬 {book.customer.whatsapp}</div>
                                            </td>
                                            <td>
                                                <div className="items-list-cell">
                                                    {book.items.map((item, idx) => (
                                                        <div key={idx} className="order-item-desc">
                                                            • {item.title} ({item.size}) x{item.quantity}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="bold-td">₹{book.total}</td>
                                            <td>
                                                <select 
                                                    value={book.status || 'Pending'} 
                                                    className={`status-select-dropdown ${book.status ? book.status.toLowerCase().replace(/\s+/g, '-') : 'pending'}`}
                                                    onChange={e => onUpdateBookingStatus(book.orderId, e.target.value)}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Order Placed">Order Placed</option>
                                                    <option value="Payment Confirmed">Payment Confirmed</option>
                                                    <option value="Dispatched">Dispatched</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="admin-pagination-row">
                            <button 
                                className="pagination-btn" 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            >
                                &laquo; Prev
                            </button>
                            <span className="pagination-info">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button 
                                className="pagination-btn" 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            >
                                Next &raquo;
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: COUPONS */}
            {activeTab === 'coupons' && (
                <div className="admin-tab-content">
                    <div className="tab-actions-bar">
                        <h3>Active Discount Coupons</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginTop: '20px' }}>
                        {/* Form: Create Coupon */}
                        <div className="admin-modal-content" style={{ position: 'relative', top: 0, margin: 0, maxWidth: '100%', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-card)' }}>
                            <div className="modal-header">
                                <h4 style={{ color: '#fff' }}>Create New Coupon</h4>
                            </div>
                            <form onSubmit={handleCreateCoupon} className="admin-product-form" style={{ padding: '20px' }}>
                                <div className="form-field">
                                    <label>Coupon Code *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={couponCode} 
                                        onChange={e => setCouponCode(e.target.value.toUpperCase())} 
                                        placeholder="e.g. EXTRA100"
                                    />
                                </div>
                                <div className="form-group-row" style={{ display: 'flex', gap: '15px' }}>
                                    <div className="form-field" style={{ flex: 1 }}>
                                        <label>Discount Type *</label>
                                        <select value={discountType} onChange={e => setDiscountType(e.target.value)}>
                                            <option value="flat">Flat Price (₹)</option>
                                            <option value="percentage">Percentage (%)</option>
                                        </select>
                                    </div>
                                    <div className="form-field" style={{ flex: 1 }}>
                                        <label>Discount Value *</label>
                                        <input 
                                            type="number" 
                                            required 
                                            value={discountValue} 
                                            onChange={e => setDiscountValue(e.target.value)} 
                                            placeholder={discountType === 'flat' ? 'e.g. 100' : 'e.g. 10'}
                                        />
                                    </div>
                                </div>
                                <div className="form-field">
                                    <label>Minimum Order Subtotal (₹) (Optional)</label>
                                    <input 
                                        type="number" 
                                        value={minSubtotal} 
                                        onChange={e => setMinSubtotal(e.target.value)} 
                                        placeholder="e.g. 500"
                                    />
                                </div>

                                {couponError && (
                                    <div className="validation-err" style={{ display: 'block', marginBottom: '15px' }}>
                                        {couponError}
                                    </div>
                                )}

                                <button type="submit" className="cta-btn primary-cta" style={{ width: '100%', justifyContent: 'center' }}>
                                    Create Coupon Code
                                </button>
                            </form>
                        </div>

                        {/* List: Coupon codes */}
                        <div>
                            <div className="responsive-table-wrapper" style={{ border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Type</th>
                                            <th>Value</th>
                                            <th>Min Order</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coupons.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No active coupons found.</td>
                                            </tr>
                                        ) : (
                                            coupons.map(c => (
                                                <tr key={c.code}>
                                                    <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{c.code}</td>
                                                    <td>{c.discountType === 'flat' ? 'Flat' : 'Percentage'}</td>
                                                    <td>{c.discountType === 'flat' ? `₹${c.discountValue}` : `${c.discountValue}%`}</td>
                                                    <td>₹{c.minSubtotal || 0}</td>
                                                    <td>
                                                        {deletingCouponCode === c.code ? (
                                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                <button 
                                                                    className="cta-btn primary-cta" 
                                                                    onClick={() => handleDeleteCoupon(c.code)}
                                                                    style={{ padding: '4px 10px', fontSize: '12px', minHeight: 'unset', width: 'auto', background: 'var(--error)', color: '#ffffff', borderColor: 'var(--error)' }}
                                                                >
                                                                    Confirm
                                                                </button>
                                                                <button 
                                                                    className="cta-btn secondary-cta" 
                                                                    onClick={() => setDeletingCouponCode(null)}
                                                                    style={{ padding: '4px 10px', fontSize: '12px', minHeight: 'unset', width: 'auto', borderColor: 'var(--border-color)', color: 'var(--text-muted)', background: 'transparent' }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                className="cta-btn secondary-cta" 
                                                                onClick={() => setDeletingCouponCode(c.code)}
                                                                style={{ padding: '4px 10px', fontSize: '12px', minHeight: 'unset', color: 'var(--error)', background: 'transparent' }}
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: USERS */}
            {activeTab === 'users' && (
                <div className="admin-tab-content">
                    <div className="tab-actions-bar">
                        <h3>Registered Store Customers</h3>
                    </div>

                    {successBanner && (
                        <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '12px 16px', borderRadius: '8px', marginTop: '15px', fontSize: '14px', fontWeight: '600' }}>
                            ✅ {successBanner}
                        </div>
                    )}

                    {actionError && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px 16px', borderRadius: '8px', marginTop: '15px', fontSize: '14px', fontWeight: '600' }}>
                            ⚠️ {actionError}
                        </div>
                    )}

                    <div className="responsive-table-wrapper" style={{ marginTop: '20px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Customer Name</th>
                                    <th>Mobile Number</th>
                                    <th>Login Attempts</th>
                                    <th>Account Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No registered users found.</td>
                                    </tr>
                                ) : (
                                    users.map(u => {
                                        const status = getUserStatus(u);
                                        return (
                                            <tr key={u.phone}>
                                                <td className="bold-td">
                                                    <div>{u.name}</div>
                                                    {u.isBlocked && u.blockedAt ? (
                                                        <div style={{ fontSize: '11px', color: 'var(--error)', fontWeight: 'normal', marginTop: '4px', textTransform: 'none', letterSpacing: 'normal' }}>
                                                            🚫 Blocked: {formatDateTime(u.blockedAt)}
                                                        </div>
                                                    ) : u.lastActiveAt ? (
                                                        <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'normal', marginTop: '4px', textTransform: 'none', letterSpacing: 'normal' }}>
                                                            🟢 Active: {formatDateTime(u.lastActiveAt)}
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '4px', textTransform: 'none', letterSpacing: 'normal' }}>
                                                            ⚪ No session history
                                                        </div>
                                                    )}
                                                </td>
                                                <td>{u.phone}</td>
                                                <td>{u.loginAttempts || 0} / 5 (lock) / 7 (block)</td>
                                                <td>
                                                    <span className={`status-pill ${status.class}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    {deletingUserPhone === u.phone ? (
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <button 
                                                                className="cta-btn primary-cta" 
                                                                onClick={() => handleDeleteUser(u.phone)}
                                                                style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'unset', width: 'auto', background: 'var(--error)', color: '#ffffff', borderColor: 'var(--error)' }}
                                                            >
                                                                Confirm Delete
                                                            </button>
                                                            <button 
                                                                className="cta-btn secondary-cta" 
                                                                onClick={() => setDeletingUserPhone(null)}
                                                                style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'unset', width: 'auto', borderColor: 'var(--border-color)', color: 'var(--text-muted)', background: 'transparent' }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : blockingUserPhone === u.phone ? (
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <button 
                                                                className="cta-btn primary-cta" 
                                                                onClick={() => handleBlockUser(u.phone)}
                                                                style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'unset', width: 'auto', background: '#f59e0b', color: '#000000', borderColor: '#f59e0b' }}
                                                            >
                                                                Confirm Block
                                                            </button>
                                                            <button 
                                                                className="cta-btn secondary-cta" 
                                                                onClick={() => setBlockingUserPhone(null)}
                                                                style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'unset', width: 'auto', borderColor: 'var(--border-color)', color: 'var(--text-muted)', background: 'transparent' }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            {(u.isBlocked || (u.lockUntil && u.lockUntil > Date.now())) ? (
                                                                <button 
                                                                    className="cta-btn primary-cta" 
                                                                    onClick={() => handleUnblockUser(u.phone)}
                                                                    style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'unset', width: 'auto', background: '#10b981', color: '#ffffff', borderColor: '#10b981' }}
                                                                >
                                                                    Unblock Account
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    className="cta-btn secondary-cta" 
                                                                    onClick={() => setBlockingUserPhone(u.phone)}
                                                                    style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'unset', width: 'auto', borderColor: '#f59e0b', color: '#f59e0b', background: 'transparent' }}
                                                                >
                                                                    Block Account
                                                                </button>
                                                            )}
                                                            <button 
                                                                className="cta-btn secondary-cta" 
                                                                onClick={() => setDeletingUserPhone(u.phone)}
                                                                style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'unset', width: 'auto', borderColor: 'var(--error)', color: 'var(--error)', background: 'transparent' }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: SETTINGS */}
            {activeTab === 'settings' && (
                <div className="admin-tab-content">
                    <div className="settings-card">
                        <h3>Shop Configurations</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                            Update global settings for your Netrave Store website.
                        </p>

                        <form onSubmit={handleSaveSettingsSubmit} className="admin-settings-form">
                            <div className="form-field" style={{ maxWidth: '400px' }}>
                                <label>Target WhatsApp Notification Number *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={whatsappNum} 
                                    onChange={e => setWhatsappNum(e.target.value)} 
                                    placeholder="e.g. 919876543210 (include country code)"
                                />
                                <small style={{ color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                                    Customers will automatically redirect to this WhatsApp contact to confirm order details after booking.
                                </small>
                            </div>

                            <h3>Offer & Announcement Broadcast</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
                                Display a glowing promotional announcement banner at the top of the storefront.
                            </p>

                            <div className="form-field" style={{ maxWidth: '600px' }}>
                                <label>Offer Notification Banner Text (Leave blank to hide)</label>
                                <textarea 
                                    value={offerNotif} 
                                    onChange={e => setOfferNotif(e.target.value)} 
                                    rows="2"
                                    placeholder="e.g. 🔥 MID-SUMMER OFFER: Use code SUMMER20 to get 20% flat discount!"
                                    style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', padding: '12px', width: '100%', fontFamily: 'inherit' }}
                                />
                            </div>

                            <button type="submit" className="cta-btn primary-cta" style={{ marginTop: '30px' }}>
                                Save Configurations
                            </button>
                        </form>
                    </div>

                    <div className="settings-card" style={{ marginTop: '30px' }}>
                        <h3>Change Admin Portal Password</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                            Update the credentials used to log in to the admin dashboard.
                        </p>

                        <form onSubmit={handleChangePasswordSubmit} className="admin-settings-form" style={{ maxWidth: '400px' }}>
                            <div className="form-field">
                                <label>Current Admin Password *</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={currentPassword} 
                                    onChange={e => setCurrentPassword(e.target.value)} 
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div className="form-field">
                                <label>New Admin Username *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newUsername} 
                                    onChange={e => setNewUsername(e.target.value)} 
                                    placeholder="Enter new admin username"
                                />
                            </div>

                            <div className="form-field">
                                <label>New Password *</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={newPassword} 
                                    onChange={e => setNewPassword(e.target.value)} 
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div className="form-field">
                                <label>Confirm New Password *</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={confirmPassword} 
                                    onChange={e => setConfirmPassword(e.target.value)} 
                                    placeholder="Confirm new password"
                                />
                            </div>

                            {passwordError && (
                                <div className="validation-err" style={{ display: 'block', marginTop: '10px' }}>
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="validation-success" style={{ display: 'block', color: '#10B981', fontWeight: 'bold', fontSize: '13px', marginTop: '10px' }}>
                                    {passwordSuccess}
                                </div>
                            )}

                            <button type="submit" className="cta-btn primary-cta" style={{ marginTop: '20px' }}>
                                Update Password
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
