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
                landmark: "Near Federal Bank ATM",
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
                landmark: "Opposite UL Cyberpark Gate 2",
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
        if (window.confirm && window.confirm('Are you sure you want to delete this address?')) {
            const updated = addresses.filter(a => a.id !== id);
            saveAddressesToStorage(updated);
        }
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
            landmark: '',
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
            if (editingAddress.isDefault) {
                updated = [...addresses.map(a => ({ ...a, isDefault: false })), editingAddress];
            } else {
                updated = [...addresses, editingAddress];
            }
        }
        saveAddressesToStorage(updated);
        setIsEditing(false);
        setEditingAddress(null);
    };

    return (
        <div className="netrave-page-wrapper address-page-root">
            <div className="netrave-container address-container-responsive">
                {/* Desktop Breadcrumb Navigation */}
                <div className="netrave-desktop-breadcrumb">
                    <button type="button" onClick={() => onNavigate && onNavigate('home')}>Home</button>
                    <span>/</span>
                    <button type="button" onClick={() => onNavigate && onNavigate('account')}>My Account</button>
                    <span>/</span>
                    <span className="current">Address Management</span>
                </div>

                {/* Page Title & Add New Address Header */}
                <div className="address-page-header-row">
                    <div className="address-header-titles">
                        <h1 className="address-page-title">Address Management</h1>
                        <p className="address-page-subtitle">Manage delivery locations for quick, one-click checkout.</p>
                    </div>
                    {!isEditing && (
                        <button type="button" className="btn-primary-yellow add-address-main-btn" onClick={handleStartAdd}>
                            <span>+</span> Add New Address
                        </button>
                    )}
                </div>

                {/* Edit / Add Modal Form (Desktop 2-Column, Mobile 1-Column) */}
                {isEditing && (
                    <div className="address-modal-overlay" onClick={() => setIsEditing(false)}>
                        <div className="address-form-modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="address-modal-header">
                                <h2 className="address-modal-title">
                                    {addresses.find(a => a.id === editingAddress.id) ? 'Edit Address' : 'Add New Delivery Address'}
                                </h2>
                                <button type="button" className="address-modal-close" onClick={() => setIsEditing(false)}>
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleFormSubmit} className="address-form-2col-grid">
                                <div className="addr-field-group">
                                    <label>Recipient Full Name *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="e.g. Arjun K K"
                                        value={editingAddress.name}
                                        onChange={(e) => setEditingAddress({ ...editingAddress, name: e.target.value })}
                                    />
                                </div>

                                <div className="addr-field-group">
                                    <label>10-Digit Mobile Number *</label>
                                    <input 
                                        type="tel" 
                                        required 
                                        placeholder="e.g. 98954 45210"
                                        value={editingAddress.phone}
                                        onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value })}
                                    />
                                </div>

                                <div className="addr-field-group form-col-full">
                                    <label>Flat, House no., Building, Company, Apartment *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="Door number, Building name, Street"
                                        value={editingAddress.street}
                                        onChange={(e) => setEditingAddress({ ...editingAddress, street: e.target.value })}
                                    />
                                </div>

                                <div className="addr-field-group">
                                    <label>City / District *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="e.g. Kozhikode"
                                        value={editingAddress.city}
                                        onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                                    />
                                </div>

                                <div className="addr-field-group">
                                    <label>State *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="e.g. Kerala"
                                        value={editingAddress.state}
                                        onChange={(e) => setEditingAddress({ ...editingAddress, state: e.target.value })}
                                    />
                                </div>

                                <div className="addr-field-group">
                                    <label>6-Digit Pincode *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="e.g. 673016"
                                        value={editingAddress.pincode}
                                        onChange={(e) => setEditingAddress({ ...editingAddress, pincode: e.target.value })}
                                    />
                                </div>

                                <div className="addr-field-group">
                                    <label>Landmark (Optional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Near Federal Bank"
                                        value={editingAddress.landmark || ''}
                                        onChange={(e) => setEditingAddress({ ...editingAddress, landmark: e.target.value })}
                                    />
                                </div>

                                <div className="addr-field-group form-col-full">
                                    <label>Address Type</label>
                                    <div className="addr-type-selector-row">
                                        {['Home', 'Work', 'Other'].map(typeOption => (
                                            <button
                                                key={typeOption}
                                                type="button"
                                                className={`addr-type-btn ${editingAddress.type === typeOption ? 'selected' : ''}`}
                                                onClick={() => setEditingAddress({ ...editingAddress, type: typeOption })}
                                            >
                                                {typeOption === 'Home' ? '🏠 Home' : typeOption === 'Work' ? '💼 Work' : '📍 Other'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="addr-field-group form-col-full">
                                    <label className="addr-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={editingAddress.isDefault}
                                            onChange={(e) => setEditingAddress({ ...editingAddress, isDefault: e.target.checked })}
                                        />
                                        <span>Set as default shipping address</span>
                                    </label>
                                </div>

                                <div className="addr-modal-actions-row form-col-full">
                                    <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary-yellow">
                                        Save Address
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Addresses Grid Display (2-3 cards per row on desktop) */}
                <div className="saved-addresses-cards-grid">
                    {addresses.map(addr => (
                        <div key={addr.id} className={`address-manage-card ${addr.isDefault ? 'is-default' : ''}`}>
                            <div className="address-card-top-badge-row">
                                <span className={`address-type-pill ${addr.type?.toLowerCase()}`}>
                                    {addr.type === 'Home' ? '🏠 Home' : addr.type === 'Work' ? '💼 Work' : '📍 ' + addr.type}
                                </span>
                                {addr.isDefault && (
                                    <span className="address-default-gold-badge">
                                        ★ Default Address
                                    </span>
                                )}
                            </div>

                            <div className="address-card-body-content">
                                <h3 className="address-recipient-name">{addr.name}</h3>
                                <p className="address-street-text">{addr.street}</p>
                                {addr.landmark && (
                                    <p className="address-landmark-text">Landmark: {addr.landmark}</p>
                                )}
                                <p className="address-city-state-text">
                                    {addr.city}, {addr.state} – <span className="address-pin-bold">{addr.pincode}</span>
                                </p>
                                <p className="address-phone-text">
                                    📞 <span>{addr.phone}</span>
                                </p>
                            </div>

                            <div className="address-manage-actions-row">
                                <button 
                                    type="button" 
                                    className="btn-addr-action btn-addr-edit" 
                                    onClick={() => handleStartEdit(addr)}
                                >
                                    Edit
                                </button>
                                {!addr.isDefault ? (
                                    <>
                                        <button 
                                            type="button" 
                                            className="btn-addr-action btn-addr-default" 
                                            onClick={() => handleSetDefault(addr.id)}
                                        >
                                            Set as Default
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn-addr-action btn-addr-delete" 
                                            onClick={() => handleDelete(addr.id)}
                                        >
                                            Delete
                                        </button>
                                    </>
                                ) : (
                                    <span className="default-indicator-text">Primary Address</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* "+ Add New Address" Quick Card in the Grid */}
                    <div className="address-add-new-dashed-card" onClick={handleStartAdd}>
                        <div className="add-card-inner">
                            <span className="add-plus-circle">+</span>
                            <strong>Add New Address</strong>
                            <p>Add a new delivery location for your orders</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
