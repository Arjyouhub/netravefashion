import React, { useCallback } from 'react';
 
export default function SuccessModal({ isOpen, order, onClose, whatsappNumber, onTrackOrder }) {
    const generateWhatsAppLink = useCallback((orderRecord) => {
        const itemsText = orderRecord.items.map((item, i) => {
            return `${i + 1}. ${item.title} (Size: ${item.size}) x ${item.quantity} - ₹${item.price * item.quantity}`;
        }).join('\n');
 
        const paymentText = orderRecord.customer.payment?.includes('Razorpay') 
            ? 'Paid Online (Razorpay Verified)' 
            : (orderRecord.customer.payment === 'COD' ? 'Cash on Delivery (COD)' : (orderRecord.customer.payment || 'Online Payment'));
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
Town/District: ${orderRecord.customer.district}
Pincode: ${orderRecord.customer.pincode}
 
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
    }, [whatsappNumber]);
 
    if (!isOpen || !order) return null;
 
    const whatsappUrl = generateWhatsAppLink(order);
 
    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }} style={{ zIndex: 1100 }}>
            <div className="modal-content success-modal-content" style={{ 
                overflowY: 'auto', 
                maxHeight: '92vh', 
                background: 'linear-gradient(180deg, #111420 0%, #0a0c13 100%)', 
                borderRadius: '20px', 
                border: '1px solid rgba(245, 158, 11, 0.25)',
                position: 'relative'
            }}>
                <style>{`
                    .success-modal-content {
                        max-width: 580px;
                        padding: 32px;
                        text-align: center;
                    }
                    .success-footer-actions {
                        display: flex;
                        gap: 12px;
                        margin-top: 24px;
                    }
                    .success-telemetry-banner {
                        background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%);
                        border: 1px solid rgba(245, 158, 11, 0.3);
                        border-radius: 14px;
                        padding: 14px 16px;
                        margin-bottom: 18px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        flex-wrap: wrap;
                        gap: 10px;
                        text-align: left;
                    }
                    @media (max-width: 600px) {
                        .success-modal-content {
                            width: calc(100% - 16px) !important;
                            max-width: 480px !important;
                            margin: 10px auto !important;
                            padding: 22px 16px 18px !important;
                            max-height: 94vh !important;
                            border-radius: 16px !important;
                        }
                        .checkmark-circle {
                            width: 58px !important;
                            height: 58px !important;
                        }
                        .checkmark-svg {
                            width: 36px !important;
                            height: 36px !important;
                        }
                        .success-header h2 {
                            font-size: 19px !important;
                            margin-top: 10px !important;
                            margin-bottom: 4px !important;
                            line-height: 1.3 !important;
                            font-weight: 800 !important;
                        }
                        .success-header p {
                            font-size: 12px !important;
                            margin-bottom: 0 !important;
                        }
                        .order-id-highlight {
                            font-size: 11.5px !important;
                            padding: 2px 8px !important;
                        }
                        .success-body {
                            margin-top: 14px !important;
                        }
                        .success-telemetry-banner {
                            padding: 12px !important;
                            margin-bottom: 14px !important;
                            border-radius: 12px !important;
                        }
                        .telemetry-title {
                            font-size: 13px !important;
                        }
                        .telemetry-sub {
                            font-size: 11px !important;
                        }
                        .telemetry-btn {
                            width: 100% !important;
                            justify-content: center !important;
                            padding: 8px 14px !important;
                            font-size: 12px !important;
                            margin-top: 4px !important;
                        }
                        .whatsapp-prompt-box {
                            padding: 12px !important;
                            margin-bottom: 14px !important;
                            border-radius: 12px !important;
                        }
                        .whatsapp-prompt-box h3 {
                            font-size: 13px !important;
                            margin-bottom: 4px !important;
                        }
                        .whatsapp-prompt-box p {
                            font-size: 11.5px !important;
                            margin-bottom: 10px !important;
                            line-height: 1.35 !important;
                        }
                        .whatsapp-cta-btn {
                            padding: 11px 14px !important;
                            font-size: 13px !important;
                            border-radius: 10px !important;
                        }
                        .order-receipt-summary {
                            padding: 12px !important;
                            border-radius: 12px !important;
                        }
                        .order-receipt-summary h4 {
                            font-size: 13px !important;
                            margin-bottom: 8px !important;
                            padding-bottom: 4px !important;
                        }
                        .receipt-item-line {
                            font-size: 12px !important;
                            margin-bottom: 5px !important;
                        }
                        .receipt-shipping-box {
                            margin-top: 8px !important;
                            padding-top: 6px !important;
                            font-size: 11px !important;
                        }
                        .receipt-shipping-box p {
                            margin-bottom: 2px !important;
                            line-height: 1.35 !important;
                        }
                        .success-footer-actions {
                            display: flex !important;
                            flex-direction: column !important;
                            gap: 8px !important;
                            margin-top: 14px !important;
                        }
                        .success-footer-actions .cta-btn {
                            width: 100% !important;
                            padding: 11px 14px !important;
                            font-size: 13px !important;
                            min-height: 42px !important;
                            border-radius: 10px !important;
                            white-space: nowrap !important;
                        }
                    }
                `}</style>

                <div className="success-header">
                    <div className="success-checkmark-wrapper">
                        <div className="checkmark-circle">
                            <svg viewBox="0 0 52 52" className="checkmark-svg">
                                <circle className="checkmark-circle-line" cx="26" cy="26" r="25" fill="none"/>
                                <path className="checkmark-check-line" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                            </svg>
                        </div>
                    </div>
                    <h2>Order Placed Successfully!</h2>
                    <p>Order ID: <span className="order-id-highlight">{order.orderId}</span></p>
                </div>
 
                <div className="success-body">
                    {/* Live Courier Tracking Callout Banner */}
                    <div className="success-telemetry-banner">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '24px' }}>🚚</span>
                            <div>
                                <div className="telemetry-title" style={{ fontSize: '13.5px', fontWeight: '800', color: '#fff' }}>
                                    Express Courier Telemetry Active
                                </div>
                                <div className="telemetry-sub" style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                                    Partner: <strong style={{ color: 'var(--primary)' }}>{order.courierPartner || 'Delhivery Express'}</strong> • Expected in 2-3 Days
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="telemetry-btn"
                            onClick={() => {
                                onClose();
                                if (onTrackOrder) onTrackOrder(order.orderId);
                            }}
                            style={{
                                background: 'var(--primary)',
                                color: '#0a0b0e',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontWeight: '800',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                flexShrink: 0
                            }}
                        >
                            Track Live Now →
                        </button>
                    </div>

                    <div className="whatsapp-prompt-box">
                        <h3>WhatsApp Booking Confirmation</h3>
                        <p>Click below to share your order receipt to our team on WhatsApp for express priority dispatch.</p>
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="cta-btn whatsapp-cta-btn">
                            <svg viewBox="0 0 24 24" className="whatsapp-icon"><path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.233-1.371a9.927 9.927 0 0 0 4.779 1.229h.005c5.505 0 9.99-4.478 9.992-9.985.001-2.668-1.037-5.176-2.927-7.067C17.195 2.924 14.685 2.001 12.012 2zm5.794 14.41c-.243.684-1.42 1.309-1.954 1.39-.48.073-1.106.126-3.235-.756-2.724-1.129-4.477-3.901-4.613-4.084-.136-.182-1.107-1.472-1.107-2.812 0-1.34.697-1.996.969-2.27.27-.272.597-.341.79-.341.192 0 .385.002.55.01.173.007.407-.064.638.498.24.582.816 1.99.886 2.13.07.14.117.305.023.49-.093.188-.14.305-.28.468-.14.162-.295.363-.42.487-.14.14-.286.293-.12.578.167.285.741 1.222 1.59 1.977.896.797 1.65 1.042 1.884 1.158.234.115.37.098.508-.06.136-.16.59-.687.747-.92.158-.233.316-.197.533-.115.218.082 1.385.653 1.62.77.234.118.39.176.447.275.058.099.058.574-.185 1.258z"/></svg>
                            Send Confirmation to WhatsApp
                        </a>
                    </div>
 
                    <div className="order-receipt-summary">
                        <h4>Receipt Details</h4>
                        <div>
                            {order.items.map((item, idx) => (
                                <div className="receipt-item-line" key={idx}>
                                    <span>{item.title} (Size: {item.size}) x {item.quantity}</span>
                                    <span style={{ fontWeight: 600, color: '#fff' }}>₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                            <div className="receipt-item-line" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', marginTop: '6px', fontWeight: 800, color: '#fff', fontSize: '13px' }}>
                                <span>Grand Total</span>
                                <span style={{ color: 'var(--primary)' }}>₹{order.total}</span>
                            </div>
                        </div>
                        <div className="receipt-shipping-box">
                            <p><strong>Deliver To:</strong> <span>{order.customer.name}</span></p>
                            <p><strong>Address:</strong> <span>{order.customer.address}, {order.customer.district} - {order.customer.pincode}</span></p>
                            <p><strong>Phone:</strong> <span>{order.customer.phone}</span></p>
                        </div>
                    </div>
                </div>
 
                <div className="success-footer-actions">
                    <button 
                        className="cta-btn primary-cta" 
                        onClick={() => {
                            onClose();
                            if (onTrackOrder) onTrackOrder(order.orderId);
                        }}
                    >
                        🚚 Track Package Live
                    </button>
                    <button className="cta-btn secondary-cta" onClick={onClose}>
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    );
}
