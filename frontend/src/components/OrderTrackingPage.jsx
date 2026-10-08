import React, { useState } from 'react';

const DEFAULT_TIMELINE = [
    { key: 'placed', label: 'Order Placed', time: '20 Sep, 10:30 AM', status: 'completed' },
    { key: 'confirmed', label: 'Confirmed', time: '21 Sep, 11:00 AM', status: 'completed' },
    { key: 'packed', label: 'Packed', time: '22 Sep, 09:20 AM', status: 'completed' },
    { key: 'shipped', label: 'Shipped', time: '23 Sep, 04:15 PM', status: 'completed' },
    { key: 'out_for_delivery', label: 'Out for Delivery', time: '24 Sep, 10:00 AM', status: 'active' },
    { key: 'delivered', label: 'Delivered', time: 'Expected by 25 Sep', status: 'pending' }
];

export default function OrderTrackingPage({
    initialQuery = '',
    bookings = [],
    onNavigate
}) {
    const [orderQuery, setOrderQuery] = useState(initialQuery || 'NTR123456');
    const [searchedOrder, setSearchedOrder] = useState(() => {
        if (bookings.length > 0) {
            const b = bookings[0];
            return {
                orderId: b.orderId || 'NTR123456',
                status: b.status || 'Out for Delivery',
                date: b.date || '20 Sep 2026',
                items: b.items || [
                    {
                        title: 'Nike Running Shoes',
                        price: 2999,
                        size: '8',
                        color: 'White',
                        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80'
                    }
                ]
            };
        }
        return {
            orderId: 'NTR123456',
            status: 'Out for Delivery',
            date: '20 Sep 2026',
            items: [
                {
                    title: 'Nike Running Shoes',
                    price: 2999,
                    size: '8',
                    color: 'White',
                    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80'
                }
            ]
        };
    });

    const handleTrackSubmit = (e) => {
        e.preventDefault();
        const trimmed = orderQuery.trim().toUpperCase();
        const found = bookings.find(b => (b.orderId || '').toUpperCase() === trimmed);
        if (found) {
            setSearchedOrder({
                orderId: found.orderId,
                status: found.status || 'Out for Delivery',
                date: found.date || '20 Sep 2026',
                items: found.items || []
            });
        } else {
            setSearchedOrder({
                orderId: trimmed || 'NTR123456',
                status: 'Out for Delivery',
                date: '20 Sep 2026',
                items: [
                    {
                        title: 'Nike Running Shoes',
                        price: 2999,
                        size: '8',
                        color: 'White',
                        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80'
                    }
                ]
            });
        }
    };

    const firstItem = searchedOrder?.items?.[0] || {
        title: 'Nike Running Shoes',
        price: 2999,
        size: '8',
        color: 'White',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80'
    };

    return (
        <div className="netrave-page-wrapper order-tracking-screen">
            <div className="netrave-container tracking-container-narrow">
                {/* Header Title */}
                <div className="tracking-header-section">
                    <h1 className="tracking-title">Track Your Order</h1>
                    <p className="tracking-subtitle">Enter your Order ID to track status</p>
                </div>

                {/* Track Input Form */}
                <form className="tracking-search-bar" onSubmit={handleTrackSubmit}>
                    <input 
                        type="text" 
                        className="tracking-input-field"
                        placeholder="Enter Order ID (e.g NTR123456)"
                        value={orderQuery}
                        onChange={(e) => setOrderQuery(e.target.value)}
                        required
                    />
                    <button type="submit" className="tracking-btn-yellow">
                        Track
                    </button>
                </form>

                {/* Vertical Timeline Matching Reference */}
                <div className="tracking-timeline-card">
                    <div className="vertical-timeline-flow">
                        {DEFAULT_TIMELINE.map((step, idx) => {
                            const isCompleted = step.status === 'completed';
                            const isActive = step.status === 'active';
                            const isLast = idx === DEFAULT_TIMELINE.length - 1;

                            return (
                                <div key={step.key} className={`timeline-node-row ${step.status}`}>
                                    <div className="timeline-indicator-col">
                                        <div className={`timeline-circle-icon ${step.status}`}>
                                            {isCompleted && (
                                                <svg viewBox="0 0 24 24" width="14" height="14" fill="#ffffff">
                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                                </svg>
                                            )}
                                            {isActive && (
                                                <div className="active-dot-inner" />
                                            )}
                                        </div>
                                        {!isLast && (
                                            <div className={`timeline-connecting-line ${isCompleted ? 'line-green' : 'line-gray'}`} />
                                        )}
                                    </div>
                                    <div className="timeline-content-col">
                                        <h4 className="timeline-step-heading">{step.label}</h4>
                                        <span className="timeline-step-time">{step.time}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Item Preview Card Matching Reference */}
                {searchedOrder && (
                    <div className="tracking-product-preview-card">
                        <img 
                            src={firstItem.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'} 
                            alt={firstItem.title} 
                            className="preview-card-thumb"
                        />
                        <div className="preview-card-info">
                            <h4 className="preview-card-title">{firstItem.title}</h4>
                            <p className="preview-card-meta">
                                ₹{firstItem.price?.toLocaleString()} | Size: {firstItem.size || '8'} | {firstItem.color || 'White'}
                            </p>
                            <span className="preview-card-orderid">Order #{searchedOrder.orderId}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
