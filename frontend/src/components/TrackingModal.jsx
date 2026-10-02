import React, { useState, useEffect, useCallback } from 'react';

export default function TrackingModal({
    isOpen,
    initialQuery = '',
    user = null,
    bookings = [],
    onClose,
    API_BASE_URL,
    onShopClick
}) {
    const [searchQuery, setSearchQuery] = useState(initialQuery || '');
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch tracking details from API for the EXACT dispatched order
    const fetchTracking = useCallback(async (queryToSearch) => {
        if (!queryToSearch || !queryToSearch.trim()) return;
        setLoading(true);
        setError('');
        try {
            const cleanQuery = encodeURIComponent(queryToSearch.trim());
            const res = await fetch(`${API_BASE_URL}/tracking/${cleanQuery}`);
            const json = await res.json();
            if (res.ok && json.data) {
                setTrackingData(json.data);
            } else {
                setTrackingData(null);
                setError(json.error || `No dispatch record found for "${queryToSearch}". Please verify your Netrave Order ID or registered phone number.`);
            }
        } catch (err) {
            console.error('Tracking fetch error:', err);
            setTrackingData(null);
            setError('Could not connect to tracking server. Please check your internet connection.');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        if (isOpen) {
            let targetQuery = initialQuery ? initialQuery.trim() : '';
            // If no initial query passed, look for orders in bookings
            if (!targetQuery && bookings && bookings.length > 0) {
                targetQuery = bookings[0].orderId;
            }
            if (targetQuery) {
                setSearchQuery(targetQuery);
                fetchTracking(targetQuery);
            } else {
                setSearchQuery('');
                setTrackingData(null);
                setError('');
            }
        }
    }, [isOpen, initialQuery, bookings, fetchTracking]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            fetchTracking(searchQuery);
        }
    };

    const handleCopyAwb = (awb) => {
        if (!awb) return;
        navigator.clipboard.writeText(awb);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchTracking(searchQuery || trackingData?.orderId || 'TR-748921');
    };

    if (!isOpen) return null;

    // Helper to calculate progress step
    const getProgressStep = (status = '') => {
        const s = status.toLowerCase();
        if (s.includes('delivered')) return 5;
        if (s.includes('out for delivery')) return 4;
        if (s.includes('in transit')) return 3;
        if (s.includes('dispatched') || s.includes('picked up')) return 2;
        if (s.includes('confirmed') || s.includes('placed') || s.includes('pending')) return 1;
        return 1;
    };

    const currentStep = getProgressStep(trackingData?.status);

    const steps = [
        { id: 1, label: 'Order Confirmed', icon: '📝', sub: 'Verified & Packed' },
        { id: 2, label: 'Courier Picked Up', icon: '📦', sub: trackingData?.courierPartner || 'Delhivery' },
        { id: 3, label: 'In Transit', icon: '🚛', sub: trackingData?.currentLocation ? trackingData.currentLocation.split(',')[0] : 'En Route Hub' },
        { id: 4, label: 'Out for Delivery', icon: '🛵', sub: 'Expected Today' },
        { id: 5, label: 'Delivered', icon: '🎉', sub: 'Package Handed Over' }
    ];

    // Carrier badge color & icon
    const getCarrierBadge = (partner = '') => {
        const p = partner.toLowerCase();
        if (p.includes('bluedart')) return { name: 'BlueDart Aviation', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.15)', border: 'rgba(2, 132, 199, 0.35)', logo: '✈️' };
        if (p.includes('dtdc')) return { name: 'DTDC Express', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.15)', border: 'rgba(220, 38, 38, 0.35)', logo: '⚡' };
        if (p.includes('india post') || p.includes('speed post')) return { name: 'India Post Speed Post', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.15)', border: 'rgba(234, 88, 12, 0.35)', logo: '📮' };
        if (p.includes('xpressbees')) return { name: 'XpressBees', color: '#e11d48', bg: 'rgba(225, 29, 72, 0.15)', border: 'rgba(225, 29, 72, 0.35)', logo: '🐝' };
        if (p.includes('shiprocket')) return { name: 'Shiprocket', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.15)', border: 'rgba(124, 58, 237, 0.35)', logo: '🚀' };
        if (p.includes('shadowfax')) return { name: 'Shadowfax', color: '#059669', bg: 'rgba(5, 150, 105, 0.15)', border: 'rgba(5, 150, 105, 0.35)', logo: '🛵' };
        return { name: 'Delhivery Express', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)', logo: '🚚' };
    };

    const carrierBadge = getCarrierBadge(trackingData?.courierPartner);

    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }} style={{ zIndex: 1100 }}>
            <div className="modal-content tracking-modal-content" style={{
                maxWidth: '750px',
                background: 'linear-gradient(180deg, #10131e 0%, #090a0f 100%)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 35px rgba(245, 158, 11, 0.12)',
                borderRadius: '20px',
                padding: '0',
                position: 'relative',
                overflow: 'hidden',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <style>{`
                    @media (max-width: 600px) {
                        .tracking-modal-content {
                            width: calc(100% - 16px) !important;
                            max-width: 480px !important;
                            margin: 10px auto !important;
                            border-radius: 16px !important;
                            max-height: 94vh !important;
                        }
                        .tracking-header-banner {
                            padding: 14px 16px !important;
                        }
                        .tracking-header-icon {
                            width: 34px !important;
                            height: 34px !important;
                            font-size: 18px !important;
                        }
                        .tracking-header-title {
                            font-size: 16px !important;
                        }
                        .tracking-body-container {
                            padding: 14px 14px !important;
                        }
                        .tracking-search-box {
                            padding: 4px 6px 4px 10px !important;
                        }
                        .tracking-search-btn {
                            padding: 8px 12px !important;
                            font-size: 12px !important;
                        }
                        .tracking-footer-bar {
                            padding: 12px 14px !important;
                        }
                    }
                `}</style>
                {/* Header Banner */}
                <div className="tracking-header-banner" style={{
                    padding: '20px 24px 18px',
                    background: 'linear-gradient(90deg, #171b29 0%, #1a1e2e 100%)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="tracking-header-icon" style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '22px'
                        }}>
                            🚚
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h2 className="tracking-header-title" style={{ fontSize: '19px', fontWeight: '800', color: '#fff', margin: 0 }}>
                                    Live Courier Tracking
                                </h2>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: '#10b981',
                                    background: 'rgba(16, 185, 129, 0.12)',
                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                    padding: '2px 8px',
                                    borderRadius: '20px'
                                }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pingPulse 1.5s infinite' }}></span>
                                    LIVE API
                                </span>
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: '12px', margin: '3px 0 0' }}>
                                Real-time dispatch telemetry across Indian logistics networks
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#94a3b8',
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        &times;
                    </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="tracking-body-container" style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                    {/* Search & Lookup Bar */}
                    <form onSubmit={handleSearchSubmit} style={{ marginBottom: '20px' }}>
                        <div className="tracking-search-box" style={{
                            display: 'flex',
                            gap: '10px',
                            background: '#0a0c13',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '12px',
                            padding: '6px 8px 6px 14px',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)'
                        }}>
                            <span style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '16px' }}>🔍</span>
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Enter Order ID (e.g. TR-839210) or AWB Tracking No..."
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '13.5px',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                            />
                            <button 
                                type="submit"
                                className="tracking-search-btn"
                                style={{
                                    background: 'var(--primary)',
                                    color: '#0a0b0e',
                                    border: 'none',
                                    padding: '8px 18px',
                                    borderRadius: '8px',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {loading ? 'Searching...' : 'Track'}
                            </button>
                        </div>

                        {/* Customer Real Orders Quick Switcher */}
                        {bookings && bookings.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '700' }}>Your Orders:</span>
                                {bookings.slice(0, 5).map(b => (
                                    <button
                                        key={b.orderId}
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery(b.orderId);
                                            fetchTracking(b.orderId);
                                        }}
                                        style={{
                                            background: trackingData?.orderId === b.orderId ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                            border: trackingData?.orderId === b.orderId ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                                            color: trackingData?.orderId === b.orderId ? 'var(--primary)' : '#cbd5e1',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        <span>Order #{b.orderId}</span>
                                        {b.courierPartner && (
                                            <span style={{ fontSize: '10px', opacity: 0.8, color: 'var(--primary)' }}>
                                                • {b.courierPartner}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </form>

                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#ef4444',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            marginBottom: '20px'
                        }}>
                            {error}
                        </div>
                    )}

                    {!trackingData && !loading && !error && (
                        <div style={{
                            textAlign: 'center',
                            padding: '36px 20px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '16px',
                            border: '1px dashed rgba(255, 255, 255, 0.1)',
                            color: '#94a3b8'
                        }}>
                            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📦</div>
                            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>
                                Dispatched Courier Telemetry
                            </h3>
                            <p style={{ fontSize: '13px', maxWidth: '440px', margin: '0 auto', color: '#64748b' }}>
                                Enter your Netrave Order ID (e.g. TR-XXXXXX) or registered phone number above to see the live courier company, assigned AWB, and real-time transit status.
                            </p>
                        </div>
                    )}

                    {trackingData && (
                        <>
                            {/* Courier & Order Overview Hero Card */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.025)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '16px',
                                padding: '18px 20px',
                                marginBottom: '22px',
                                position: 'relative'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                            <span style={{
                                                background: carrierBadge.bg,
                                                border: `1px solid ${carrierBadge.border}`,
                                                color: carrierBadge.color,
                                                fontSize: '12px',
                                                fontWeight: '800',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                {carrierBadge.logo} {carrierBadge.name}
                                            </span>
                                            <span style={{
                                                background: 'rgba(16, 185, 129, 0.12)',
                                                color: '#10b981',
                                                fontSize: '11.5px',
                                                fontWeight: '700',
                                                padding: '4px 10px',
                                                borderRadius: '20px'
                                            }}>
                                                {trackingData.status || 'In Transit'}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '15px', fontWeight: '700' }}>
                                            <span>Order #{trackingData.orderId}</span>
                                            <span style={{ color: '#64748b' }}>•</span>
                                            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>AWB:</span>
                                            <span style={{ fontFamily: 'monospace', color: 'var(--primary)', letterSpacing: '0.5px' }}>{trackingData.awbNumber}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyAwb(trackingData.awbNumber)}
                                                style={{
                                                    background: 'transparent',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: '#94a3b8',
                                                    fontSize: '11px',
                                                    padding: '2px 7px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {isCopied ? 'Copied ✓' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expected Delivery Box */}
                                    <div style={{
                                        background: '#0d111c',
                                        border: '1px solid rgba(245, 158, 11, 0.25)',
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        textAlign: 'right'
                                    }}>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Estimated Delivery
                                        </div>
                                        <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)', marginTop: '2px' }}>
                                            {trackingData.estimatedDelivery || 'Within 2-3 Days'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px', fontWeight: '600' }}>
                                            ⚡ Express Doorstep Delivery
                                        </div>
                                    </div>
                                </div>

                                {/* External Carrier & Refresh Actions */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '14px', paddingTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                                        📍 Current Hub: <strong style={{ color: '#fff' }}>{trackingData.currentLocation || 'Kerala Distribution Center'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {trackingData.trackingUrl && (
                                            <a 
                                                href={trackingData.trackingUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                style={{
                                                    color: 'var(--primary)',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    textDecoration: 'none',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    background: 'rgba(245,158,11,0.08)',
                                                    padding: '5px 10px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(245,158,11,0.2)'
                                                }}
                                            >
                                                Track on Carrier Portal ↗
                                            </a>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleRefresh}
                                            disabled={isRefreshing}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#cbd5e1',
                                                fontSize: '12px',
                                                padding: '5px 10px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <span style={{ display: 'inline-block', transform: isRefreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s' }}>🔄</span>
                                            {isRefreshing ? 'Refreshing...' : 'Live Refresh'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Flipkart/Amazon Visual Multi-Step Tracker */}
                            <div style={{
                                background: '#0a0d16',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '16px',
                                padding: '22px 18px',
                                marginBottom: '22px'
                            }}>
                                <style>{`
                                    @media (max-width: 580px) {
                                        .tracking-step-bar {
                                            display: flex !important;
                                            overflow-x: auto !important;
                                            padding-bottom: 8px !important;
                                            gap: 12px !important;
                                            scrollbar-width: none !important;
                                        }
                                        .tracking-step-bar::-webkit-scrollbar {
                                            display: none !important;
                                        }
                                        .tracking-step-item {
                                            min-width: 85px !important;
                                            flex-shrink: 0 !important;
                                        }
                                        .tracking-progress-track {
                                            display: none !important;
                                        }
                                    }
                                `}</style>

                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '18px' }}>
                                    Live Dispatch Telemetry
                                </div>

                                {/* Step Bar */}
                                <div className="tracking-step-bar" style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(5, 1fr)',
                                    position: 'relative',
                                    textAlign: 'center',
                                    gap: '4px'
                                }}>
                                    {/* Progress track line */}
                                    <div className="tracking-progress-track" style={{
                                        position: 'absolute',
                                        top: '20px',
                                        left: '10%',
                                        right: '10%',
                                        height: '4px',
                                        background: 'rgba(255,255,255,0.08)',
                                        zIndex: 0
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${((currentStep - 1) / 4) * 100}%`,
                                            background: 'linear-gradient(90deg, #10b981 0%, var(--primary) 100%)',
                                            transition: 'width 0.4s ease'
                                        }} />
                                    </div>

                                    {steps.map(s => {
                                        const isDone = s.id <= currentStep;
                                        const isCurrent = s.id === currentStep;

                                        return (
                                            <div key={s.id} className="tracking-step-item" style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: isDone ? (isCurrent ? 'var(--primary)' : '#10b981') : '#151926',
                                                    border: `2px solid ${isDone ? (isCurrent ? 'var(--primary)' : '#10b981') : 'rgba(255,255,255,0.1)'}`,
                                                    color: isDone ? '#000' : '#64748b',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '17px',
                                                    boxShadow: isCurrent ? '0 0 16px rgba(245,158,11,0.5)' : 'none',
                                                    marginBottom: '8px'
                                                }}>
                                                    {isDone && !isCurrent ? '✓' : s.icon}
                                                </div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    fontWeight: isCurrent ? '800' : '600',
                                                    color: isDone ? '#fff' : '#64748b',
                                                    lineHeight: '1.2'
                                                }}>
                                                    {s.label}
                                                </div>
                                                <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '3px' }}>
                                                    {s.sub}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Driver & Support Contact Widget */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                                gap: '14px',
                                marginBottom: '22px'
                            }}>
                                {/* Delivery Agent Card */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '14px',
                                    padding: '14px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                            🛵
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                                                {trackingData.driverInfo?.name || 'Local Courier Partner'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                Vehicle: {trackingData.driverInfo?.vehicle || 'KL-11-AX-4821'}
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={`tel:${trackingData.driverInfo?.phone || '+919946550713'}`}
                                        style={{
                                            background: 'rgba(16,185,129,0.15)',
                                            border: '1px solid rgba(16,185,129,0.3)',
                                            color: '#10b981',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            textDecoration: 'none',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        📞 Call
                                    </a>
                                </div>

                                {/* Security OTP & Protection Card */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '14px',
                                    padding: '14px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                        🔐
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#fff' }}>
                                            Contactless & Verified
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                            Share delivery confirmation code only after inspecting parcel
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Checkpoint Timeline */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '16px',
                                padding: '20px'
                            }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>Detailed Checkpoint Logs</span>
                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>({trackingData.trackingHistory?.length || 0} events)</span>
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
                                    {trackingData.trackingHistory?.map((event, idx) => {
                                        const isLatest = idx === trackingData.trackingHistory.length - 1;
                                        return (
                                            <div key={idx} style={{ display: 'flex', gap: '14px', position: 'relative', paddingBottom: idx < trackingData.trackingHistory.length - 1 ? '18px' : '0' }}>
                                                {/* Left line */}
                                                {idx < trackingData.trackingHistory.length - 1 && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        left: '11px',
                                                        top: '20px',
                                                        bottom: 0,
                                                        width: '2px',
                                                        background: 'rgba(255,255,255,0.08)'
                                                    }} />
                                                )}

                                                {/* Bullet */}
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: isLatest ? 'var(--primary)' : '#1e293b',
                                                    border: `2px solid ${isLatest ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                                                    color: isLatest ? '#000' : '#cbd5e1',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    flexShrink: 0,
                                                    boxShadow: isLatest ? '0 0 10px rgba(245,158,11,0.5)' : 'none'
                                                }}>
                                                    {isLatest ? '•' : '✓'}
                                                </div>

                                                {/* Info */}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                                                        <span style={{ fontSize: '13.5px', fontWeight: isLatest ? '700' : '600', color: isLatest ? '#fff' : '#cbd5e1' }}>
                                                            {event.status}
                                                        </span>
                                                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                                                            {event.timestamp}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '2px', fontWeight: '500' }}>
                                                        📍 {event.location}
                                                    </div>
                                                    <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px', lineHeight: '1.4' }}>
                                                        {event.description}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="tracking-footer-bar" style={{
                    padding: '14px 24px',
                    background: '#0c0e17',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <button 
                        type="button"
                        onClick={() => {
                            onClose();
                            if (onShopClick) onShopClick();
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            padding: '4px 8px'
                        }}
                    >
                        ← Continue Shopping
                    </button>
                    <button 
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            padding: '8px 20px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
