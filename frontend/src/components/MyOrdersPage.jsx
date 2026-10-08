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
            title: 'Nike Running Shoes',
            size: '8',
            color: 'White'
        },
        {
            orderId: 'NTR126001',
            date: '20 Sep 2026',
            price: 1999,
            status: 'Shipped',
            statusType: 'shipped',
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
            title: 'Analog Watch',
            size: 'Standard',
            color: 'Black'
        },
        {
            orderId: 'NTR124578',
            date: '05 Sep 2026',
            price: 1299,
            status: 'Cancelled',
            statusType: 'cancelled',
            image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&auto=format&fit=crop&q=80',
            title: 'Casual Black Tee',
            size: 'M',
            color: 'Black'
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
        color: b.items?.[0]?.color || 'White'
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
            <div className="netrave-container orders-container-narrow">
                {/* Header Row */}
                <div className="orders-header-bar">
                    <h1 className="orders-main-title">My Orders</h1>
                    <button 
                        type="button" 
                        className="orders-add-btn" 
                        onClick={() => onNavigate && onNavigate('category', { category: 'all' })}
                        aria-label="Add Order"
                    >
                        +
                    </button>
                </div>

                {/* Filter Pills */}
                <div className="orders-pill-tabs">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'active', label: 'Active' },
                        { key: 'delivered', label: 'Delivered' },
                        { key: 'cancelled', label: 'Cancelled' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            className={`orders-filter-pill ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Order Cards List matching screen 10 */}
                <div className="orders-list-cards">
                    {filtered.map(order => (
                        <div key={order.orderId} className="mobile-order-card">
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
                                {order.statusType === 'shipped' ? (
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
                    ))}
                </div>
            </div>
        </div>
    );
}
