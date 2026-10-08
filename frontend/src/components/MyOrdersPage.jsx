import React, { useState } from 'react';

export default function MyOrdersPage({
    bookings = [],
    user,
    onNavigate,
    onAddToCart
}) {
    const [activeTab, setActiveTab] = useState('all');

    const defaultOrders = [
        {
            orderId: 'NTR124456',
            date: '20 Sep 2026',
            price: 2999,
            status: 'Delivered',
            statusType: 'delivered',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80',
            title: 'Nike Air Zoom Pegasus Running Shoes',
            size: '8',
            color: 'White',
            deliveryDate: 'Delivered on 23 Sep 2026'
        },
        {
            orderId: 'NTR126001',
            date: '20 Sep 2026',
            price: 1999,
            status: 'Shipped',
            statusType: 'shipped',
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
            title: 'Analog Classic Leather Chronograph Watch',
            size: 'Standard',
            color: 'Black',
            deliveryDate: 'Expected by 24 Sep 2026'
        },
        {
            orderId: 'NTR124578',
            date: '05 Sep 2026',
            price: 1299,
            status: 'Cancelled',
            statusType: 'cancelled',
            image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&auto=format&fit=crop&q=80',
            title: 'Casual Acid-Wash Black Streetwear Tee',
            size: 'M',
            color: 'Black',
            deliveryDate: 'Cancelled on 06 Sep 2026'
        }
    ];

    const displayOrders = bookings.length > 0 ? bookings.map((b, i) => ({
        orderId: b.orderId || `NTR124${456 + i}`,
        date: b.date || '20 Sep 2026',
        price: b.totalAmount || 2999,
        status: b.status || (i === 0 ? 'Delivered' : i === 1 ? 'Shipped' : 'Cancelled'),
        statusType: (b.status || '').toLowerCase().includes('deliver') ? 'delivered' :
                   (b.status || '').toLowerCase().includes('cancel') ? 'cancelled' : 'shipped',
        image: b.items?.[0]?.image || defaultOrders[i % defaultOrders.length].image,
        title: b.items?.[0]?.title || defaultOrders[i % defaultOrders.length].title,
        size: b.items?.[0]?.size || '8',
        color: b.items?.[0]?.color || 'White',
        deliveryDate: b.status?.toLowerCase().includes('deliver') ? 'Delivered' : 'In Transit'
    })) : defaultOrders;

    const filtered = displayOrders.filter(order => {
        if (activeTab === 'all') return true;
        if (activeTab === 'active') return order.statusType === 'shipped' || order.statusType === 'active';
        if (activeTab === 'delivered') return order.statusType === 'delivered';
        if (activeTab === 'cancelled') return order.statusType === 'cancelled';
        return true;
    });

    return (
        <div className="netrave-page-wrapper my-orders-screen">
            <div className="netrave-container orders-container-responsive">
                {/* Desktop Breadcrumb */}
                <div className="netrave-desktop-breadcrumb">
                    <button type="button" onClick={() => onNavigate && onNavigate('home')}>Home</button>
                    <span>/</span>
                    <button type="button" onClick={() => onNavigate && onNavigate('account')}>My Account</button>
                    <span>/</span>
                    <span className="current">My Orders</span>
                </div>

                {/* Header Row */}
                <div className="orders-header-bar">
                    <div>
                        <h1 className="orders-main-title">My Orders</h1>
                        <p className="orders-page-subtext">View and track your previous purchases and current shipments</p>
                    </div>
                    <button 
                        type="button" 
                        className="btn-secondary-outline-sm desktop-continue-btn" 
                        onClick={() => onNavigate && onNavigate('category', { category: 'all' })}
                    >
                        Browse Store →
                    </button>
                </div>

                {/* Filter Tabs Row */}
                <div className="orders-tabs-nav-bar">
                    {[
                        { key: 'all', label: 'All Orders', count: displayOrders.length },
                        { key: 'active', label: 'Active', count: displayOrders.filter(o => o.statusType === 'shipped' || o.statusType === 'active').length },
                        { key: 'delivered', label: 'Delivered', count: displayOrders.filter(o => o.statusType === 'delivered').length },
                        { key: 'cancelled', label: 'Cancelled', count: displayOrders.filter(o => o.statusType === 'cancelled').length }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            className={`orders-filter-tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <span>{tab.label}</span>
                            <span className="tab-count-pill">{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* Orders List Container */}
                {filtered.length === 0 ? (
                    <div className="orders-empty-state">
                        <span className="empty-icon-art">📦</span>
                        <h3>No orders found in this category</h3>
                        <p>You haven't placed any orders matching this status.</p>
                        <button
                            type="button"
                            className="btn-primary-yellow"
                            onClick={() => setActiveTab('all')}
                        >
                            View All Orders
                        </button>
                    </div>
                ) : (
                    <div className="orders-list-cards">
                        {filtered.map(order => (
                            <div key={order.orderId} className="order-item-card">
                                {/* DESKTOP HORIZONTAL ROW (Product | Order Info | Status | Actions) */}
                                <div className="order-desktop-horizontal-layout">
                                    {/* Left: Product Image */}
                                    <div className="order-product-col-left">
                                        <img 
                                            src={order.image} 
                                            alt={order.title} 
                                            className="order-desktop-thumb" 
                                        />
                                    </div>

                                    {/* Center: Order Info */}
                                    <div className="order-info-col-center">
                                        <div className="order-id-date-meta">
                                            <span className="order-id-label">Order #{order.orderId}</span>
                                            <span className="order-date-bullet">•</span>
                                            <span className="order-date-label">Placed on {order.date}</span>
                                        </div>
                                        <h3 className="order-product-name">{order.title}</h3>
                                        <div className="order-variant-pills">
                                            <span className="order-spec-tag">Size: {order.size}</span>
                                            <span className="order-spec-tag">Color: {order.color}</span>
                                        </div>
                                        <div className="order-total-price">
                                            <span className="price-bold">₹{order.price?.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Right: Status & Timeline Badge */}
                                    <div className="order-status-col-right">
                                        <span className={`order-status-badge badge-${order.statusType}`}>
                                            {order.status === 'Delivered' ? '✓ Delivered' : order.status}
                                        </span>
                                        <p className="order-delivery-hint">{order.deliveryDate || 'Standard Delivery'}</p>
                                    </div>

                                    {/* Far Right: Action Buttons */}
                                    <div className="order-actions-col-end">
                                        <button 
                                            type="button" 
                                            className="btn-secondary-outline-sm"
                                            onClick={() => onNavigate && onNavigate('tracking', { query: order.orderId })}
                                        >
                                            View Details
                                        </button>
                                        
                                        {order.statusType === 'shipped' || order.statusType === 'active' ? (
                                            <button 
                                                type="button" 
                                                className="btn-primary-yellow order-btn-compact"
                                                onClick={() => onNavigate && onNavigate('tracking', { query: order.orderId })}
                                            >
                                                Track Order 🚚
                                            </button>
                                        ) : (
                                            <button 
                                                type="button" 
                                                className="btn-primary-yellow order-btn-compact"
                                                onClick={() => {
                                                    if (onAddToCart) {
                                                        onAddToCart({
                                                            title: order.title,
                                                            price: order.price,
                                                            image: order.image
                                                        }, order.size, 1);
                                                    }
                                                    if (onNavigate) onNavigate('cart');
                                                }}
                                            >
                                                Buy Again ↻
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* MOBILE VERTICAL ROW (Preserved for screen width < 768px) */}
                                <div className="order-mobile-vertical-layout">
                                    <div className="order-card-top-row">
                                        <img 
                                            src={order.image} 
                                            alt={order.title} 
                                            className="order-card-product-thumb" 
                                        />
                                        <div className="order-card-center-details">
                                            <h4 className="order-card-id">Order #{order.orderId}</h4>
                                            <span className="order-card-date">{order.date}</span>
                                            <span className="order-card-price">₹{order.price?.toLocaleString()}</span>
                                        </div>
                                        <div className="order-card-status-col">
                                            <span className={`order-status-badge badge-${order.statusType}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="order-card-bottom-actions">
                                        <button 
                                            type="button" 
                                            className="order-btn-outline"
                                            onClick={() => onNavigate && onNavigate('tracking', { query: order.orderId })}
                                        >
                                            View Details
                                        </button>
                                        {order.statusType === 'shipped' || order.statusType === 'active' ? (
                                            <button 
                                                type="button" 
                                                className="order-btn-yellow"
                                                onClick={() => onNavigate && onNavigate('tracking', { query: order.orderId })}
                                            >
                                                Track Order
                                            </button>
                                        ) : (
                                            <button 
                                                type="button" 
                                                className="order-btn-yellow"
                                                onClick={() => {
                                                    if (onAddToCart) {
                                                        onAddToCart({
                                                            title: order.title,
                                                            price: order.price,
                                                            image: order.image
                                                        }, order.size, 1);
                                                    }
                                                    if (onNavigate) onNavigate('cart');
                                                }}
                                            >
                                                Buy Again
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
