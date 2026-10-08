import React, { useState } from 'react';

const DEFAULT_TIMELINE = [
    { key: 'placed', label: 'Order Placed', time: '20 Sep, 10:30 AM', status: 'completed', desc: 'Order received and payment verified' },
    { key: 'confirmed', label: 'Confirmed', time: '21 Sep, 11:00 AM', status: 'completed', desc: 'Merchant accepted the order' },
    { key: 'packed', label: 'Packed', time: '22 Sep, 09:20 AM', status: 'completed', desc: 'Item packed at Netrave Central Warehouse' },
    { key: 'shipped', label: 'Shipped', time: '23 Sep, 04:15 PM', status: 'completed', desc: 'Handed over to BlueDart Express' },
    { key: 'out_for_delivery', label: 'Out for Delivery', time: '24 Sep, 10:00 AM', status: 'active', desc: 'Courier agent out for destination delivery' },
    { key: 'delivered', label: 'Delivered', time: 'Expected by 24 Sep', status: 'pending', desc: 'Package handed over to recipient' }
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
                courier: 'BlueDart Express',
                awb: 'BLD98472910',
                deliveryDate: '24 Sep 2026, 6:00 PM',
                items: b.items || [
                    {
                        title: 'Nike Air Zoom Pegasus Running Shoes',
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
            courier: 'BlueDart Express',
            awb: 'BLD98472910',
            deliveryDate: '24 Sep 2026, 6:00 PM',
            items: [
                {
                    title: 'Nike Air Zoom Pegasus Running Shoes',
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
                courier: 'BlueDart Express',
                awb: 'BLD98472910',
                deliveryDate: '24 Sep 2026, 6:00 PM',
                items: found.items || []
            });
        } else {
            setSearchedOrder({
                orderId: trimmed || 'NTR123456',
                status: 'Out for Delivery',
                date: '20 Sep 2026',
                courier: 'BlueDart Express',
                awb: 'BLD98472910',
                deliveryDate: '24 Sep 2026, 6:00 PM',
                items: [
                    {
                        title: 'Nike Air Zoom Pegasus Running Shoes',
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
        title: 'Nike Air Zoom Pegasus Running Shoes',
        price: 2999,
        size: '8',
        color: 'White',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'
    };

    return (
        <div className="netrave-page-wrapper order-tracking-screen">
            <div className="netrave-container tracking-container-responsive">
                {/* Desktop Breadcrumb */}
                <div className="netrave-desktop-breadcrumb">
                    <button type="button" onClick={() => onNavigate && onNavigate('home')}>Home</button>
                    <span>/</span>
                    <button type="button" onClick={() => onNavigate && onNavigate('orders')}>My Orders</button>
                    <span>/</span>
                    <span className="current">Track Shipment</span>
                </div>

                {/* Header Title Section */}
                <div className="tracking-header-section">
                    <h1 className="tracking-title">Track Your Order</h1>
                    <p className="tracking-subtitle">Enter your Order ID to track real-time shipment updates</p>
                </div>

                {/* Search Bar Form */}
                <div className="tracking-search-bar-wrap">
                    <form className="tracking-search-bar" onSubmit={handleTrackSubmit}>
                        <div className="search-input-icon-wrap">
                            <span className="search-icon-symbol">🔍</span>
                            <input 
                                type="text" 
                                className="tracking-input-field"
                                placeholder="Enter Order ID (e.g. NTR123456)"
                                value={orderQuery}
                                onChange={(e) => setOrderQuery(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="tracking-btn-yellow">
                            Track Shipment →
                        </button>
                    </form>
                </div>

                {/* WIDE DESKTOP TRACKING SECTION (Left Summary ~38%, Right Timeline ~62%) */}
                <div className="tracking-desktop-split-view">
                    {/* Left: Order & Product Details Card */}
                    <div className="tracking-order-summary-card">
                        <div className="tracking-card-badge-row">
                            <span className="tracking-order-num">Order #{searchedOrder.orderId}</span>
                            <span className="order-status-badge badge-active">
                                {searchedOrder.status}
                            </span>
                        </div>

                        <div className="tracking-product-item-row">
                            <img 
                                src={firstItem.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'} 
                                alt={firstItem.title} 
                                className="tracking-product-thumb-large"
                            />
                            <div className="tracking-product-info-col">
                                <h3 className="tracking-product-title-bold">{firstItem.title}</h3>
                                <p className="tracking-product-spec-line">
                                    Size: <strong>{firstItem.size || '8'}</strong> • Color: <strong>{firstItem.color || 'White'}</strong>
                                </p>
                                <span className="tracking-item-price-bold">₹{firstItem.price?.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="tracking-meta-details-box">
                            <div className="tracking-meta-row">
                                <span className="meta-row-label">Order Placed On:</span>
                                <span className="meta-row-val">{searchedOrder.date}</span>
                            </div>
                            <div className="tracking-meta-row">
                                <span className="meta-row-label">Estimated Delivery:</span>
                                <span className="meta-row-val text-green-bold">{searchedOrder.deliveryDate}</span>
                            </div>
                            <div className="tracking-meta-row">
                                <span className="meta-row-label">Courier Partner:</span>
                                <span className="meta-row-val">{searchedOrder.courier || 'BlueDart Express'}</span>
                            </div>
                            <div className="tracking-meta-row">
                                <span className="meta-row-label">Tracking Number (AWB):</span>
                                <span className="meta-row-val font-mono">{searchedOrder.awb || 'BLD98472910'}</span>
                            </div>
                        </div>

                        <div className="tracking-help-card-row">
                            <span className="help-icon-bubble">💬</span>
                            <div className="help-text-wrap">
                                <strong>Need delivery help?</strong>
                                <p>Contact support on WhatsApp for quick dispatch assistance.</p>
                            </div>
                            <button
                                type="button"
                                className="btn-secondary-outline-sm"
                                onClick={() => window.open('https://wa.me/919946550713', '_blank')}
                            >
                                WhatsApp
                            </button>
                        </div>
                    </div>

                    {/* Right: Tracking Progress & Milestone Timeline */}
                    <div className="tracking-progress-timeline-card">
                        <div className="timeline-card-header">
                            <h3 className="timeline-card-title">Live Tracking Milestones</h3>
                            <span className="live-pulse-badge">● Live Updates</span>
                        </div>

                        {/* DESKTOP HORIZONTAL STEPPER TIMELINE */}
                        <div className="tracking-desktop-horizontal-stepper">
                            {DEFAULT_TIMELINE.map((step, idx) => {
                                const isCompleted = step.status === 'completed';
                                const isActive = step.status === 'active';
                                const isLast = idx === DEFAULT_TIMELINE.length - 1;

                                return (
                                    <div key={step.key} className={`stepper-horizontal-node ${step.status}`}>
                                        <div className="node-marker-row">
                                            <div className={`stepper-node-circle ${step.status}`}>
                                                {isCompleted ? '✓' : (idx + 1)}
                                            </div>
                                            {!isLast && (
                                                <div className={`stepper-connecting-bar ${isCompleted ? 'bar-green' : 'bar-gray'}`} />
                                            )}
                                        </div>
                                        <div className="node-text-meta">
                                            <strong className="node-step-label">{step.label}</strong>
                                            <span className="node-step-time">{step.time}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* DETAILED CHECKPOINT LOGS */}
                        <div className="tracking-checkpoints-log">
                            <h4 className="checkpoints-log-heading">Shipment Activity Log</h4>
                            <div className="checkpoints-activity-list">
                                {DEFAULT_TIMELINE.filter(s => s.status === 'completed' || s.status === 'active').reverse().map((step) => (
                                    <div key={step.key} className="checkpoint-log-row">
                                        <div className="log-dot-bullet" />
                                        <div className="log-text-block">
                                            <div className="log-header-line">
                                                <strong className="log-stage-name">{step.label}</strong>
                                                <span className="log-timestamp">{step.time}</span>
                                            </div>
                                            <p className="log-desc-text">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* MOBILE VIEW (Preserved vertical layout for screens < 768px) */}
                <div className="tracking-mobile-vertical-wrap">
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
        </div>
    );
}
