import React from 'react';

export default function BookingsModal({ isOpen, bookings, onClose, whatsappNumber }) {
    if (!isOpen) return null;

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

        const targetNumber = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, '') : '919876543210';
        return `https://wa.me/${targetNumber}?text=${encodeURIComponent(textTemplate)}`;
    };

    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }}>
            <div className="modal-content bookings-list-modal">
                <button className="close-btn modal-close" onClick={onClose}>&times;</button>
                
                <h2>My Bookings / Order History</h2>
                <p className="bookings-subtitle">Track your placed bookings. Remember to send WhatsApp confirmation for each booking.</p>

                <div className="bookings-list-container">
                    {bookings.length === 0 ? (
                        <div className="empty-bookings-log">
                            <p>You haven't placed any bookings yet. Browse our collections and place your first order!</p>
                        </div>
                    ) : (
                        bookings.map(b => (
                            <div className="booking-log-card" key={b.orderId}>
                                <div className="booking-log-header">
                                    <span className="booking-id-tag">Order ID: {b.orderId}</span>
                                    <span className="booking-date-tag">{b.date}</span>
                                </div>
                                <div className="booking-log-body">
                                    <div className="booking-log-items-list">
                                        {b.items.map((item, idx) => (
                                            <div className="booking-log-item" key={idx}>
                                                • {item.title} (Size: {item.size}) x {item.quantity} - ₹{item.price * item.quantity}
                                            </div>
                                        ))}
                                    </div>
                                    <p><strong>Shipping:</strong> {b.customer.name}, {b.customer.address}, {b.customer.district} - {b.customer.pincode}</p>
                                </div>
                                <div className="booking-log-footer">
                                    <span className="booking-log-total">Grand Total: ₹{b.total}</span>
                                    <a 
                                        href={generateWhatsAppLink(b)} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="booking-whatsapp-reconfirm"
                                    >
                                        <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px', fill: '#fff' }}>
                                            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.233-1.371a9.927 9.927 0 0 0 4.779 1.229h.005c5.505 0 9.99-4.478 9.992-9.985.001-2.668-1.037-5.176-2.927-7.067C17.195 2.924 14.685 2.001 12.012 2zm5.794 14.41c-.243.684-1.42 1.309-1.954 1.39-.48.073-1.106.126-3.235-.756-2.724-1.129-4.477-3.901-4.613-4.084-.136-.182-1.107-1.472-1.107-2.812 0-1.34.697-1.996.969-2.27.27-.272.597-.341.79-.341.192 0 .385.002.55.01.173.007.407-.064.638.498.24.582.816 1.99.886 2.13.07.14.117.305.023.49-.093.188-.14.305-.28.468-.14.162-.295.363-.42.487-.14.14-.286.293-.12.578.167.285.741 1.222 1.59 1.977.896.797 1.65 1.042 1.884 1.158.234.115.37.098.508-.06.136-.16.59-.687.747-.92.158-.233.316-.197.533-.115.218.082 1.385.653 1.62.77.234.118.39.176.447.275.058.099.058.574-.185 1.258z"/>
                                        </svg>
                                        Re-send to WhatsApp
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
