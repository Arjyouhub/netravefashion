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
    const [activeTab, setActiveTab] = useState('analytics');

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
    const [prodCostPrice, setProdCostPrice] = useState('');
    const [prodMarginAmount, setProdMarginAmount] = useState('');
    const [prodOriginalPrice, setProdOriginalPrice] = useState('');
    const [prodImage, setProdImage] = useState('');
    const [prodDesc, setProdDesc] = useState('');
    const [prodSizes, setProdSizes] = useState(['M', 'L', 'XL']);
    const [prodTags, setProdTags] = useState([]);
    const [prodStock, setProdStock] = useState(50);
    const [prodInStock, setProdInStock] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [quickEditingMarginId, setQuickEditingMarginId] = useState(null);
    const [quickSalePriceVal, setQuickSalePriceVal] = useState('');
    const [quickBuyPriceVal, setQuickBuyPriceVal] = useState('');
    const [quickMarginVal, setQuickMarginVal] = useState('');

    // 2. Bookings Tab States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const bookingsPerPage = 8;

    // 3. Margin & Analytics States
    const [analyticsTimeframe, setAnalyticsTimeframe] = useState('all'); // 'all', 'today', '7d', '30d'

    // 4. Settings Tab States
    const [bookingsList, setBookingsList] = useState([]);
    const [selectedAdminBooking, setSelectedAdminBooking] = useState(null);
    const [whatsappNum, setWhatsappNum] = useState(settings?.whatsappNumber || '919876543210');
    const [newUsername, setNewUsername] = useState(settings?.adminUsername || 'admin');
    const [maintMode, setMaintMode] = useState(settings?.maintenanceMode || false);
    const [maintMsg, setMaintMsg] = useState(settings?.maintenanceMessage || 'We are currently performing scheduled maintenance.');
    const [maintExpiry, setMaintExpiry] = useState(settings?.maintenanceExpiry ? new Date(settings.maintenanceExpiry - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '');
    const [offerNotif, setOfferNotif] = useState(settings?.offerNotification || '');
    const [razorpayKeyId, setRazorpayKeyId] = useState(settings?.razorpayKeyId || '');
    const [razorpayKeySecret, setRazorpayKeySecret] = useState(settings?.razorpayKeySecret || '');
    const [razorpayEnabled, setRazorpayEnabled] = useState(settings?.razorpayEnabled || false);
    const [googleClientId, setGoogleClientId] = useState(settings?.googleClientId || '361479572817-1s040ttad228nt6pm85rm2krlrt9tt17.apps.googleusercontent.com');

    useEffect(() => {
        if (settings) {
            setWhatsappNum(settings.whatsappNumber);
            setNewUsername(settings.adminUsername || 'admin');
            setMaintMode(settings.maintenanceMode || false);
            setMaintMsg(settings.maintenanceMessage || 'We are currently performing scheduled maintenance.');
            setMaintExpiry(settings.maintenanceExpiry ? new Date(settings.maintenanceExpiry - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '');
            setOfferNotif(settings.offerNotification || '');
            setRazorpayKeyId(settings.razorpayKeyId || '');
            setRazorpayKeySecret(settings.razorpayKeySecret || '');
            setRazorpayEnabled(settings.razorpayEnabled !== undefined ? settings.razorpayEnabled : false);
            setGoogleClientId(settings.googleClientId || '361479572817-1s040ttad228nt6pm85rm2krlrt9tt17.apps.googleusercontent.com');
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

    const fetchAllBookings = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings`);
            if (response.ok) {
                const data = await response.json();
                setBookingsList(data);
            }
        } catch (err) {
            console.error('Failed to fetch bookings list:', err);
        }
    };

    const handleUpdateStatusLocal = async (orderId, newStatus) => {
        try {
            if (onUpdateBookingStatus) {
                await onUpdateBookingStatus(orderId, newStatus);
            }
            await fetchAllBookings();
            if (selectedAdminBooking && selectedAdminBooking.orderId === orderId) {
                setSelectedAdminBooking(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            console.error('Failed to update booking status locally:', err);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchUsers();
            fetchAllBookings();
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
            if (response.status === 401) {
                handleLogout();
                return;
            }
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
            if (response.status === 401) {
                handleLogout();
                return;
            }
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
            if (response.status === 401) {
                handleLogout();
                return;
            }
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
        setProdCostPrice('');
        setProdMarginAmount('');
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
        const price = product.price !== undefined && product.price !== null ? product.price : '';
        const cost = product.costPrice !== undefined && product.costPrice !== null ? product.costPrice : '';
        setProdPrice(price);
        setProdCostPrice(cost);
        if (price !== '' && cost !== '') {
            setProdMarginAmount(Math.max(0, Number(price) - Number(cost)));
        } else if (price !== '') {
            setProdMarginAmount(price);
        } else {
            setProdMarginAmount('');
        }
        setProdOriginalPrice(product.originalPrice || '');
        setProdImage(product.image || '');
        setProdDesc(product.description || '');
        setProdSizes(product.sizes || ['M', 'L', 'XL']);
        setProdTags(product.tags || []);
        setProdStock(product.stock !== undefined ? product.stock : 50);
        setProdInStock(product.inStock !== undefined ? product.inStock : true);
        setIsProductFormOpen(true);
    };

    // Two-way interactive margin & price calculators
    // Sale Price (e.g. 499) - Buy Price (e.g. 250) = Profit Margin (₹249)
    const handleSellingPriceChange = (val) => {
        setProdPrice(val);
        const numPrice = parseFloat(val) || 0;
        const numCost = parseFloat(prodCostPrice) || 0;
        setProdMarginAmount(Math.max(0, numPrice - numCost));
    };

    const handleCostPriceChange = (val) => {
        setProdCostPrice(val);
        const numCost = parseFloat(val) || 0;
        if (prodPrice !== '') {
            const numPrice = parseFloat(prodPrice) || 0;
            setProdMarginAmount(Math.max(0, numPrice - numCost));
        } else if (prodMarginAmount !== '') {
            const numMargin = parseFloat(prodMarginAmount) || 0;
            setProdPrice(numCost + numMargin);
        }
    };

    const handleMarginAmountChange = (val) => {
        setProdMarginAmount(val);
        const numMargin = parseFloat(val) || 0;
        const numCost = parseFloat(prodCostPrice) || 0;
        setProdPrice(numCost + numMargin);
    };

    // Direct On-Page Quick Margin & Pricing Handlers
    const handleStartQuickMargin = (prod) => {
        setQuickEditingMarginId(prod.id);
        const cost = prod.costPrice !== undefined && prod.costPrice !== null ? Number(prod.costPrice) : 0;
        const price = Number(prod.price) || 0;
        const currentMargin = price - cost;
        setQuickSalePriceVal(price > 0 ? price.toString() : '');
        setQuickBuyPriceVal(cost >= 0 ? cost.toString() : '0');
        setQuickMarginVal(currentMargin.toString());
    };

    const handleQuickSalePriceChange = (val) => {
        setQuickSalePriceVal(val);
        const saleNum = parseFloat(val) || 0;
        const buyNum = parseFloat(quickBuyPriceVal) || 0;
        setQuickMarginVal((saleNum - buyNum).toString());
    };

    const handleQuickBuyPriceChange = (val) => {
        setQuickBuyPriceVal(val);
        const buyNum = parseFloat(val) || 0;
        const saleNum = parseFloat(quickSalePriceVal) || 0;
        setQuickMarginVal((saleNum - buyNum).toString());
    };

    const handleCancelQuickMargin = () => {
        setQuickEditingMarginId(null);
        setQuickSalePriceVal('');
        setQuickBuyPriceVal('');
        setQuickMarginVal('');
    };

    const handleSaveQuickMargin = async (prod) => {
        const salePrice = parseFloat(quickSalePriceVal);
        const buyPrice = parseFloat(quickBuyPriceVal) >= 0 ? parseFloat(quickBuyPriceVal) : 0;
        const margin = salePrice - buyPrice;

        if (isNaN(salePrice) || salePrice <= 0) {
            showError('Sale Price must be greater than 0.');
            return;
        }

        try {
            await onEditProduct(prod.id, {
                ...prod,
                price: salePrice,
                costPrice: buyPrice
            });
            showSuccess(`Saved "${prod.title}": Sale Price ₹${salePrice}, Buy Price ₹${buyPrice} (Margin: ₹${margin})`);
            setQuickEditingMarginId(null);
        } catch (err) {
            showError('Failed to update pricing & margin.');
        }
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
            costPrice: prodCostPrice ? parseFloat(prodCostPrice) : 0,
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

    // Helper to render modern payment badges
    const getOrderPaymentBadge = (book) => {
        const rawPayment = (book.customer?.payment || book.paymentMethod || book.payment || '').toLowerCase();
        const payId = book.customer?.razorpayPaymentId || book.razorpayPaymentId;
        const isRazorpay = rawPayment.includes('razorpay') || book.paymentMethod === 'razorpay' || Boolean(payId);
        const isUpi = rawPayment.includes('upi');

        if (isRazorpay) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        background: 'rgba(16, 185, 129, 0.15)', 
                        border: '1px solid rgba(16, 185, 129, 0.35)', 
                        color: '#34d399', 
                        padding: '3px 8px', 
                        borderRadius: '6px', 
                        fontSize: '11px', 
                        fontWeight: '700',
                        width: 'fit-content'
                    }}>
                        ⚡ Razorpay (Paid)
                    </span>
                    {payId && (
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }} title={`Payment ID: ${payId}`}>
                            {payId.length > 14 ? `${payId.slice(0, 14)}...` : payId}
                        </span>
                    )}
                </div>
            );
        }

        if (isUpi) {
            return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                    📱 UPI Direct
                </span>
            );
        }

        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                ⚠️ COD (Disabled)
            </span>
        );
    };

    // Booking Filtering and Searching
    const filteredBookings = bookingsList.filter(b => {
        const matchesQuery = 
            b.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.customer?.phone?.includes(searchQuery);
        
        const matchesStatus = statusFilter === 'all' 
            || b.status === statusFilter 
            || (statusFilter === 'Confirmed' && (b.status === 'Confirmed' || b.status === 'Payment Confirmed'));
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
            offerNotification: offerNotif,
            razorpayKeyId,
            razorpayKeySecret,
            razorpayEnabled,
            googleClientId
        });
    };

    // =========================================================================
    // E-COMMERCE MARGIN & REVENUE ANALYTICS CALCULATIONS
    // =========================================================================
    const now = new Date();
    const isWithinTimeframe = (dateString, timeframe) => {
        if (!dateString || timeframe === 'all') return true;
        try {
            const parsedDate = new Date(dateString);
            if (isNaN(parsedDate.getTime())) return true;
            
            const diffMs = now.getTime() - parsedDate.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            const diffDays = diffHours / 24;

            if (timeframe === 'today') return diffHours <= 24;
            if (timeframe === '7d') return diffDays <= 7;
            if (timeframe === '30d') return diffDays <= 30;
            return true;
        } catch {
            return true;
        }
    };

    // Filter valid orders (exclude Cancelled)
    const validBookings = bookingsList.filter(b => {
        const isNotCancelled = b.status !== 'Cancelled' && b.status !== 'Cancelled by Customer';
        return isNotCancelled && isWithinTimeframe(b.date, analyticsTimeframe);
    });

    // 1. Core Financial Totals
    let totalGrossRevenue = 0;
    let totalCOGS = 0;
    let totalUnitsSold = 0;

    // Track product sales and margins
    const productStatsMap = {};
    products.forEach(p => {
        productStatsMap[p.id] = {
            id: p.id,
            title: p.title,
            category: p.category,
            price: Number(p.price) || 0,
            costPrice: Number(p.costPrice) || 0,
            stock: p.stock !== undefined ? p.stock : 50,
            inStock: p.inStock,
            image: p.image,
            unitsSold: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0
        };
    });

    // Track category sales and margins
    const categoryStatsMap = {
        't-shirt': { name: 'T-Shirts', revenue: 0, cost: 0, profit: 0, units: 0 },
        'summer-t-shirt': { name: 'Summer T-Shirts', revenue: 0, cost: 0, profit: 0, units: 0 },
        'shirt': { name: 'Shirts', revenue: 0, cost: 0, profit: 0, units: 0 },
        'pants': { name: 'Pants', revenue: 0, cost: 0, profit: 0, units: 0 }
    };

    // Track payment methods
    const paymentStatsMap = {
        '⚡ Razorpay (Online)': { count: 0, revenue: 0 },
        '📱 UPI Direct': { count: 0, revenue: 0 },
        '⚠️ Legacy COD': { count: 0, revenue: 0 }
    };

    // Group sales by day for chart
    const dailyTrendMap = {};

    validBookings.forEach(booking => {
        const orderRev = Number(booking.subtotal || booking.total) || 0;
        totalGrossRevenue += orderRev;

        // Payment stats
        const pRaw = (booking.customer?.payment || booking.paymentMethod || booking.payment || '').toLowerCase();
        let pMethod = '⚠️ Legacy COD';
        if (pRaw.includes('razorpay') || booking.customer?.razorpayPaymentId || booking.paymentMethod === 'razorpay') {
            pMethod = '⚡ Razorpay (Online)';
        } else if (pRaw.includes('upi')) {
            pMethod = '📱 UPI Direct';
        }
        if (!paymentStatsMap[pMethod]) paymentStatsMap[pMethod] = { count: 0, revenue: 0 };
        paymentStatsMap[pMethod].count += 1;
        paymentStatsMap[pMethod].revenue += orderRev;

        // Daily trend key
        const dateKey = booking.date ? booking.date.split(',')[0].trim() : 'Recent';
        if (!dailyTrendMap[dateKey]) {
            dailyTrendMap[dateKey] = { date: dateKey, revenue: 0, cost: 0, profit: 0 };
        }
        dailyTrendMap[dateKey].revenue += orderRev;

        let orderCost = 0;
        (booking.items || []).forEach(item => {
            const qty = parseInt(item.quantity) || 1;
            totalUnitsSold += qty;
            const refProd = products.find(p => p.id === item.id);
            const unitCost = item.costPrice !== undefined 
                ? Number(item.costPrice) 
                : (refProd?.costPrice !== undefined ? Number(refProd.costPrice) : Math.round((item.price || 0) * 0.5));
            const itemRev = (Number(item.price) || 0) * qty;
            const itemCost = unitCost * qty;
            const itemProfit = itemRev - itemCost;

            orderCost += itemCost;
            totalCOGS += itemCost;

            // Product stats
            if (productStatsMap[item.id]) {
                productStatsMap[item.id].unitsSold += qty;
                productStatsMap[item.id].totalRevenue += itemRev;
                productStatsMap[item.id].totalCost += itemCost;
                productStatsMap[item.id].totalProfit += itemProfit;
            }

            // Category stats
            const cat = item.category || refProd?.category || 't-shirt';
            if (!categoryStatsMap[cat]) {
                categoryStatsMap[cat] = { name: cat, revenue: 0, cost: 0, profit: 0, units: 0 };
            }
            categoryStatsMap[cat].units += qty;
            categoryStatsMap[cat].revenue += itemRev;
            categoryStatsMap[cat].cost += itemCost;
            categoryStatsMap[cat].profit += itemProfit;
        });

        dailyTrendMap[dateKey].cost += orderCost;
        dailyTrendMap[dateKey].profit += (orderRev - orderCost);
    });

    const totalNetProfit = totalGrossRevenue - totalCOGS;
    const grossMarginPercent = totalGrossRevenue > 0 
        ? ((totalNetProfit / totalGrossRevenue) * 100).toFixed(1) 
        : '0.0';
    const averageOrderValue = validBookings.length > 0 
        ? Math.round(totalGrossRevenue / validBookings.length) 
        : 0;
    const confirmedDeliveredCount = validBookings.filter(b => 
        b.status === 'Payment Confirmed' || b.status === 'Delivered'
    ).length;
    const fulfillmentRate = validBookings.length > 0 
        ? Math.round((confirmedDeliveredCount / validBookings.length) * 100) 
        : 0;

    // Leaderboard sorted by profit descending
    const productLeaderboard = Object.values(productStatsMap).sort((a, b) => b.totalProfit - a.totalProfit);

    // Export CSV handler
    const handleExportCSV = () => {
        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Order ID,Date,Customer Name,Phone,Payment Method,Status,Subtotal,Delivery,Total Revenue,Estimated COGS,Net Profit,Margin %\n';
        
        validBookings.forEach(b => {
            const rev = b.total || 0;
            let cost = 0;
            (b.items || []).forEach(it => {
                const uCost = it.costPrice !== undefined ? Number(it.costPrice) : Math.round((it.price || 0) * 0.5);
                cost += uCost * (it.quantity || 1);
            });
            const profit = rev - cost;
            const marginPct = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0;
            csvContent += `"${b.orderId}","${b.date}","${b.customer?.name || ''}","${b.customer?.phone || ''}","${b.customer?.payment || ''}","${b.status}",${b.subtotal || rev},${b.delivery || 0},${rev},${cost},${profit},${marginPct}%\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Netrave_Margin_Report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            {/* Responsive Admin Header */}
            <div className="admin-header-row">
                <div className="admin-header-title-box">
                    <h2>
                        <span>Admin Control Center</span>
                        <span className="admin-tag-badge">Store Manager</span>
                    </h2>
                    <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                        NETRAVE Fashion Store • Real-Time Margins & Gateway
                    </span>
                </div>
                <div className="admin-header-actions">
                    <button 
                        type="button" 
                        className="admin-action-chip-btn danger-chip" 
                        onClick={handleLogout}
                        title="Log out from admin portal"
                    >
                        🚪 Log Out
                    </button>
                    <button 
                        type="button" 
                        className="admin-action-chip-btn" 
                        onClick={onClose}
                        style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--primary)' }}
                    >
                        🏪 View Store
                    </button>
                </div>
            </div>

            {/* Responsive Horizontal Scrolling Pill Tabs */}
            <div className="admin-nav-tabs-wrapper">
                <div className="admin-nav-tabs-scroll">
                    <button 
                        type="button"
                        className={`admin-tab-chip ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        <span>📊 Margin & Revenue Analytics</span>
                    </button>
                    <button 
                        type="button"
                        className={`admin-tab-chip ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        <span>🏷️ Products</span>
                        <span className="admin-tab-count-badge">{products.length}</span>
                    </button>
                    <button 
                        type="button"
                        className={`admin-tab-chip ${activeTab === 'bookings' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('bookings'); setCurrentPage(1); }}
                    >
                        <span>📦 Orders & Bookings</span>
                        <span className="admin-tab-count-badge">{bookingsList.length}</span>
                    </button>
                    <button 
                        type="button"
                        className={`admin-tab-chip ${activeTab === 'coupons' ? 'active' : ''}`}
                        onClick={() => setActiveTab('coupons')}
                    >
                        <span>🎟️ Coupons</span>
                        <span className="admin-tab-count-badge">{coupons.length}</span>
                    </button>
                    <button 
                        type="button"
                        className={`admin-tab-chip ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <span>👥 Users</span>
                        <span className="admin-tab-count-badge">{users.length}</span>
                    </button>
                    <button 
                        type="button"
                        className={`admin-tab-chip ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <span>⚙️ Shop Settings</span>
                    </button>
                </div>
            </div>

            {/* Admin Tabs: Mobile Dropdown Navigator (shown strictly on mobile) */}
            <div className="admin-tabs-mobile-dropdown-container">
                <div className="admin-mobile-dropdown-header">
                    <span className="admin-mobile-dropdown-title">Navigation Menu</span>
                    <span className="admin-mobile-dropdown-current-pill">
                        {activeTab === 'analytics' && '📊 Analytics'}
                        {activeTab === 'products' && `🏷️ Products (${products.length})`}
                        {activeTab === 'bookings' && `📦 Orders (${bookingsList.length})`}
                        {activeTab === 'coupons' && `🎟️ Coupons (${coupons.length})`}
                        {activeTab === 'users' && `👥 Users (${users.length})`}
                        {activeTab === 'settings' && '⚙️ Settings'}
                    </span>
                </div>
                <div className="admin-mobile-select-wrapper">
                    <select
                        id="adminActiveTabSelect"
                        className="admin-mobile-tab-select"
                        value={activeTab}
                        onChange={(e) => {
                            const val = e.target.value;
                            setActiveTab(val);
                            if (val === 'bookings') setCurrentPage(1);
                        }}
                    >
                        <option value="analytics">📊 Margin & Revenue Analytics</option>
                        <option value="products">🏷️ Manage Products ({products.length})</option>
                        <option value="bookings">📦 Orders & Bookings ({bookingsList.length})</option>
                        <option value="coupons">🎟️ Manage Coupons ({coupons.length})</option>
                        <option value="users">👥 Manage Users ({users.length})</option>
                        <option value="settings">⚙️ Shop Settings</option>
                    </select>
                    <div className="admin-mobile-select-chevron">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>
            </div>

            {/* TAB CONTENT: ANALYTICS & MARGINS */}
            {activeTab === 'analytics' && (
                <div className="admin-tab-content">
                    {/* Top Bar with Timeframe Filter & Export */}
                    <div className="analytics-hero-bar">
                        <div className="analytics-hero-text">
                            <h3>Store Sales & Profit Margin Analytics</h3>
                            <p>Real-time financial performance, product profitability, and order margins.</p>
                        </div>
                        <div className="analytics-controls-group">
                            <div className="timeframe-pill-group">
                                <button 
                                    type="button"
                                    className={`timeframe-btn ${analyticsTimeframe === 'all' ? 'active' : ''}`}
                                    onClick={() => setAnalyticsTimeframe('all')}
                                >
                                    All Time
                                </button>
                                <button 
                                    type="button"
                                    className={`timeframe-btn ${analyticsTimeframe === 'today' ? 'active' : ''}`}
                                    onClick={() => setAnalyticsTimeframe('today')}
                                >
                                    Today
                                </button>
                                <button 
                                    type="button"
                                    className={`timeframe-btn ${analyticsTimeframe === '7d' ? 'active' : ''}`}
                                    onClick={() => setAnalyticsTimeframe('7d')}
                                >
                                    Last 7 Days
                                </button>
                                <button 
                                    type="button"
                                    className={`timeframe-btn ${analyticsTimeframe === '30d' ? 'active' : ''}`}
                                    onClick={() => setAnalyticsTimeframe('30d')}
                                >
                                    Last 30 Days
                                </button>
                            </div>
                            <button type="button" className="export-report-btn" onClick={handleExportCSV} title="Download CSV spreadsheet of sales & margins">
                                📥 Export CSV Report
                            </button>
                        </div>
                    </div>

                    {/* KPI Metric Cards */}
                    <div className="analytics-kpi-grid">
                        <div className="kpi-card gold-highlight">
                            <div className="kpi-card-header">
                                <span className="kpi-card-title">Total Revenue</span>
                                <span className="kpi-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>💰</span>
                            </div>
                            <div className="kpi-card-value">₹{totalGrossRevenue.toLocaleString('en-IN')}</div>
                            <div className="kpi-card-sub">
                                <span>Across {validBookings.length} completed orders</span>
                            </div>
                        </div>

                        <div className="kpi-card emerald-highlight">
                            <div className="kpi-card-header">
                                <span className="kpi-card-title">Net Profit / Margin</span>
                                <span className="kpi-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>📈</span>
                            </div>
                            <div className="kpi-card-value" style={{ color: '#10b981' }}>₹{totalNetProfit.toLocaleString('en-IN')}</div>
                            <div className="kpi-card-sub profit-positive">
                                <span>Gross Margin: {grossMarginPercent}%</span>
                            </div>
                        </div>

                        <div className="kpi-card">
                            <div className="kpi-card-header">
                                <span className="kpi-card-title">Cost of Goods (COGS)</span>
                                <span className="kpi-card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>📦</span>
                            </div>
                            <div className="kpi-card-value">₹{totalCOGS.toLocaleString('en-IN')}</div>
                            <div className="kpi-card-sub">
                                <span>Estimated purchase/manufacturing cost</span>
                            </div>
                        </div>

                        <div className="kpi-card">
                            <div className="kpi-card-header">
                                <span className="kpi-card-title">Average Order (AOV)</span>
                                <span className="kpi-card-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>🏷️</span>
                            </div>
                            <div className="kpi-card-value">₹{averageOrderValue.toLocaleString('en-IN')}</div>
                            <div className="kpi-card-sub">
                                <span>{totalUnitsSold} total units sold</span>
                            </div>
                        </div>
                    </div>

                    {/* Dual Panels: Trend Chart & Category Breakdown */}
                    <div className="analytics-charts-grid">
                        {/* Left: Revenue vs Margin Trend Chart */}
                        <div className="analytics-chart-panel">
                            <div className="panel-header-row">
                                <h4>Revenue vs Net Profit Trends</h4>
                                <div className="chart-legend-box">
                                    <div className="legend-item">
                                        <div className="legend-color-dot" style={{ background: '#f59e0b' }}></div>
                                        <span>Revenue (Sales)</span>
                                    </div>
                                    <div className="legend-item">
                                        <div className="legend-color-dot" style={{ background: '#10b981' }}></div>
                                        <span>Net Profit (Margin)</span>
                                    </div>
                                </div>
                            </div>

                            {/* SVG Interactive Multi-bar Trend Chart */}
                            <div className="svg-chart-container">
                                {Object.keys(dailyTrendMap).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                                        No sales data available for the selected timeframe.
                                    </div>
                                ) : (
                                    <svg className="svg-trend-chart" viewBox="0 0 500 180" preserveAspectRatio="none">
                                        {/* Background Gridlines */}
                                        <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                                        <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                                        <line x1="0" y1="130" x2="500" y2="130" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                                        <line x1="0" y1="160" x2="500" y2="160" stroke="rgba(255,255,255,0.15)" />

                                        {/* Dynamic Bars for each date */}
                                        {Object.values(dailyTrendMap).slice(-6).map((day, idx, arr) => {
                                            const count = arr.length;
                                            const slotWidth = 500 / count;
                                            const barGroupX = idx * slotWidth + (slotWidth - 48) / 2;
                                            const maxVal = Math.max(...arr.map(a => a.revenue), 100);
                                            const revHeight = Math.max(8, (day.revenue / maxVal) * 120);
                                            const profitHeight = Math.max(4, (day.profit / maxVal) * 120);
                                            const revY = 160 - revHeight;
                                            const profitY = 160 - profitHeight;

                                            return (
                                                <g key={day.date}>
                                                    {/* Revenue Bar (Gold) */}
                                                    <rect 
                                                        x={barGroupX} 
                                                        y={revY} 
                                                        width="20" 
                                                        height={revHeight} 
                                                        rx="4" 
                                                        fill="#f59e0b" 
                                                        opacity="0.9"
                                                    >
                                                        <title>{`${day.date}: Revenue ₹${day.revenue}`}</title>
                                                    </rect>
                                                    {/* Profit Bar (Emerald) */}
                                                    <rect 
                                                        x={barGroupX + 24} 
                                                        y={profitY} 
                                                        width="20" 
                                                        height={profitHeight} 
                                                        rx="4" 
                                                        fill="#10b981" 
                                                        opacity="0.9"
                                                    >
                                                        <title>{`${day.date}: Profit ₹${day.profit} (${day.revenue > 0 ? ((day.profit / day.revenue) * 100).toFixed(0) : 0}% Margin)`}</title>
                                                    </rect>
                                                    {/* Date Label */}
                                                    <text 
                                                        x={barGroupX + 22} 
                                                        y="176" 
                                                        textAnchor="middle" 
                                                        fill="#94a3b8" 
                                                        fontSize="10"
                                                        fontWeight="600"
                                                    >
                                                        {day.date.length > 8 ? day.date.slice(0, 6) : day.date}
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                )}
                            </div>
                        </div>

                        {/* Right: Category Profit & Margin Share */}
                        <div className="analytics-chart-panel">
                            <div className="panel-header-row">
                                <h4>Category Margin Health</h4>
                            </div>

                            <div className="category-margin-list">
                                {Object.entries(categoryStatsMap).map(([key, cat]) => {
                                    const marginPercent = cat.revenue > 0 
                                        ? ((cat.profit / cat.revenue) * 100).toFixed(1) 
                                        : 0;
                                    const isHigh = Number(marginPercent) >= 50;

                                    return (
                                        <div className="category-margin-row" key={key}>
                                            <div className="cat-header-flex">
                                                <span>{cat.name}</span>
                                                <span className={`cat-margin-badge ${isHigh ? 'high' : 'medium'}`}>
                                                    {marginPercent}% Margin
                                                </span>
                                            </div>
                                            <div className="cat-progress-track">
                                                <div 
                                                    className="cat-progress-bar" 
                                                    style={{ 
                                                        width: `${Math.min(100, Math.max(10, marginPercent))}%`,
                                                        background: isHigh ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)'
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="cat-footer-meta">
                                                <span>Revenue: ₹{cat.revenue.toLocaleString('en-IN')}</span>
                                                <span style={{ color: '#10b981', fontWeight: '600' }}>Profit: +₹{cat.profit.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Payment Breakdown */}
                            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Payment Method Split
                                </span>
                                <div className="payment-split-grid">
                                    {Object.entries(paymentStatsMap).map(([method, data]) => (
                                        <div className="payment-split-card" key={method}>
                                            <div className="payment-split-title">{method}</div>
                                            <div className="payment-split-amount">₹{data.revenue.toLocaleString('en-IN')}</div>
                                            <div className="payment-split-orders">{data.count} order{data.count !== 1 ? 's' : ''}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Product-Level Profit Margin Leaderboard */}
                    <div className="analytics-chart-panel" style={{ marginTop: '20px' }}>
                        <div className="panel-header-row">
                            <h4>Product Profitability & Margins Leaderboard</h4>
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Ranked by total profit generated</span>
                        </div>

                        <div className="responsive-table-wrapper" style={{ margin: 0 }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Selling Price</th>
                                        <th>Cost Price</th>
                                        <th>Unit Margin</th>
                                        <th>Units Sold</th>
                                        <th>Gross Revenue</th>
                                        <th>Net Profit</th>
                                        <th>Margin Health</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productLeaderboard.map(p => {
                                        const unitProfit = p.price - p.costPrice;
                                        const marginPct = p.price > 0 ? ((unitProfit / p.price) * 100).toFixed(1) : 0;
                                        const isHigh = Number(marginPct) >= 50;
                                        const isMed = Number(marginPct) >= 30 && Number(marginPct) < 50;

                                        return (
                                            <tr key={p.id}>
                                                <td className="bold-td" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <img 
                                                        src={p.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100'} 
                                                        alt={p.title} 
                                                        style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }} 
                                                    />
                                                    <span>{p.title}</span>
                                                </td>
                                                <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                                                <td>₹{p.price}</td>
                                                <td>₹{p.costPrice || 0}</td>
                                                <td style={{ color: unitProfit >= 0 ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                                                    ₹{unitProfit} ({marginPct}%)
                                                </td>
                                                <td className="bold-td">{p.unitsSold} pcs</td>
                                                <td>₹{p.totalRevenue.toLocaleString('en-IN')}</td>
                                                <td style={{ color: '#10b981', fontWeight: '800' }}>
                                                    ₹{p.totalProfit.toLocaleString('en-IN')}
                                                </td>
                                                <td>
                                                    <span className={`margin-badge-tag ${isHigh ? 'high-margin' : isMed ? 'med-margin' : 'low-margin'}`}>
                                                        {isHigh ? '🟢 High Margin' : isMed ? '🟡 Good Margin' : '🔴 Low Margin'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

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

                                    <div className="form-group-row four-col-pricing">
                                        <div className="form-field">
                                            <label style={{ color: 'var(--primary)', fontWeight: '700' }}>Sale Price (₹) * <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>[വിൽക്കുന്ന വില]</span></label>
                                            <input 
                                                type="number" 
                                                required 
                                                value={prodPrice} 
                                                onChange={e => handleSellingPriceChange(e.target.value)} 
                                                placeholder="e.g. 499"
                                                style={{ borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.05)' }}
                                            />
                                            <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Customer selling price</small>
                                        </div>
                                        <div className="form-field">
                                            <label style={{ fontWeight: '700' }}>Buy Price / Cost (₹) <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>[വാങ്ങിയ റേറ്റ്]</span></label>
                                            <input 
                                                type="number" 
                                                value={prodCostPrice} 
                                                onChange={e => handleCostPriceChange(e.target.value)} 
                                                placeholder="e.g. 250"
                                            />
                                            <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Wholesale purchase cost</small>
                                        </div>
                                        <div className="form-field highlight-margin-field">
                                            <label style={{ color: '#10b981', fontWeight: '700' }}>Profit Margin (₹) <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'normal' }}>[ലാഭം]</span></label>
                                            <input 
                                                type="number" 
                                                value={prodMarginAmount} 
                                                onChange={e => handleMarginAmountChange(e.target.value)} 
                                                placeholder="e.g. 249"
                                                style={{ borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.08)' }}
                                            />
                                            <small style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>Auto: Sale - Buy</small>
                                        </div>
                                        <div className="form-field">
                                            <label>Original / MRP (₹)</label>
                                            <input 
                                                type="number" 
                                                value={prodOriginalPrice} 
                                                onChange={e => setProdOriginalPrice(e.target.value)} 
                                                placeholder="e.g. 999"
                                            />
                                            <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Strikethrough MRP</small>
                                        </div>
                                    </div>
                                    {prodPrice && (
                                        <div className="pricing-calc-badge-row">
                                            <span className="calc-summary-pill">
                                                Sale: <strong style={{ color: 'var(--primary)' }}>₹{prodPrice}</strong> - Buy: ₹{prodCostPrice || 0} = Profit: <strong style={{ color: '#10b981' }}>₹{prodMarginAmount || 0}</strong>
                                            </span>
                                            <span className={`margin-badge-tag ${(Number(prodPrice) - Number(prodCostPrice || 0)) >= 0 ? 'high-margin' : 'low-margin'}`}>
                                                Margin %: {prodPrice > 0 ? Math.round(((Number(prodPrice) - Number(prodCostPrice || 0)) / Number(prodPrice)) * 100) : 0}%
                                            </span>
                                        </div>
                                    )}

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

                    {/* Products list Table (Desktop / Tablet) */}
                    <div className="responsive-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Sale Price</th>
                                    <th>Buy Price</th>
                                    <th>Profit Margin & Edit</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(prod => {
                                    const cost = Number(prod.costPrice) || 0;
                                    const price = Number(prod.price) || 0;
                                    const margin = price - cost;
                                    const marginPct = price > 0 ? Math.round((margin / price) * 100) : 0;
                                    const isQuickEditing = quickEditingMarginId === prod.id;
                                    return (
                                        <tr key={prod.id}>
                                            <td>
                                                <img src={prod.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%230f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23475569" font-family="sans-serif" font-size="14" font-weight="bold">NO IMAGE</text></svg>'} alt={prod.title} className="table-thumbnail" />
                                            </td>
                                            <td className="bold-td">{prod.title}</td>
                                            <td>{prod.category}</td>
                                            <td className="bold-td" style={{ color: 'var(--primary)' }}>₹{prod.price}</td>
                                            <td style={{ color: '#94a3b8' }}>₹{cost}</td>
                                            <td>
                                                {isQuickEditing ? (
                                                    <div className="quick-margin-editor-box">
                                                        <div className="quick-margin-row">
                                                            <span className="quick-margin-lbl" title="Sale Price to Customer">Sale Price:</span>
                                                            <div className="quick-margin-input-wrap">
                                                                <span className="currency-prefix">₹</span>
                                                                <input 
                                                                    type="number"
                                                                    min="0"
                                                                    step="any"
                                                                    value={quickSalePriceVal}
                                                                    onChange={(e) => handleQuickSalePriceChange(e.target.value)}
                                                                    className="quick-margin-inp"
                                                                    placeholder="e.g. 499"
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="quick-margin-row">
                                                            <span className="quick-margin-lbl" title="Wholesale Purchase Cost">Buy Price:</span>
                                                            <div className="quick-margin-input-wrap">
                                                                <span className="currency-prefix">₹</span>
                                                                <input 
                                                                    type="number"
                                                                    min="0"
                                                                    step="any"
                                                                    value={quickBuyPriceVal}
                                                                    onChange={(e) => handleQuickBuyPriceChange(e.target.value)}
                                                                    className="quick-margin-inp"
                                                                    placeholder="e.g. 250"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="quick-margin-preview-tag">
                                                            {(() => {
                                                                const s = parseFloat(quickSalePriceVal) || 0;
                                                                const b = parseFloat(quickBuyPriceVal) || 0;
                                                                const m = s - b;
                                                                const pct = s > 0 ? Math.round((m / s) * 100) : 0;
                                                                return (
                                                                    <>
                                                                        Margin: <strong style={{ color: m >= 0 ? '#10b981' : '#ef4444' }}>₹{m.toFixed(0)} ({pct}%)</strong>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="quick-margin-action-btns">
                                                            <button 
                                                                type="button" 
                                                                className="quick-margin-save-btn" 
                                                                onClick={() => handleSaveQuickMargin(prod)}
                                                            >
                                                                ✓ Save Price
                                                            </button>
                                                            <button 
                                                                type="button" 
                                                                className="quick-margin-cancel-btn" 
                                                                onClick={handleCancelQuickMargin}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="margin-display-cell">
                                                        <span className={`margin-badge-tag ${marginPct >= 40 ? 'high-margin' : marginPct >= 20 ? 'med-margin' : 'low-margin'}`}>
                                                            {margin >= 0 ? `+₹${margin} (${marginPct}%)` : `-₹${Math.abs(margin)}`}
                                                        </span>
                                                        <button 
                                                            type="button" 
                                                            className="quick-margin-toggle-btn"
                                                            title="Directly edit Sale Price and Buy Price"
                                                            onClick={() => handleStartQuickMargin(prod)}
                                                        >
                                                            ✏️ Edit Price & Margin
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
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
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Product Cards View (< 768px) */}
                    <div className="admin-mobile-cards-list">
                        {products.map(prod => {
                            const cost = Number(prod.costPrice) || 0;
                            const price = Number(prod.price) || 0;
                            const margin = price - cost;
                            const marginPct = price > 0 ? Math.round((margin / price) * 100) : 0;
                            const isQuickEditing = quickEditingMarginId === prod.id;
                            return (
                                <div key={prod.id} className="admin-mobile-card">
                                    <div className="admin-mobile-card-header">
                                        <img src={prod.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%230f172a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23475569" font-family="sans-serif" font-size="14" font-weight="bold">NO IMAGE</text></svg>'} alt={prod.title} className="admin-mobile-card-thumb" />
                                        <div className="admin-mobile-card-title-box">
                                            <div className="admin-mobile-card-title">{prod.title}</div>
                                            <div className="admin-mobile-card-cat">{prod.category}</div>
                                        </div>
                                        <span className={`status-pill ${prod.stock > 0 && prod.inStock ? 'active' : 'inactive'}`} style={{ alignSelf: 'flex-start' }}>
                                            {prod.stock > 0 && prod.inStock ? 'In Stock' : 'Out'}
                                        </span>
                                    </div>
                                    <div className="admin-mobile-grid-metrics">
                                        <div className="admin-mobile-metric-item">
                                            <span className="admin-mobile-metric-label">Sale Price</span>
                                            <span className="admin-mobile-metric-val" style={{ color: 'var(--primary)', fontWeight: '700' }}>₹{prod.price}</span>
                                        </div>
                                        <div className="admin-mobile-metric-item">
                                            <span className="admin-mobile-metric-label">Buy Price</span>
                                            <span className="admin-mobile-metric-val" style={{ color: '#94a3b8' }}>₹{cost}</span>
                                        </div>
                                        <div className="admin-mobile-metric-item" style={{ gridColumn: isQuickEditing ? '1 / -1' : 'auto' }}>
                                            <span className="admin-mobile-metric-label">Profit Margin</span>
                                            <span className="admin-mobile-metric-val">
                                                {isQuickEditing ? (
                                                    <div className="quick-margin-editor-box mobile">
                                                        <div className="quick-margin-row">
                                                            <span className="quick-margin-lbl">Sale Price (₹):</span>
                                                            <input 
                                                                type="number" 
                                                                value={quickSalePriceVal} 
                                                                onChange={(e) => handleQuickSalePriceChange(e.target.value)} 
                                                                className="quick-margin-inp"
                                                                placeholder="e.g. 499"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="quick-margin-row">
                                                            <span className="quick-margin-lbl">Buy Price (₹):</span>
                                                            <input 
                                                                type="number" 
                                                                value={quickBuyPriceVal} 
                                                                onChange={(e) => handleQuickBuyPriceChange(e.target.value)} 
                                                                className="quick-margin-inp"
                                                                placeholder="e.g. 250"
                                                            />
                                                        </div>
                                                        <div className="quick-margin-preview-tag">
                                                            {(() => {
                                                                const s = parseFloat(quickSalePriceVal) || 0;
                                                                const b = parseFloat(quickBuyPriceVal) || 0;
                                                                const m = s - b;
                                                                const pct = s > 0 ? Math.round((m / s) * 100) : 0;
                                                                return (
                                                                    <>
                                                                        Margin: <strong style={{ color: m >= 0 ? '#10b981' : '#ef4444' }}>₹{m.toFixed(0)} ({pct}%)</strong>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="quick-margin-action-btns">
                                                            <button type="button" className="quick-margin-save-btn" onClick={() => handleSaveQuickMargin(prod)}>✓ Save Price</button>
                                                            <button type="button" className="quick-margin-cancel-btn" onClick={handleCancelQuickMargin}>✕ Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                        <span className={`margin-badge-tag ${marginPct >= 40 ? 'high-margin' : marginPct >= 20 ? 'med-margin' : 'low-margin'}`}>
                                                            {margin >= 0 ? `+₹${margin} (${marginPct}%)` : `-₹${Math.abs(margin)}`}
                                                        </span>
                                                        <button 
                                                            type="button" 
                                                            className="quick-margin-toggle-btn"
                                                            onClick={() => handleStartQuickMargin(prod)}
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </span>
                                        </div>
                                        <div className="admin-mobile-metric-item">
                                            <span className="admin-mobile-metric-label">Stock Units</span>
                                            <span className="admin-mobile-metric-val">{prod.stock !== undefined ? prod.stock : 50}</span>
                                        </div>
                                    </div>
                                    <div className="admin-mobile-card-actions">
                                        {deletingProductId === prod.id ? (
                                            <>
                                                <button 
                                                    className="edit-action-btn" 
                                                    onClick={() => onDeleteProduct(prod.id)}
                                                    style={{ background: 'var(--error)', color: '#ffffff', border: '1px solid var(--error)', flex: 1, padding: '8px' }}
                                                >
                                                    Confirm Delete
                                                </button>
                                                <button 
                                                    className="delete-action-btn" 
                                                    onClick={() => setDeletingProductId(null)}
                                                    style={{ flex: 1, padding: '8px' }}
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="edit-action-btn" onClick={() => handleOpenEdit(prod)} style={{ flex: 1, padding: '8px' }}>
                                                    ✏️ Edit
                                                </button>
                                                <button className="delete-action-btn" onClick={() => setDeletingProductId(prod.id)} style={{ flex: 1, padding: '8px' }}>
                                                    🗑️ Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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
                                <option value="Confirmed">✅ Confirmed (Auto-verified)</option>
                                <option value="Payment Confirmed">Payment Confirmed</option>
                                <option value="Pending">Pending</option>
                                <option value="Order Placed">Order Placed</option>
                                <option value="Payment Not Confirmed">Payment Not Confirmed</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Cancelled by Customer">Cancelled by Customer</option>
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
                                    <th>Payment</th>
                                    <th>Total Price</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                            No matching bookings found.
                                        </td>
                                    </tr>
                                ) : (
                                    currentBookings.map(book => (
                                        <tr key={book.orderId}>
                                            <td className="bold-td highlight-order-id">
                                                <span 
                                                    className="order-id-badge" 
                                                    style={{ cursor: 'pointer', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}
                                                    onClick={() => setSelectedAdminBooking(book)}
                                                    title="Click to view full order details"
                                                >
                                                    {book.orderId}
                                                </span>
                                            </td>
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
                                            <td>
                                                {getOrderPaymentBadge(book)}
                                            </td>
                                            <td className="bold-td">₹{book.total}</td>
                                            <td>
                                                <select 
                                                    value={book.status || 'Confirmed'} 
                                                    className={`status-select-dropdown ${book.status ? book.status.toLowerCase().replace(/\s+/g, '-') : 'confirmed'}`}
                                                    onChange={e => handleUpdateStatusLocal(book.orderId, e.target.value)}
                                                >
                                                    <option value="Confirmed">✅ Confirmed</option>
                                                    <option value="Payment Confirmed">Payment Confirmed</option>
                                                    <option value="Pending">Pending</option>
                                                    <option value="Order Placed">Order Placed</option>
                                                    <option value="Payment Not Confirmed">Payment Not Confirmed</option>
                                                    <option value="Dispatched">Dispatched</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                    <option value="Cancelled by Customer">Cancelled by Customer</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Bookings Cards View (< 768px) */}
                    <div className="admin-mobile-cards-list">
                        {currentBookings.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                No matching bookings found.
                            </div>
                        ) : (
                            currentBookings.map(book => (
                                <div key={book.orderId} className="admin-mobile-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <div>
                                            <span 
                                                className="order-id-badge" 
                                                style={{ cursor: 'pointer', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}
                                                onClick={() => setSelectedAdminBooking(book)}
                                            >
                                                {book.orderId}
                                            </span>
                                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>{book.date}</div>
                                        </div>
                                        <div>
                                            {getOrderPaymentBadge(book)}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>{book.customer.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{book.customer.district || 'Kerala'}, PIN: {book.customer.pincode}</div>
                                    </div>

                                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '12.5px' }}>
                                        <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' }}>Items Ordered</div>
                                        {book.items.map((item, idx) => (
                                            <div key={idx} style={{ color: '#e2e8f0', marginBottom: '3px' }}>
                                                • {item.title} ({item.size}) x{item.quantity}
                                            </div>
                                        ))}
                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '8px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                                            <span>Total Amount:</span>
                                            <span style={{ color: 'var(--primary)', fontSize: '14px' }}>₹{book.total}</span>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Status:</label>
                                        <select 
                                            value={book.status || 'Confirmed'} 
                                            className={`status-select-dropdown ${book.status ? book.status.toLowerCase().replace(/\s+/g, '-') : 'confirmed'}`}
                                            onChange={e => handleUpdateStatusLocal(book.orderId, e.target.value)}
                                            style={{ width: '100%' }}
                                        >
                                            <option value="Confirmed">✅ Confirmed</option>
                                            <option value="Payment Confirmed">Payment Confirmed</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Order Placed">Order Placed</option>
                                            <option value="Payment Not Confirmed">Payment Not Confirmed</option>
                                            <option value="Dispatched">Dispatched</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled">Cancelled</option>
                                            <option value="Cancelled by Customer">Cancelled by Customer</option>
                                        </select>
                                    </div>

                                    <div className="admin-mobile-card-actions">
                                        <a 
                                            href={`tel:${book.customer.phone}`}
                                            className="cta-btn secondary-cta"
                                            style={{ flex: 1, padding: '8px 10px', fontSize: '12px', minHeight: 'unset', textDecoration: 'none', justifyContent: 'center' }}
                                        >
                                            📞 Call
                                        </a>
                                        <a 
                                            href={`https://wa.me/91${book.customer.whatsapp || book.customer.phone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="cta-btn primary-cta"
                                            style={{ flex: 1, padding: '8px 10px', fontSize: '12px', minHeight: 'unset', textDecoration: 'none', justifyContent: 'center', background: '#25d366', borderColor: '#25d366', color: '#fff' }}
                                        >
                                            💬 WhatsApp
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
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

                            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                                    <span>⚡ Razorpay Payment Gateway Integration</span>
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                                    Enable direct online card, UPI (GPay, PhonePe, Paytm), and NetBanking checkout for customers.
                                </p>

                                <div className="form-field toggle-field" style={{ marginBottom: '16px' }}>
                                    <div className="checkbox-wrapper">
                                        <input 
                                            type="checkbox" 
                                            id="razorpayEnabledToggle"
                                            checked={razorpayEnabled} 
                                            onChange={e => setRazorpayEnabled(e.target.checked)}
                                        />
                                        <label htmlFor="razorpayEnabledToggle" style={{ fontWeight: '700', color: razorpayEnabled ? '#10b981' : '#94a3b8' }}>
                                            {razorpayEnabled ? '✅ Razorpay Online Gateway Active' : '⚪ Razorpay Online Gateway Disabled'}
                                        </label>
                                    </div>
                                </div>

                                <div className="form-field" style={{ maxWidth: '500px' }}>
                                    <label>Razorpay Key ID</label>
                                    <input 
                                        type="text" 
                                        value={razorpayKeyId} 
                                        onChange={e => setRazorpayKeyId(e.target.value)} 
                                        placeholder="rzp_test_... or rzp_live_..."
                                    />
                                    <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                        Find this in your Razorpay Dashboard &rarr; Settings &rarr; API Keys.
                                    </small>
                                </div>

                                <div className="form-field" style={{ maxWidth: '500px' }}>
                                    <label>Razorpay Key Secret</label>
                                    <input 
                                        type="password" 
                                        value={razorpayKeySecret} 
                                        onChange={e => setRazorpayKeySecret(e.target.value)} 
                                        placeholder="Enter Razorpay Secret Key"
                                    />
                                    <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                        Kept securely on server. Used to cryptographically verify payment signatures.
                                    </small>
                                </div>

                                <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px 14px', borderRadius: '8px', maxWidth: '500px', marginTop: '10px' }}>
                                    <div style={{ color: '#60a5fa', fontWeight: '700', fontSize: '12px', marginBottom: '4px' }}>💡 Quick Setup Info</div>
                                    <div style={{ color: '#94a3b8', fontSize: '11.5px', lineHeight: '1.4' }}>
                                        When you toggle Razorpay ON, customers will see the Razorpay option at checkout. If test keys are used, test mode allows instant mock verification.
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                                    <span>🌐 Google Sign-In Integration (OAuth 2.0)</span>
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                                    Allow customers to 1-click Sign In / Sign Up with their Google account on the login page.
                                </p>

                                <div className="form-field" style={{ maxWidth: '500px' }}>
                                    <label>Google OAuth Web Client ID (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={googleClientId} 
                                        onChange={e => setGoogleClientId(e.target.value)} 
                                        placeholder="e.g. 1234567890-abcdef.apps.googleusercontent.com"
                                    />
                                    <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                        From Google Cloud Console &rarr; APIs &amp; Services &rarr; Credentials &rarr; OAuth 2.0 Client IDs.
                                    </small>
                                </div>
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

            {/* ADMIN BOOKING DETAIL MODAL */}
            {selectedAdminBooking && (
                <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) setSelectedAdminBooking(null); }} style={{ zIndex: 1200 }}>
                    <div className="modal-content admin-modal-content" style={{ maxWidth: '650px', background: '#12141c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px', overflowY: 'auto', maxHeight: '90vh' }}>
                        <button className="close-btn modal-close" onClick={() => setSelectedAdminBooking(null)}>&times;</button>
                        
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>Order Details</h2>
                            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                                Booking ID: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{selectedAdminBooking.orderId}</span>
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                            {/* Status Section */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' }}>Update Booking Status</label>
                                <select 
                                    value={selectedAdminBooking.status || 'Confirmed'} 
                                    className={`status-select-dropdown ${selectedAdminBooking.status ? selectedAdminBooking.status.toLowerCase().replace(/\s+/g, '-') : 'confirmed'}`}
                                    onChange={e => handleUpdateStatusLocal(selectedAdminBooking.orderId, e.target.value)}
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                >
                                    <option value="Confirmed">✅ Confirmed (Auto-verified)</option>
                                    <option value="Payment Confirmed">Payment Confirmed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Order Placed">Order Placed</option>
                                    <option value="Payment Not Confirmed">Payment Not Confirmed</option>
                                    <option value="Dispatched">Dispatched</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Cancelled by Customer">Cancelled by Customer</option>
                                </select>
                            </div>

                            {/* Customer & Shipping Section */}
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                                    Customer & Shipping Details
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: '#cbd5e1' }}>
                                    <div><strong>Name:</strong> {selectedAdminBooking.customer?.name}</div>
                                    <div>
                                        <strong>Phone (Calling):</strong>{' '}
                                        <a href={`tel:${selectedAdminBooking.customer?.phone}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                            {selectedAdminBooking.customer?.phone}
                                        </a>
                                    </div>
                                    <div>
                                        <strong>WhatsApp:</strong>{' '}
                                        <a href={`https://wa.me/91${selectedAdminBooking.customer?.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25d366', textDecoration: 'none', fontWeight: '600' }}>
                                            {selectedAdminBooking.customer?.whatsapp} (Chat)
                                        </a>
                                    </div>
                                    <div><strong>District:</strong> {selectedAdminBooking.customer?.district}</div>
                                    <div><strong>Pincode:</strong> {selectedAdminBooking.customer?.pincode}</div>
                                    <div style={{ marginTop: '4px', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <strong>Full Delivery Address:</strong>
                                        <p style={{ margin: '4px 0 0', color: '#94a3b8', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                                            {selectedAdminBooking.customer?.address}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Items Section */}
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                                    Items Ordered ({selectedAdminBooking.items?.reduce((sum, item) => sum + item.quantity, 0)})
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {selectedAdminBooking.items?.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', background: '#1b1e2a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {item.image ? (
                                                    <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#1e293b' }}>
                                                        <svg style={{ width: '20px', height: '20px', stroke: '#64748b', strokeWidth: 1.5, fill: 'none' }} viewBox="0 0 24 24">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                            <circle cx="8.5" cy="8.5" r="1.5"/>
                                                            <polyline points="21 15 16 10 5 21"/>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#fff' }}>{item.title}</span>
                                                <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Size: {item.size} | Qty: {item.quantity}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', fontWeight: '700', color: '#fff', fontSize: '13.5px' }}>
                                                ₹{item.price * item.quantity}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary & Metadata Section */}
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: '10px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#94a3b8' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Booking Date/Time:</span>
                                        <span style={{ color: '#fff' }}>{selectedAdminBooking.date}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <span>Payment Details:</span>
                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                                            {getOrderPaymentBadge(selectedAdminBooking)}
                                            {selectedAdminBooking.customer?.razorpayPaymentId && (
                                                <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                                                    Pay ID: {selectedAdminBooking.customer.razorpayPaymentId}
                                                </div>
                                            )}
                                            {selectedAdminBooking.customer?.razorpayOrderId && (
                                                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                                                    Order: {selectedAdminBooking.customer.razorpayOrderId}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {selectedAdminBooking.customer?.couponCode && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}>
                                            <span>Coupon Applied:</span>
                                            <span>{selectedAdminBooking.customer.couponCode}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Subtotal:</span>
                                        <span style={{ color: '#fff' }}>₹{selectedAdminBooking.subtotal || selectedAdminBooking.total - (selectedAdminBooking.delivery || 0)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Delivery Fee:</span>
                                        <span style={{ color: '#fff' }}>{selectedAdminBooking.delivery === 0 ? 'FREE' : `₹${selectedAdminBooking.delivery || 60}`}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', color: '#fff', marginTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                                        <span>Grand Total:</span>
                                        <span style={{ color: 'var(--primary)' }}>₹{selectedAdminBooking.total}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
