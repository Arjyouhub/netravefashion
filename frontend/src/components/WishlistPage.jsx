import React from 'react';
import ProductCard from './ProductCard';

const DEMO_WISHLIST = [
    {
        id: 101,
        title: "Nike Air Zoom Pegasus Running Shoes",
        category: "footwear",
        price: 2599,
        originalPrice: 4499,
        rating: 4.8,
        reviews: 128,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
        tag: "40% OFF",
        inStock: true
    },
    {
        id: 102,
        title: "Classic Chronograph Black Dial Watch",
        category: "watches",
        price: 1599,
        originalPrice: 3499,
        rating: 4.6,
        reviews: 86,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
        tag: "54% OFF",
        inStock: true
    },
    {
        id: 103,
        title: "Urban Minimalist Leather Crossbody Bag",
        category: "accessories",
        price: 1799,
        originalPrice: 2999,
        rating: 4.7,
        reviews: 94,
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
        tag: "New",
        inStock: true
    },
    {
        id: 104,
        title: "Retro Polarized Matte Frame Sunglasses",
        category: "accessories",
        price: 1199,
        originalPrice: 1999,
        rating: 4.5,
        reviews: 58,
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
        tag: "40% OFF",
        inStock: true
    },
    {
        id: 105,
        title: "Oversized Acid-Wash Streetwear Tee",
        category: "t-shirt",
        price: 699,
        originalPrice: 1199,
        rating: 4.8,
        reviews: 142,
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80",
        tag: "42% OFF",
        inStock: true
    },
    {
        id: 106,
        title: "Premium Heavyweight Cotton Hoodie",
        category: "hoodies",
        price: 1899,
        originalPrice: 2899,
        rating: 4.9,
        reviews: 77,
        image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
        tag: "34% OFF",
        inStock: true
    }
];

export default function WishlistPage({
    wishlist = [],
    products = [],
    onQuickView,
    onToggleWishlist,
    onAddToCart,
    onNavigate
}) {
    // If user has saved items in wishlist, filter matching products. If none yet, display demo items.
    const userWishlistItems = products.filter(p => wishlist.includes(p.id));
    const itemsToRender = userWishlistItems.length > 0 ? userWishlistItems : (wishlist.length === 0 ? DEMO_WISHLIST : []);

    return (
        <div className="netrave-page-wrapper wishlist-screen">
            <div className="netrave-container wishlist-container-responsive">
                {/* Desktop Breadcrumb */}
                <div className="netrave-desktop-breadcrumb">
                    <button type="button" onClick={() => onNavigate && onNavigate('home')}>Home</button>
                    <span>/</span>
                    <button type="button" onClick={() => onNavigate && onNavigate('account')}>My Account</button>
                    <span>/</span>
                    <span className="current">Wishlist</span>
                </div>

                {/* Header Title & Counter */}
                <div className="wishlist-title-header">
                    <div className="wishlist-header-left">
                        <h1 className="wishlist-page-title">
                            My Wishlist <span className="wishlist-items-count">({itemsToRender.length} items)</span>
                        </h1>
                        <p className="wishlist-page-subtitle">
                            Review your saved favorites and add them to your cart with one click.
                        </p>
                    </div>
                    {itemsToRender.length > 0 && (
                        <div className="wishlist-header-right">
                            <button
                                type="button"
                                className="btn-secondary-outline-sm"
                                onClick={() => onNavigate && onNavigate('category', { category: 'all' })}
                            >
                                Continue Shopping →
                            </button>
                        </div>
                    )}
                </div>

                {/* Empty State */}
                {itemsToRender.length === 0 ? (
                    <div className="wishlist-empty-card">
                        <div className="empty-icon-art">❤️</div>
                        <h2>Your Wishlist is Empty</h2>
                        <p>Save items you love here and shop them anytime.</p>
                        <button
                            type="button"
                            className="btn-primary-yellow"
                            onClick={() => onNavigate && onNavigate('category', { category: 'all' })}
                        >
                            Explore Trending Styles →
                        </button>
                    </div>
                ) : (
                    /* Responsive Product Grid: 2 cols on mobile, 3 on tablet, 4-5 on desktop */
                    <div className="wishlist-responsive-grid">
                        {itemsToRender.map(prod => (
                            <ProductCard
                                key={prod.id}
                                product={prod}
                                onQuickView={onQuickView}
                                isWishlisted={true}
                                onToggleWishlist={onToggleWishlist}
                                onAddToCart={onAddToCart}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
