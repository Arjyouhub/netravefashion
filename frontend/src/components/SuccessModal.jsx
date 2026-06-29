import React, { useEffect, useCallback } from 'react';
 
export default function SuccessModal({ isOpen, order, onClose, whatsappNumber }) {
    const generateWhatsAppLink = useCallback((orderRecord) => {
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
 
        const targetNumber = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, '') : '919876543210';
        return `https://wa.me/${targetNumber}?text=${encodeURIComponent(textTemplate)}`;
    }, [whatsappNumber]);
 
    if (!isOpen || !order) return null;
 
    const whatsappUrl = generateWhatsAppLink(order);
 
    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }}>
            <div className="modal-content success-modal-content" style={{ overflowY: 'auto', maxHeight: '90vh' }}>
                <div className="success-header">
                    <div className="success-checkmark-wrapper">
                        <div className="checkmark-circle">
                            <svg viewBox="0 0 52 52" className="checkmark-svg">
                                <circle className="checkmark-circle-line" cx="26" cy="26" r="25" fill="none"/>
                                <path className="checkmark-check-line" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                            </svg>
                        </div>
                    </div>
                    <h2>Booking Placed Successfully!</h2>
                    <p>Order ID: <span className="order-id-highlight">{order.orderId}</span></p>
                </div>
 
                <div className="success-body">
                    <div className="whatsapp-prompt-box">
                        <h3>Confirm on WhatsApp</h3>
                        <p>Please click the button below to send your booking receipt to our team on WhatsApp to confirm your order and delivery details.</p>
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
                                    <span>₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                            <div className="receipt-item-line" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', marginTop: '6px', fontWeight: 700, color: '#fff' }}>
                                <span>Grand Total</span>
                                <span>₹{order.total}</span>
                            </div>
                        </div>
                        <div className="receipt-shipping-box">
                            <p><strong>Deliver To:</strong> <span>{order.customer.name}</span></p>
                            <p><strong>Address:</strong> <span>{order.customer.address}, {order.customer.district} - {order.customer.pincode}</span></p>
                            <p><strong>Phone:</strong> <span>{order.customer.phone}</span></p>
                        </div>
                    </div>
                </div>
 
                <div className="success-footer">
                    <button className="cta-btn secondary-cta" onClick={onClose}>Continue Shopping</button>
                </div>
            </div>
        </div>
    );
}
