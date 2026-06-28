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
    const [searchQuery, setSearchQuery] = useState('');

    // Credentials Forms States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [adminResetError, setAdminResetError] = useState('');
    const [adminResetSuccess, setAdminResetSuccess] = useState('');

    // Fetch users list from backend
    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/developer/users`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                console.error('Failed to fetch developer users list');
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    // Poll users every 5 seconds when logged in for real-time attempt logs/lockout statuses
    useEffect(() => {
        if (isLoggedIn && isOpen) {
            fetchUsers();
            const interval = setInterval(fetchUsers, 5000);
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
            const data = await response.json();
            if (response.ok && data.success) {
                setCookie('isDeveloperLoggedIn', 'true');
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
        setIsLoggedIn(false);
    };

    // User block / unblock actions
    const handleBlockUser = async (phone) => {
        if (!window.confirm(`Are you sure you want to block this user (${phone})?`)) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/block/${phone}`, {
                method: 'POST'
            });
            if (response.ok) {
                setUsers(users.map(u => u.phone === phone ? { ...u, isBlocked: true } : u));
                alert('User blocked successfully!');
            } else {
                alert('Failed to block user.');
            }
        } catch (err) {
            console.error('Block error:', err);
        }
    };

    const handleUnblockUser = async (phone) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/unblock/${phone}`, {
                method: 'POST'
            });
            if (response.ok) {
                setUsers(users.map(u => u.phone === phone ? { ...u, isBlocked: false, loginAttempts: 0, lockUntil: 0 } : u));
                alert('User unblocked successfully!');
            } else {
                alert('Failed to unblock user.');
            }
        } catch (err) {
            console.error('Unblock error:', err);
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
            const response = await fetch(`${API_BASE_URL}/developer/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    // Admin Password Overwrite/Reset Handler
    const handleResetAdminPasswordSubmit = async (e) => {
        e.preventDefault();
        setAdminResetError('');
        setAdminResetSuccess('');

        try {
            const response = await fetch(`${API_BASE_URL}/developer/change-admin-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newAdminPassword })
            });
            const data = await response.json();
            if (response.ok) {
                setAdminResetSuccess('Admin password reset successfully!');
                setNewAdminPassword('');
            } else {
                setAdminResetError(data.error || 'Failed to reset admin password.');
            }
        } catch (err) {
            console.error('Admin reset error:', err);
            setAdminResetError('Network error resetting admin password.');
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

            {/* Dashboard Tabs Toggle */}
            <div className="admin-tabs-row" style={{ 
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
                    className={`tab-btn ${activeTab === 'credentials' ? 'active' : ''}`}
                    onClick={() => setActiveTab('credentials')}
                    style={{ background: 'none', border: 'none', borderBottom: activeTab === 'credentials' ? '3px solid #06b6d4' : '3px solid transparent', color: activeTab === 'credentials' ? '#ffffff' : '#64748b', padding: '10px 20px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                >
                    Credentials Bypass Override
                </button>
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
                                                <td className="bold-td" style={{ padding: '16px', fontWeight: '700', color: '#ffffff' }}>{u.name}</td>
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
                                                    {(u.isBlocked || (u.lockUntil && u.lockUntil > Date.now())) ? (
                                                        <button 
                                                            className="cta-btn primary-cta" 
                                                            onClick={() => handleUnblockUser(u.phone)}
                                                            style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'unset', width: 'auto', background: '#10b981', color: '#ffffff' }}
                                                        >
                                                            Force Unblock
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            className="cta-btn secondary-cta" 
                                                            onClick={() => handleBlockUser(u.phone)}
                                                            style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'unset', width: 'auto', borderColor: '#ef4444', color: '#ef4444', background: 'transparent' }}
                                                        >
                                                            Force Block
                                                        </button>
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

            {/* TAB CONTENT: CREDENTIALS BYPASS OVERRIDE */}
            {activeTab === 'credentials' && (
                <div className="admin-tab-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
                    
                    {/* Reset Admin Credentials */}
                    <div className="settings-card" style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '800', marginTop: 0, marginBottom: '8px' }}>Force Reset Admin Password</h3>
                        <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
                            Overwrite the administrator portal password immediately. This bypasses the current admin password and does not require verification of the previous password.
                        </p>

                        <form onSubmit={handleResetAdminPasswordSubmit} className="admin-settings-form">
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
                                Overwrite Admin Password
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
