import React, { useState } from 'react';

export default function AddressManagementPage({
    user,
    onNavigate
}) {
    const [addresses, setAddresses] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('netrave_addresses'));
            if (saved && saved.length > 0) return saved;
        } catch {}
        return [
            {
                id: 1,
                name: user?.name || "Arjun K K",
                phone: user?.phone || "+91 98954 45210",
                pincode: "673525",
                street: "Door No 4B, Emerald Green Residency, High School Road",
                city: "Perambra, Kozhikode",
                state: "Kerala",
                type: "Home",
                isDefault: true
            },
            {
                id: 2,
                name: user?.name || "Arjun K K",
                phone: user?.phone || "+91 98954 45210",
                pincode: "673016",
                street: "Netrave Studio, 2nd Floor, Cyberpark Calicut, Nellikode",
                city: "Kozhikode",
                state: "Kerala",
                type: "Work",
                isDefault: false
            }
        ];
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const saveAddressesToStorage = (list) => {
        setAddresses(list);
        try {
            localStorage.setItem('netrave_addresses', JSON.stringify(list));
        } catch {}
    };

    const handleSetDefault = (id) => {
        const updated = addresses.map(a => ({
            ...a,
            isDefault: a.id === id
        }));
        saveAddressesToStorage(updated);
    };

    const handleDelete = (id) => {
        const updated = addresses.filter(a => a.id !== id);
        saveAddressesToStorage(updated);
    };

    const handleStartAdd = () => {
        setEditingAddress({
            id: Date.now(),
            name: user?.name || '',
            phone: user?.phone || '',
            pincode: '',
            street: '',
            city: '',
            state: 'Kerala',
            type: 'Home',
            isDefault: addresses.length === 0
        });
        setIsEditing(true);
    };

    const handleStartEdit = (addr) => {
        setEditingAddress({ ...addr });
        setIsEditing(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const exists = addresses.find(a => a.id === editingAddress.id);
        let updated;
        if (exists) {
            updated = addresses.map(a => a.id === editingAddress.id ? editingAddress : a);
        } else {
            updated = [...addresses, editingAddress];
        }
        saveAddressesToStorage(updated);
        setIsEditing(false);
        setEditingAddress(null);
    };

    return (
        <div className="netrave-page-wrapper address-page-root">
            <div className="netrave-container">
                <div className="breadcrumb-nav" style={{ padding: '16px 0 8px' }}>
                    <button type="button" className="breadcrumb-link" onClick={() => onNavigate && onNavigate('home')}>Home</button>
                    <span className="breadcrumb-sep">/</span>
                    <button type="button" className="breadcrumb-link" onClick={() => onNavigate && onNavigate('account')}>My Account</button>
                    <span className="breadcrumb-sep">/</span>
                    <span className="breadcrumb-current">Address Management</span>
                </div>

                <div className="address-header-row">
                    <div>
                        <h1 className="page-title-heading">Saved Addresses</h1>
                        <p className="page-subtitle">Manage delivery locations for quick checkout</p>
                    </div>
                    {!isEditing && (
                        <button type="button" className="btn-primary-yellow" onClick={handleStartAdd}>
                            + Add New Address
                        </button>
                    )}
                </div>

                {/* Edit / Add Modal Form */}
                {isEditing && (
                    <div className="address-form-card">
                        <h2 className="address-form-title">
                            {addresses.find(a => a.id === editingAddress.id) ? 'Edit Address' : 'Add New Address'}
                        </h2>
                        <form onSubmit={handleFormSubmit} className="account-form-grid">
                            <div className="form-group">
                                <label>Recipient Full Name *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={editingAddress.name}
                                    onChange={(e) => setEditingAddress({ ...editingAddress, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>10-Digit Mobile Number *</label>
                                <input 
                                    type="tel" 
                                    required 
                                    value={editingAddress.phone}
                                    onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value })}
                                />
                            </div>
                            <div className="form-group form-span-2">
                                <label>Street Address / Flat / Building *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={editingAddress.street}
                                    onChange={(e) => setEditingAddress({ ...editingAddress, street: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>City / District *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={editingAddress.city}
                                    onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>State *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={editingAddress.state}
                                    onChange={(e) => setEditingAddress({ ...editingAddress, state: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Pincode *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={editingAddress.pincode}
                                    onChange={(e) => setEditingAddress({ ...editingAddress, pincode: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Address Type</label>
                                <select 
                                    value={editingAddress.type}
                                    onChange={(e) => setEditingAddress({ ...editingAddress, type: e.target.value })}
                                >
                                    <option value="Home">Home (All Day Delivery)</option>
                                    <option value="Work">Work (10 AM - 6 PM)</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-actions-full" style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary-yellow">
                                    Save Address
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Addresses Grid Display */}
                <div className="saved-addresses-cards-grid">
                    {addresses.map(addr => (
                        <div key={addr.id} className={`address-manage-card ${addr.isDefault ? 'is-default' : ''}`}>
                            <div className="address-manage-top">
                                <span className="address-type-badge">{addr.type}</span>
                                {addr.isDefault && (
                                    <span className="address-default-badge">✓ Default Address</span>
                                )}
                            </div>

                            <strong className="address-recipient-name">{addr.name}</strong>
                            <p className="address-street-text">{addr.street}</p>
                            <p className="address-city-text">{addr.city}, {addr.state} - <strong>{addr.pincode}</strong></p>
                            <p className="address-phone-text">📞 {addr.phone}</p>

                            <div className="address-manage-actions">
                                <button type="button" className="addr-action-btn" onClick={() => handleStartEdit(addr)}>
                                    Edit
                                </button>
                                {!addr.isDefault && (
                                    <>
                                        <button type="button" className="addr-action-btn" onClick={() => handleSetDefault(addr.id)}>
                                            Set as Default
                                        </button>
                                        <button type="button" className="addr-action-btn text-danger" onClick={() => handleDelete(addr.id)}>
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
