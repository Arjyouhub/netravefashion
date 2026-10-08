import React from 'react';
import ProductCard from './ProductCard';

const DEMO_WISHLIST = [
    {
        id: 101,
        title: "Nike Running Shoes",
        category: "footwear",
        price: 2599,
        originalPrice: 4499,
        rating: 4.5,
        reviews: 120,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
        tag: "40% OFF"
    },
    {
        id: 102,
        title: "Analog Watch",
        category: "watches",
        price: 1599,
        originalPrice: 3499,
        rating: 4.6,
        reviews: 86,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
        tag: ""
    },
    {
        id: 103,
        title: "Premium Handbag",
        category: "accessories",
        price: 1799,
        originalPrice: 2999,
        rating: 4.7,
        reviews: 94,
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
        tag: "New"
    },
    {
        id: 104,
        title: "Sunglasses",
        category: "accessories",
        price: 1199,
        originalPrice: 1999,
        rating: 4.4,
        reviews: 58,
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
        tag: "40% OFF"
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
    // If user has items in wishlist, filter them. If none yet, display the demo items from reference screen 11.
    const userWishlistItems = products.filter(p => wishlist.includes(p.id));
    const itemsToRender = userWishlistItems.length > 0 ? userWishlistItems : DEMO_WISHLIST;

    return (
        <div className="netrave-page-wrapper wishlist-screen">
            <div className="netrave-container wishlist-container-narrow">
                {/* Header Title */}
                <div className="wishlist-title-header">
                    <h1 className="wishlist-page-title">
                        My Wishlist <span className="wishlist-items-count">({itemsToRender.length} items)</span>
                    </h1>
                </div>

                {/* 2-Column Product Grid Matching Reference Screen 11 */}
                <div className="mobile-product-grid-2col wishlist-grid">
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
            </div>
        </div>
    );
}
