import React from 'react';

export default function WishlistModal({
    isOpen,
    wishlist = [],
    products = [],
    onClose,
    onRemoveFromWishlist,
    onAddToCart,
    onQuickView
}) {
    if (!isOpen) return null;

    // Filter products matching IDs in wishlist
    const wishlistProducts = products.filter(p => wishlist.includes(p.id));

    return (
        <div className="modal open" onClick={(e) => { if (e.target.classList.contains('modal')) onClose(); }} style={{ zIndex: 1095 }}>
            <div className="modal-content wishlist-modal-content" style={{
                maxWidth: '680px',
                background: 'linear-gradient(180deg, #111420 0%, #0a0c13 100%)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>❤️</span>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>
                                My Wishlist ({wishlistProducts.length})
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '12px', margin: '2px 0 0' }}>
                                Saved items to purchase anytime with 1-click
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#94a3b8',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            cursor: 'pointer'
                        }}
                    >
                        &times;
                    </button>
                </div>

                {wishlistProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤍</div>
                        <h3 style={{ color: '#cbd5e1', fontSize: '17px', fontWeight: '700', marginBottom: '6px' }}>Your Wishlist is Empty</h3>
                        <p style={{ fontSize: '13px', maxWidth: '320px', margin: '0 auto 20px' }}>
                            Explore our latest collections and click the heart icon on any product to save it here!
                        </p>
                        <button 
                            className="cta-btn primary-cta"
                            onClick={onClose}
                            style={{ margin: '0 auto', display: 'inline-block' }}
                        >
                            Explore Collections
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {wishlistProducts.map(p => {
                            const hasDiscount = p.originalPrice > p.price;
                            const discountPct = hasDiscount ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
                            const isOutOfStock = p.stock <= 0 || p.inStock === false;

                            return (
                                <div 
                                    key={p.id}
                                    style={{
                                        display: 'flex',
                                        gap: '14px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flex: 1, minWidth: '220px' }}>
                                        <div 
                                            onClick={() => onQuickView(p.id)}
                                            style={{
                                                width: '64px',
                                                height: '64px',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                background: '#1b1e2a',
                                                flexShrink: 0,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <img 
                                                src={p.image} 
                                                alt={p.title} 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                            />
                                        </div>
                                        <div>
                                            <h4 
                                                onClick={() => onQuickView(p.id)}
                                                style={{ fontSize: '14px', fontWeight: '700', color: '#fff', margin: '0 0 4px', cursor: 'pointer' }}
                                            >
                                                {p.title}
                                            </h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                                <span style={{ color: 'var(--primary)', fontWeight: '800' }}>₹{p.price}</span>
                                                {hasDiscount && (
                                                    <>
                                                        <span style={{ color: '#64748b', textDecoration: 'line-through', fontSize: '12px' }}>₹{p.originalPrice}</span>
                                                        <span style={{ color: '#10b981', fontWeight: '700', fontSize: '11px' }}>{discountPct}% OFF</span>
                                                    </>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#10b981', marginTop: '3px' }}>
                                                ⚡ In Stock & Assured
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button
                                            type="button"
                                            disabled={isOutOfStock}
                                            onClick={() => {
                                                const defaultSize = (p.sizes && p.sizes.length > 0) ? p.sizes[0] : 'M';
                                                onAddToCart(p, defaultSize, 1);
                                                onRemoveFromWishlist(p.id);
                                            }}
                                            style={{
                                                background: isOutOfStock ? '#334155' : 'var(--primary)',
                                                color: '#0a0b0e',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                fontWeight: '700',
                                                fontSize: '12.5px',
                                                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            🛒 Move to Cart
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onRemoveFromWishlist(p.id)}
                                            title="Remove from wishlist"
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                                color: '#ef4444',
                                                width: '34px',
                                                height: '34px',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
