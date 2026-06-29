import React, { useState, useEffect } from 'react';
import { getCookie, setCookie, eraseCookie } from '../utils/cookies';

export default function DeveloperModal({ isOpen, onClose, API_BASE_URL }) {
    // Style configurations for standard dark inputs
    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        background: '#131b2e',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#ffffff',
        borderRadius: '8px',
        fontSize: '14px',
        marginTop: '6px',
        boxSizing: 'border-box'
    };

    // Auth States
    const [isLoggedIn, setIsLoggedIn] = useState(() => getCookie('isDeveloperLoggedIn') === 'true');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    // Dashboard Tab & Data States
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [systemStatus, setSystemStatus] = useState(null);
    const [loadingSystemStatus, setLoadingSystemStatus] = useState(true);
    const [systemStatusError, setSystemStatusError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingUserPhone, setDeletingUserPhone] = useState(null);
    const [blockingUserPhone, setBlockingUserPhone] = useState(null);
    const [successBanner, setSuccessBanner] = useState('');
    const [actionError, setActionError] = useState('');

    // Credentials Forms States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const [newAdminUsername, setNewAdminUsername] = useState('admin');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [adminResetError, setAdminResetError] = useState('');
    const [adminResetSuccess, setAdminResetSuccess] = useState('');

    // Fetch users list from backend
    const fetchUsers = async () => {
        try {
            const devToken = getCookie('developerSessionToken');
            if (!devToken) return;
            const response = await fetch(`${API_BASE_URL}/developer/users`, {
                headers: { 'x-developer-session': devToken }
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
            console.error('Error fetching users:', err);
        }
    };

    // Fetch login logs from backend
    const fetchLogs = async () => {
        try {
            const devToken = getCookie('developerSessionToken');
            if (!devToken) return;
            const response = await fetch(`${API_BASE_URL}/developer/logs`, {
                headers: { 'x-developer-session': devToken }
            });
            if (response.status === 401) {
                handleLogout();
                return;
            }
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
        }
    };

    // Fetch server status from backend
    const fetchSystemStatus = async () => {
        setSystemStatusError('');
        setLoadingSystemStatus(true);
        try {
            const devToken = getCookie('developerSessionToken');
            if (!devToken) {
                setLoadingSystemStatus(false);
                return;
            }
            const response = await fetch(`${API_BASE_URL}/developer/system-status`, {
                headers: { 'x-developer-session': devToken }
            });
            if (response.status === 401) {
                handleLogout();
                return;
            }
            if (response.ok) {
                const data = await response.json();
                setSystemStatus(data);
                setSystemStatusError('');
            } else {
                setSystemStatusError(`Failed to fetch system status (Server responded with status ${response.status}).`);
            }
        } catch (err) {
            console.error('Error fetching system status:', err);
            setSystemStatusError('Network error connecting to backend diagnostics.');
        } finally {
            setLoadingSystemStatus(false);
        }
    };

    // Poll data periodically when logged in and modal is open
    useEffect(() => {
        if (isLoggedIn && isOpen) {
            // Initial fetches
            fetchUsers();
            fetchLogs();
            fetchSystemStatus();

            // Setup 5-second polling interval
            const interval = setInterval(() => {
                fetchUsers();
                fetchLogs();
                fetchSystemStatus();
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [isLoggedIn, isOpen]);

    if (!isOpen) return null;

    // Login Handler
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        try {
            const response = await fetch(`${API_BASE_URL}/developer/login`, {
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
                setCookie('isDeveloperLoggedIn', 'true');
                setCookie('developerSessionToken', data.sessionToken);
                setIsLoggedIn(true);
                setLoginError('');
                setUsername('');
                setPassword('');
            } else {
                setLoginError(data.error || 'Invalid developer credentials');
            }
        } catch (err) {
            console.error('Developer login error:', err);
            setLoginError('Network error connecting to backend.');
        }
    };

    // Logout Handler
    const handleLogout = () => {
        eraseCookie('isDeveloperLoggedIn');
        eraseCookie('developerSessionToken');
        setIsLoggedIn(false);
    };

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

    // User block / unblock / delete actions
    const handleBlockUser = async (phone) => {
        try {
            const devToken = getCookie('developerSessionToken');
            const response = await fetch(`${API_BASE_URL}/admin/users/block/${phone}`, {
                method: 'POST',
                headers: { 'x-developer-session': devToken }
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

    const handleUnblockUser = async (phone) => {
        try {
            const devToken = getCookie('developerSessionToken');
            const response = await fetch(`${API_BASE_URL}/admin/users/unblock/${phone}`, {
                method: 'POST',
                headers: { 'x-developer-session': devToken }
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

    const handleDeleteUser = async (phone) => {
        try {
            const devToken = getCookie('developerSessionToken');
            const response = await fetch(`${API_BASE_URL}/admin/users/${phone}`, {
                method: 'DELETE',
                headers: { 'x-developer-session': devToken }
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

    // Dev Password Change Handler
    const handleChangeDevPasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }

        try {
            const devToken = getCookie('developerSessionToken');
            const response = await fetch(`${API_BASE_URL}/developer/change-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-developer-session': devToken
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await response.json();
            if (response.ok) {
                setPasswordSuccess('Developer password changed successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setPasswordError(data.error || 'Failed to change password.');
            }
        } catch (err) {
            console.error('Dev password change error:', err);
            setPasswordError('Network error changing developer password.');
        }
    };

    // Admin Credentials Overwrite/Reset Handler
    const handleResetAdminPasswordSubmit = async (e) => {
        e.preventDefault();
        setAdminResetError('');
        setAdminResetSuccess('');

        try {
            const devToken = getCookie('developerSessionToken');
            const response = await fetch(`${API_BASE_URL}/developer/change-admin-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-developer-session': devToken
                },
                body: JSON.stringify({ newAdminUsername, newAdminPassword })
            });
            const data = await response.json();
            if (response.ok) {
                setAdminResetSuccess('Admin credentials override succeeded!');
                setNewAdminPassword('');
            } else {
                setAdminResetError(data.error || 'Failed to reset admin credentials.');
            }
        } catch (err) {
            console.error('Admin reset error:', err);
            setAdminResetError('Network error resetting admin credentials.');
        }
    };

    // Helper status checks
    const getUserStatus = (user) => {
        if (user.isBlocked) return { label: 'Blocked', class: 'inactive' };
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const remainingMins = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return { label: `Locked (${remainingMins}m)`, class: 'pending' };
        }
        return { label: 'Active', class: 'active' };
    };

    // Helper to format date
    const formatDateTime = (timestamp) => {
        if (!timestamp) return 'N/A';
        const d = new Date(timestamp);
        return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    };

    // Search query filter
    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.phone.includes(searchQuery)
    );

    // Compute Stats
    const totalUsersCount = users.length;
    const blockedUsersCount = users.filter(u => u.isBlocked).length;
    const lockedUsersCount = users.filter(u => u.lockUntil && u.lockUntil > Date.now() && !u.isBlocked).length;

    // SCREEN 1: LOGIN PAGE
    if (!isLoggedIn) {
        return (
            <div className="admin-login-wrapper" style={{ zIndex: 1050 }}>
                <div className="admin-login-card" style={{ background: '#090d16', border: '1px solid rgba(6,182,212,0.3)', boxShadow: '0 0 30px rgba(6,182,212,0.15)', maxWidth: '440px', width: '90%' }}>
                    <div className="login-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                            <svg viewBox="0 0 24 24" style={{ width: '32px', height: '32px', fill: '#06b6d4' }}>
                                <path d="M12.89 3C8.5 3 4.93 6.57 4.93 11c0 1.25.32 2.43.85 3.47L3 21l6.73-1.89c.98.47 2.08.77 3.27.77 4.39 0 7.93-3.57 7.93-8s-3.54-8-8.04-8zm-5.06 7.6c0-1.88 1.54-3.4 3.4-3.4s3.4 1.52 3.4 3.4c0 1.88-1.54 3.4-3.4 3.4s-3.4-1.52-3.4-3.4zm8.8 6.54c-.66.86-1.53 1.4-2.58 1.62-.25.05-.51-.12-.56-.37-.05-.25.12-.51.37-.56.81-.17 1.48-.59 1.98-1.25.15-.2.43-.24.63-.09.2.15.24.43.1.65H16.63z" />
                            </svg>
                            <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>Developer Hub</h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Authorize credentials to access the master database console</p>
                    </div>
                    <form onSubmit={handleLoginSubmit} className="admin-login-form" style={{ marginTop: '20px' }}>
                        <div className="form-field">
                            <label htmlFor="dev-username" style={{ color: '#94a3b8' }}>Developer Username</label>
                            <input
                                id="dev-username"
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Enter dev username"
                                style={inputStyle}
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="dev-password" style={{ color: '#94a3b8' }}>Developer Password</label>
                            <input
                                id="dev-password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter dev password"
                                style={inputStyle}
                                required
                            />
                        </div>
                        {loginError && <div className="login-error-msg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>{loginError}</div>}
                        <button type="submit" className="cta-btn primary-cta login-submit-btn" style={{ background: '#06b6d4', color: '#090d16', fontWeight: 'bold' }}>
                            Authenticate Access
                        </button>
                        <button type="button" className="cta-btn secondary-cta login-cancel-btn" onClick={onClose} style={{ marginTop: '10px', width: '100%', borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                            Return to Store
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // SCREEN 2: DEV PANEL DASHBOARD
    return (
        <div className="admin-dashboard-container container" style={{ minHeight: '100vh', background: '#05070c', color: '#cbd5e1', paddingTop: '30px', paddingBottom: '50px' }}>
            {/* Header Area */}
            <div className="admin-header-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ fontSize: '28px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontWeight: '900' }}>
                        <span style={{ color: '#06b6d4' }}>&lt;/&gt;</span> Developer Master Console
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>Manage credentials bypass, lockout rules, and system database entries.</p>
                </div>
                <div className="admin-header-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button className="cta-btn secondary-cta" onClick={handleLogout} style={{ borderColor: '#ef4444', color: '#ef4444', background: 'transparent' }}>
                        Revoke Token (Logout)
                    </button>
                    <button className="cta-btn secondary-cta" onClick={onClose} style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#cbd5e1' }}>
                        Return to Store
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '30px' }}>
                <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Registered Users</span>
                    <h3 style={{ fontSize: '32px', color: '#ffffff', margin: '8px 0 0', fontWeight: '800' }}>{totalUsersCount}</h3>
                </div>
                <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Currently Locked Users</span>
                    <h3 style={{ fontSize: '32px', color: '#f59e0b', margin: '8px 0 0', fontWeight: '800' }}>{lockedUsersCount}</h3>
                </div>
                <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Permanently Blocked</span>
                    <h3 style={{ fontSize: '32px', color: '#ef4444', margin: '8px 0 0', fontWeight: '800' }}>{blockedUsersCount}</h3>
                </div>
            </div>

            {/* Inline CSS for responsive tab visibility */}
            <style>{`
                @media (max-width: 992px) {
                    .desktop-only-tabs {
                        display: none !important;
                    }
                    .mobile-only-tabs {
                        display: block !important;
                    }
                }
                @media (min-width: 993px) {
                    .desktop-only-tabs {
                        display: flex !important;
                    }
                    .mobile-only-tabs {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Dashboard Tabs Toggle (Desktop view) */}
            <div className="admin-tabs-row desktop-only-tabs" style={{ 
                marginBottom: '24px', 
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                flexWrap: 'nowrap',
                scrollbarWidth: 'none'
            }}>
                <button 
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                    style={{ background: 'none', border: 'none', borderBottom: activeTab === 'users' ? '3px solid #06b6d4' : '3px solid transparent', color: activeTab === 'users' ? '#ffffff' : '#64748b', padding: '10px 20px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                >
                    Customer Database Logs
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('logs')}
                    style={{ background: 'none', border: 'none', borderBottom: activeTab === 'logs' ? '3px solid #06b6d4' : '3px solid transparent', color: activeTab === 'logs' ? '#ffffff' : '#64748b', padding: '10px 20px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                >
                    Customer Login History
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
                    onClick={() => setActiveTab('system')}
                    style={{ background: 'none', border: 'none', borderBottom: activeTab === 'system' ? '3px solid #06b6d4' : '3px solid transparent', color: activeTab === 'system' ? '#ffffff' : '#64748b', padding: '10px 20px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                >
                    Server Health & RAM Status
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'credentials' ? 'active' : ''}`}
                    onClick={() => setActiveTab('credentials')}
                    style={{ background: 'none', border: 'none', borderBottom: activeTab === 'credentials' ? '3px solid #06b6d4' : '3px solid transparent', color: activeTab === 'credentials' ? '#ffffff' : '#64748b', padding: '10px 20px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                >
                    Credentials Bypass Override
                </button>
            </div>

            {/* Mobile Dropdown Tab Selector (Mobile view) */}
            <div className="mobile-only-tabs" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Select Dashboard View</label>
                <select 
                    value={activeTab} 
                    onChange={e => setActiveTab(e.target.value)}
                    style={{ 
                        width: '100%', 
                        padding: '12px 16px', 
                        background: '#090d16', 
                        border: '1px solid rgba(6,182,212,0.3)', 
                        color: '#ffffff', 
                        borderRadius: '8px', 
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 0 10px rgba(6,182,212,0.1)',
                        cursor: 'pointer'
                    }}
                >
                    <option value="users">👤 Customer Database Logs</option>
                    <option value="logs">📜 Customer Login History</option>
                    <option value="system">🖥️ Server Health & RAM Status</option>
                    <option value="credentials">🔑 Credentials Bypass Override</option>
                </select>
            </div>

            {/* TAB CONTENT: USERS MANAGEMENT */}
            {activeTab === 'users' && (
                <div className="admin-tab-content">
                    <div className="tab-filters-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
                        <div className="search-box-wrapper" style={{ flex: 1, maxWidth: '400px' }}>
                            <input 
                                type="text" 
                                placeholder="Search by name, phone number..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="admin-search-input"
                                style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '8px', padding: '10px 16px' }}
                            />
                        </div>
                        <button 
                            className="cta-btn secondary-cta" 
                            onClick={fetchUsers} 
                            style={{ width: 'auto', minHeight: 'unset', padding: '10px 18px', fontSize: '13px', borderColor: 'rgba(255,255,255,0.08)' }}
                        >
                            🔄 Refresh Database Logs
                        </button>
                    </div>

                    {successBanner && (
                        <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
                            ✅ {successBanner}
                        </div>
                    )}

                    {actionError && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
                            ⚠️ {actionError}
                        </div>
                    )}

                    <div className="responsive-table-wrapper" style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%' }}>
                        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#121929', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#fff' }}>Customer Details</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#fff' }}>Phone / Login Contact</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#fff' }}>Failed Login Attempts</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#fff' }}>Status Pill</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#fff' }}>Security Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No customer accounts matching query found in database.</td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(u => {
                                        const status = getUserStatus(u);
                                        return (
                                            <tr key={u.phone} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background-color 0.2s' }}>
                                                <td className="bold-td" style={{ padding: '16px', fontWeight: '700', color: '#ffffff' }}>
                                                    <div>{u.name}</div>
                                                    {u.isBlocked && u.blockedAt ? (
                                                        <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 'normal', marginTop: '4px' }}>
                                                            🚫 Blocked: {formatDateTime(u.blockedAt)}
                                                        </div>
                                                    ) : u.lastActiveAt ? (
                                                        <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'normal', marginTop: '4px' }}>
                                                            🟢 Active: {formatDateTime(u.lastActiveAt)}
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal', marginTop: '4px' }}>
                                                            ⚪ No session history
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px' }}>{u.phone}</td>
                                                <td style={{ padding: '16px', fontWeight: '600' }}>
                                                    <span style={{ color: u.loginAttempts >= 5 ? '#f59e0b' : 'inherit' }}>
                                                        {u.loginAttempts || 0}
                                                    </span> / 7 limit
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span className={`status-pill ${status.class}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    {deletingUserPhone === u.phone ? (
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <button 
                                                                className="cta-btn primary-cta" 
                                                                onClick={() => handleDeleteUser(u.phone)}
                                                                style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'unset', width: 'auto', background: '#ef4444', color: '#ffffff', borderColor: '#ef4444' }}
                                                            >
                                                                Confirm Delete
                                                            </button>
                                                            <button 
                                                                className="cta-btn secondary-cta" 
                                                                onClick={() => setDeletingUserPhone(null)}
                                                                style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'unset', width: 'auto', borderColor: 'rgba(255,255,255,0.15)', color: '#94a3b8', background: 'transparent' }}
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
                                                                style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'unset', width: 'auto', borderColor: 'rgba(255,255,255,0.15)', color: '#94a3b8', background: 'transparent' }}
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
                                                                    Force Unblock
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    className="cta-btn secondary-cta" 
                                                                    onClick={() => setBlockingUserPhone(u.phone)}
                                                                    style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'unset', width: 'auto', borderColor: '#f59e0b', color: '#f59e0b', background: 'transparent' }}
                                                                >
                                                                    Force Block
                                                                </button>
                                                            )}
                                                            <button 
                                                                className="cta-btn secondary-cta" 
                                                                onClick={() => setDeletingUserPhone(u.phone)}
                                                                style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'unset', width: 'auto', borderColor: '#ef4444', color: '#ef4444', background: 'transparent' }}
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

            {/* TAB CONTENT: CUSTOMER LOGIN HISTORY */}
            {activeTab === 'logs' && (
                <div className="admin-tab-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ color: '#ffffff', margin: 0 }}>Recent Authentication Log Entries</h3>
                        <button className="cta-btn secondary-cta" onClick={fetchLogs} style={{ width: 'auto', minHeight: 'unset', padding: '10px 18px', fontSize: '13px', borderColor: 'rgba(255,255,255,0.08)' }}>
                            🔄 Refresh Login History
                        </button>
                    </div>

                    <div className="responsive-table-wrapper" style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#121929', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#fff' }}>Login Time</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#fff' }}>Customer Name</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#fff' }}>Phone Contact</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#fff' }}>Auth Status</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#fff' }}>IP Address</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#fff' }}>User Agent / Browser</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No authentication history logs registered in database yet.</td>
                                    </tr>
                                ) : (
                                    logs.map((log, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '16px', fontWeight: '600', color: '#fff' }}>{formatDateTime(log.timestamp)}</td>
                                            <td style={{ padding: '16px' }}>{log.name || 'Unknown'}</td>
                                            <td style={{ padding: '16px' }}>{log.phone}</td>
                                            <td style={{ padding: '16px' }}>
                                                <span className={`status-pill ${log.status === 'success' ? 'active' : 'inactive'}`} style={{ textTransform: 'capitalize' }}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '12px' }}>{log.ip || 'Unknown'}</td>
                                            <td style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.userAgent}>
                                                {log.userAgent || 'Unknown'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: SERVER HEALTH & RAM STATUS */}
            {activeTab === 'system' && (
                <div className="admin-tab-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ color: '#ffffff', margin: 0 }}>Render Engine Diagnostics</h3>
                        <button className="cta-btn secondary-cta" onClick={fetchSystemStatus} style={{ width: 'auto', minHeight: 'unset', padding: '10px 18px', fontSize: '13px', borderColor: 'rgba(255,255,255,0.08)' }}>
                            🔄 Refresh Diagnostics
                        </button>
                    </div>

                    {loadingSystemStatus ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            ⏳ Fetching diagnostics data from Render backend engine...
                        </div>
                    ) : systemStatusError ? (
                        <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '20px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                            ⚠️ {systemStatusError}
                            <p style={{ fontSize: '13px', fontWeight: 'normal', color: '#fca5a5', margin: '10px 0 0' }}>
                                Please verify that your backend server is online and running the latest code version.
                            </p>
                        </div>
                    ) : systemStatus ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                            {/* DB Status & Fallback Alert */}
                            <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                <h4 style={{ color: '#fff', margin: '0 0 16px' }}>Database Connectivity</h4>
                                {systemStatus.useMongo ? (
                                    <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            🟢 MongoDB Atlas Connection Active
                                        </div>
                                        <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#a7f3d0', lineHeight: '1.5' }}>
                                            The server is successfully writing and fetching storefront data from the Cloud Database cluster. Local JSON database fallbacks are offline.
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            🔴 MongoDB Atlas Offline: Falling Back to Local JSON
                                        </div>
                                        <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#fca5a5', lineHeight: '1.5' }}>
                                            CRITICAL: The backend MongoDB Atlas database connection failed. Server is currently writing data locally to backend JSON files.
                                        </p>
                                    </div>
                                )}
                                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                                    {systemStatus.useMongo && (
                                        <div style={{ marginTop: '0px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span>MongoDB Cloud Storage:</span>
                                                <span style={{ fontWeight: 'bold', color: '#fff' }}>{systemStatus.mongoStorageUsedMB} MB / {systemStatus.mongoStorageLimit} MB</span>
                                            </div>
                                            <div style={{ width: '100%', height: '10px', background: '#1e293b', borderRadius: '5px', overflow: 'hidden' }}>
                                                <div style={{ 
                                                    width: `${Math.min(100, (systemStatus.mongoStorageUsedMB / systemStatus.mongoStorageLimit) * 100)}%`, 
                                                    height: '100%', 
                                                    background: systemStatus.mongoStorageUsedMB > 400 ? '#ef4444' : systemStatus.mongoStorageUsedMB > 300 ? '#f59e0b' : '#10b981',
                                                    transition: 'width 0.3s ease-out'
                                                }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RAM & Memory Diagnostics */}
                            <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                <h4 style={{ color: '#fff', margin: '0 0 16px' }}>Render 512MB RAM Usage</h4>
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
                                        <span>Allocated Memory Usage (RSS):</span>
                                        <span style={{ fontWeight: 'bold', color: '#fff' }}>{systemStatus.ramTotal} MB / 512 MB</span>
                                    </div>
                                    <div style={{ width: '100%', height: '12px', background: '#1e293b', borderRadius: '6px', overflow: 'hidden' }}>
                                        <div style={{ 
                                            width: `${Math.min(100, (systemStatus.ramTotal / 512) * 100)}%`, 
                                            height: '100%', 
                                            background: systemStatus.ramTotal > 400 ? '#ef4444' : systemStatus.ramTotal > 300 ? '#f59e0b' : '#06b6d4',
                                            transition: 'width 0.3s ease-out'
                                        }} />
                                    </div>
                                </div>
                                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span>JS Heap Memory Used:</span>
                                        <span style={{ color: '#fff' }}>{systemStatus.ramUsed} MB</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span>Server Uptime:</span>
                                        <span style={{ color: '#fff' }}>{Math.floor(systemStatus.uptime / 3600)}h {Math.floor((systemStatus.uptime % 3600) / 60)}m {Math.floor(systemStatus.uptime % 60)}s</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span>Node JS Version:</span>
                                        <span style={{ color: '#fff' }}>{systemStatus.nodeVersion}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Platform Environment:</span>
                                        <span style={{ color: '#fff', textTransform: 'capitalize' }}>{systemStatus.platform}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {/* TAB CONTENT: CREDENTIALS BYPASS OVERRIDE */}
            {activeTab === 'credentials' && (
                <div className="admin-tab-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
                    
                    {/* Reset Admin Credentials */}
                    <div className="settings-card" style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '800', marginTop: 0, marginBottom: '8px' }}>Force Reset Admin Credentials</h3>
                        <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
                            Overwrite the administrator portal username and password immediately. This bypasses the current admin settings.
                        </p>

                        <form onSubmit={handleResetAdminPasswordSubmit} className="admin-settings-form">
                            <div className="form-field" style={{ marginBottom: '16px' }}>
                                <label style={{ color: '#94a3b8' }}>New Admin Username *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newAdminUsername} 
                                    onChange={e => setNewAdminUsername(e.target.value)} 
                                    placeholder="Enter new admin username"
                                    style={inputStyle}
                                />
                            </div>

                            <div className="form-field">
                                <label style={{ color: '#94a3b8' }}>New Admin Password *</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={newAdminPassword} 
                                    onChange={e => setNewAdminPassword(e.target.value)} 
                                    placeholder="Enter new admin password"
                                    style={inputStyle}
                                />
                            </div>

                            {adminResetError && (
                                <div className="validation-err" style={{ display: 'block', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginTop: '14px' }}>
                                    {adminResetError}
                                </div>
                            )}

                            {adminResetSuccess && (
                                <div className="validation-success" style={{ display: 'block', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginTop: '14px', fontWeight: 'bold' }}>
                                    {adminResetSuccess}
                                </div>
                            )}

                            <button type="submit" className="cta-btn primary-cta" style={{ marginTop: '20px', background: '#06b6d4', color: '#090d16', fontWeight: 'bold' }}>
                                Overwrite Admin Credentials
                            </button>
                        </form>
                    </div>

                    {/* Change Developer Credentials */}
                    <div className="settings-card" style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '800', marginTop: 0, marginBottom: '8px' }}>Change Developer Password</h3>
                        <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
                            Update the credentials used to authenticate this master developer console panel interface.
                        </p>

                        <form onSubmit={handleChangeDevPasswordSubmit} className="admin-settings-form">
                            <div className="form-field">
                                <label style={{ color: '#94a3b8' }}>Current Developer Password *</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={currentPassword} 
                                    onChange={e => setCurrentPassword(e.target.value)} 
                                    placeholder="Verify current password"
                                    style={inputStyle}
                                />
                            </div>

                            <div className="form-field">
                                <label style={{ color: '#94a3b8' }}>New Developer Password *</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={newPassword} 
                                    onChange={e => setNewPassword(e.target.value)} 
                                    placeholder="Enter new password"
                                    style={inputStyle}
                                />
                            </div>

                            <div className="form-field">
                                <label style={{ color: '#94a3b8' }}>Confirm New Developer Password *</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={confirmPassword} 
                                    onChange={e => setConfirmPassword(e.target.value)} 
                                    placeholder="Confirm new password"
                                    style={inputStyle}
                                />
                            </div>

                            {passwordError && (
                                <div className="validation-err" style={{ display: 'block', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginTop: '14px' }}>
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="validation-success" style={{ display: 'block', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginTop: '14px', fontWeight: 'bold' }}>
                                    {passwordSuccess}
                                </div>
                            )}

                            <button type="submit" className="cta-btn primary-cta" style={{ marginTop: '20px', background: '#06b6d4', color: '#090d16', fontWeight: 'bold' }}>
                                Update Developer Password
                            </button>
                        </form>
                    </div>

                </div>
            )}
        </div>
    );
}
