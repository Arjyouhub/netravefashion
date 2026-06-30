import React, { useState, useEffect } from 'react';

export default function BookingsModal({ isOpen, bookings, user, onCancelSuccess, whatsappNumber, onClose, API_BASE_URL }) {
    // Active states for self-service cancellation and reviews
    const [cancellingOrderId, setCancellingOrderId] = useState(null);
    const [reviewingItem, setReviewingItem] = useState(null); // { orderId, productId, title }
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState('');

    // Tracks which items have already been reviewed in this session
    const [submittedReviews, setSubmittedReviews] = useState(() => {
        const stored = localStorage.getItem('netrave_submitted_reviews');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem('netrave_submitted_reviews', JSON.stringify(submittedReviews));
    }, [submittedReviews]);

    if (!isOpen) return null;

    // 1. WhatsApp Support Link Generator
    const generateSupportLink = (order) => {
        const textTemplate = `👋 *Hi Netrave Support*,\nI need help with my Order ID: *${order.orderId}*.\n\n*Order Details:*\n- Total: ₹${order.total}\n- Date: ${order.date}\n- Status: ${order.status}`;
        const targetNumber = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, '') : '919946550713';
        return `https://wa.me/${targetNumber}?text=${encodeURIComponent(textTemplate)}`;
    };

    // 2. WhatsApp Order Confirm Link Generator
    const generateWhatsAppLink = (orderRecord) => {
        const itemsText = orderRecord.items.map((item, i) => {
            return `${i + 1}. ${item.title} (Size: ${item.size}) x ${item.quantity} - ₹${item.price * item.quantity}`;
        }).join('\n');

        const paymentText = orderRecord.customer.payment === 'COD' ? 'Cash on Delivery (COD)' : 'UPI Confirmation Needed';
        const deliveryFee = orderRecord.delivery === 0 ? 'FREE' : `₹${orderRecord.delivery}`;

        const textTemplate = `⚡ *NETRAVE STORE - BOOKING RECEIPT* ⚡
-----------------------------------------
*Order ID:* ${orderRecord.orderId}
*Date:* ${orderRecord.date}

*Customer Details:*
👤 Name: ${orderRecord.customer.name}
📞 Mobile: ${orderRecord.customer.phone}
💬 WhatsApp: ${orderRecord.customer.whatsapp}
📍 Address: ${orderRecord.customer.address}
🏘️ District: ${orderRecord.customer.district}
📌 Pincode: ${orderRecord.customer.pincode}

-----------------------------------------
*ITEMS BOOKED:*
${itemsText}

-----------------------------------------
*Subtotal:* ₹${orderRecord.subtotal}
*Delivery Fee:* ${deliveryFee}
*GRAND TOTAL:* ₹${orderRecord.total}
*PAYMENT METHOD:* ${paymentText}
-----------------------------------------
💡 _Please confirm my booking order. Thank you!_`;

        const targetNumber = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, '') : '919946550713';
        return `https://wa.me/${targetNumber}?text=${encodeURIComponent(textTemplate)}`;
    };

    // 3. Handle Order Cancellation
    const handleCancelOrder = async (orderId) => {
        if (!window.confirm(`Are you sure you want to cancel Order ID: ${orderId}? This will restore the product stock.`)) return;
        setCancellingOrderId(orderId);
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${orderId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: user.phone })
            });
            const data = await response.json();
            if (response.ok) {
                alert('Your order has been cancelled successfully.');
                if (onCancelSuccess) onCancelSuccess();
            } else {
                alert(data.error || 'Failed to cancel order.');
            }
        } catch (err) {
            console.error('Cancellation error:', err);
            alert('Failed to connect to backend server to cancel order.');
        } finally {
            setCancellingOrderId(null);
        }
    };

    // 4. Handle Product Review Submission
    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) {
            setReviewError('Please write a comment for your review.');
            return;
        }
        setReviewError('');
        setReviewSuccess('');
        setReviewLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: reviewingItem.productId,
                    orderId: reviewingItem.orderId,
                    rating,
                    comment,
                    customerName: user.name,
                    customerPhone: user.phone
                })
            });

            const data = await response.json();
            if (response.ok) {
                setReviewSuccess('Thank you! Your review has been posted successfully.');
                setSubmittedReviews([...submittedReviews, `${reviewingItem.orderId}-${reviewingItem.productId}`]);
                setComment('');
                setRating(5);
                setTimeout(() => {
                    setReviewingItem(null);
                    setReviewSuccess('');
                }, 2000);
            } else {
                setReviewError(data.error || 'Failed to submit review.');
            }
        } catch (err) {
            console.error('Review submit error:', err);
            setReviewError('Network error. Failed to post review.');
        } finally {
            setReviewLoading(false);
        }
    };

    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }} style={{ zIndex: 1090 }}>
            {/* Inline CSS styling for Cancel, Support and review widgets */}
            <style>{`
                .support-btn {
                    border: 1px solid rgba(255,255,255,0.08) !important;
                    color: #cbd5e1 !important;
                    background: transparent !important;
                    padding: 8px 14px !important;
                    border-radius: 20px !important;
                    font-size: 12px !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                    cursor: pointer !important;
                    transition: all 0.2s !important;
                    text-decoration: none !important;
                }
                .support-btn:hover {
                    background: rgba(255,255,255,0.05) !important;
                    border-color: rgba(255,255,255,0.2) !important;
                }
                .cancel-order-btn {
                    background: rgba(239,68,68,0.1) !important;
                    color: #ef4444 !important;
                    border: 1px solid rgba(239,68,68,0.2) !important;
                    padding: 8px 14px !important;
                    border-radius: 20px !important;
                    font-size: 12px !important;
                    cursor: pointer !important;
                    transition: all 0.2s !important;
                }
                .cancel-order-btn:hover {
                    background: #ef4444 !important;
                    color: #ffffff !important;
                }
                .review-pill-btn {
                    background: rgba(245,158,11,0.08) !important;
                    color: #f59e0b !important;
                    border: 1px solid rgba(245,158,11,0.2) !important;
                    padding: 4px 10px !important;
                    border-radius: 12px !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    cursor: pointer !important;
                    transition: all 0.2s !important;
                    margin-left: 8px !important;
                    display: inline-flex !important;
                }
                .review-pill-btn:hover {
                    background: #f59e0b !important;
                    color: #0a0b0e !important;
                }
                .star-selector-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #475569;
                    padding: 0 4px;
                    transition: color 0.1s;
                }
                .star-selector-btn.active {
                    color: #f59e0b;
                }
            `}</style>

            <div className="modal-content bookings-list-modal" style={{ maxWidth: '650px', background: 'rgba(10,11,14,0.95)', border: '1px solid rgba(245,158,11,0.15)', backdropFilter: 'blur(20px)', borderRadius: '16px', position: 'relative', overflowY: 'auto', maxHeight: '90vh' }}>
                <button className="close-btn modal-close" onClick={onClose}>&times;</button>
                
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>My Order History</h2>
                <p className="bookings-subtitle" style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>Track your placed bookings, cancel pending orders, or write reviews.</p>

                <div className="bookings-list-container" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                    {bookings.length === 0 ? (
                        <div className="empty-bookings-log" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                            <p>You haven't placed any bookings yet. Browse our collections and place your first order!</p>
                        </div>
                    ) : (
                        bookings.map(b => (
                            <div className="booking-log-card" key={b.orderId} style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
                                <div className="booking-log-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                    <span className="booking-id-tag" style={{ fontWeight: '700', color: '#ffffff' }}>Order ID: {b.orderId}</span>
                                    <span className="booking-date-tag" style={{ color: '#64748b', fontSize: '12px' }}>{b.date}</span>
                                </div>
                                <div className="booking-log-body">
                                    <div className="booking-log-items-list" style={{ marginBottom: '12px' }}>
                                        {b.items.map((item, idx) => {
                                            const hasReviewed = submittedReviews.includes(`${b.orderId}-${item.id}`);
                                            return (
                                                <div className="booking-log-item" key={idx} style={{ padding: '6px 0', borderBottom: idx < b.items.length - 1 ? '1px dashed rgba(255,255,255,0.03)' : 'none', color: '#cbd5e1', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>• {item.title} (Size: {item.size}) x {item.quantity} - ₹{item.price * item.quantity}</span>
                                                    
                                                    {/* Review option if Order Status is Delivered */}
                                                    {b.status.toLowerCase() === 'delivered' && (
                                                        hasReviewed ? (
                                                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold', marginLeft: '8px' }}>Reviewed ✓</span>
                                                        ) : (
                                                            <button 
                                                                className="review-pill-btn"
                                                                onClick={() => setReviewingItem({ orderId: b.orderId, productId: item.id, title: item.title })}
                                                            >
                                                                Write Review
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p style={{ margin: '8px 0', fontSize: '13px', color: '#94a3b8' }}>
                                        <strong>Deliver To:</strong> {b.customer.name}, {b.customer.address}, {b.customer.district} - {b.customer.pincode}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
                                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                                            Status: <span style={{ 
                                                color: (b.status === 'Cancelled' || b.status === 'Payment Not Confirmed') ? '#ef4444' : b.status === 'Delivered' ? '#10b981' : '#f59e0b', 
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                fontSize: '12px'
                                            }}>{b.status}</span>
                                        </span>
                                        <span className="booking-log-total" style={{ fontWeight: '800', color: '#fff', fontSize: '15px' }}>Grand Total: ₹{b.total}</span>
                                    </div>
                                </div>

                                {/* Order Action Buttons Row */}
                                <div className="booking-log-footer" style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    {/* Pre-fill WhatsApp Receipt Resend */}
                                    <a 
                                        href={generateWhatsAppLink(b)} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="support-btn"
                                        style={{ borderColor: 'rgba(16,185,129,0.3)', color: '#10b981' }}
                                    >
                                        Share Receipt
                                    </a>

                                    {/* Help & Support (WhatsApp prefill) */}
                                    <a 
                                        href={generateSupportLink(b)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="support-btn"
                                    >
                                        💬 Help & Support
                                    </a>

                                    {/* Self-service Cancel option if Status is Pending */}
                                    {b.status.toLowerCase() === 'pending' && (
                                        <button 
                                            className="cancel-order-btn" 
                                            onClick={() => handleCancelOrder(b.orderId)}
                                            disabled={cancellingOrderId === b.orderId}
                                        >
                                            {cancellingOrderId === b.orderId ? 'Cancelling...' : 'Cancel Order'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* PRODUCT REVIEW INLINE/OVERLAY BOX */}
                {reviewingItem && (
                    <div style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        background: 'rgba(10, 11, 14, 0.98)', 
                        borderRadius: '16px', 
                        padding: '30px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        boxSizing: 'border-box',
                        zIndex: 10
                    }}>
                        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '800', margin: '0 0 8px' }}>Write a Product Review</h3>
                        <p style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '700', margin: '0 0 16px' }}>{reviewingItem.title}</p>
                        
                        <form onSubmit={handleReviewSubmit}>
                            {/* Star Selector */}
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                                <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '600', marginRight: '12px' }}>Rating:</span>
                                {[1, 2, 3, 4, 5].map(num => (
                                    <button 
                                        key={num}
                                        type="button" 
                                        className={`star-selector-btn ${num <= rating ? 'active' : ''}`}
                                        onClick={() => setRating(num)}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Your Feedback / Review Comments *</label>
                                <textarea 
                                    required
                                    rows="4"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Tell us what you liked or disliked about this product!"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: '#12141c',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: '#ffffff',
                                        borderRadius: '8px',
                                        fontSize: '13.5px',
                                        outline: 'none',
                                        resize: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {reviewError && (
                                <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '16px', fontWeight: '500' }}>
                                    {reviewError}
                                </div>
                            )}

                            {reviewSuccess && (
                                <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '16px', fontWeight: 'bold' }}>
                                    {reviewSuccess}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button 
                                    type="button" 
                                    className="support-btn" 
                                    onClick={() => { setReviewingItem(null); setReviewError(''); }}
                                    disabled={reviewLoading}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="review-pill-btn" 
                                    style={{ padding: '8px 18px !important', borderRadius: '20px !important', fontSize: '13px !important' }}
                                    disabled={reviewLoading}
                                >
                                    {reviewLoading ? 'Posting...' : 'Post Review'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
