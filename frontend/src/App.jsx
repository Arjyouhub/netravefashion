import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import HomeSections from './components/HomeSections';
import ProductGrid from './components/ProductGrid';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import SuccessModal from './components/SuccessModal';
import BookingsModal from './components/BookingsModal';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import DeveloperModal from './components/DeveloperModal';
import ProfileModal from './components/ProfileModal';
import TrackingModal from './components/TrackingModal';
import WishlistModal from './components/WishlistModal';
import { getCookie, setCookie, eraseCookie } from './utils/cookies';

// Backup fallback database to ensure frontend works gracefully even if backend is offline
const FALLBACK_PRODUCTS = [
    {
        id: 1,
        title: "Oversized Acid-Wash Graphic Streetwear Tee",
        category: "t-shirt",
        subcategory: "acid-wash",
        price: 699,
        originalPrice: 1199,
        rating: 4.8,
        reviews: 128,
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80",
        images: [
            "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80"
        ],
        shortDescription: "Heavyweight 240 GSM organic cotton streetwear tee with vintage acid wash finish.",
        description: "Streetwear aesthetic oversized t-shirt crafted from heavy 240 GSM organic cotton. Featuring a vintage acid-washed finish and custom graphic backprint.",
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Charcoal Black", "Washed Olive", "Vintage Grey"],
        colorVariants: [
            {
                color: "Charcoal Black",
                hex: "#1e293b",
                image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80"]
            },
            {
                color: "Washed Olive",
                hex: "#4b5320",
                image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80"]
            }
        ],
        tags: ["New", "Oversized", "Trending"],
        stock: 50,
        inStock: true
    },
    {
        id: 2,
        title: "AeroStryke Chunky Streetwear Sneakers",
        category: "footwear",
        subcategory: "sneakers",
        price: 1899,
        originalPrice: 3499,
        rating: 4.9,
        reviews: 215,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
        images: [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80"
        ],
        shortDescription: "High-impact cushioned EVA chunky sole streetwear sneakers with breathable mesh.",
        description: "Engineered for maximum street style and all-day shock absorption. Built with lightweight TPU heel stabilizers.",
        sizes: ["UK 7", "UK 8", "UK 9", "UK 10"],
        colors: ["Crimson Red", "Stealth Black"],
        colorVariants: [
            {
                color: "Crimson Red",
                hex: "#dc2626",
                image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80"]
            },
            {
                color: "Stealth Black",
                hex: "#090b10",
                image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80"]
            }
        ],
        tags: ["Footwear", "Trending", "Sneakers"],
        stock: 40,
        inStock: true
    },
    {
        id: 3,
        title: "Royal Kanjivaram Pure Silk Zari Saree",
        category: "saree",
        subcategory: "kanjivaram-silk",
        price: 2499,
        originalPrice: 5999,
        rating: 4.9,
        reviews: 184,
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
        images: [
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80"
        ],
        shortDescription: "Traditional lustrous pure art silk saree with intricate golden zari floral pallu.",
        description: "Exclusively handwoven with rich golden zari borders and intricate floral peacock motifs across the regal pallu.",
        sizes: ["Free Size (5.5m + 0.8m)"],
        colors: ["Royal Maroon", "Emerald Green"],
        colorVariants: [
            {
                color: "Royal Maroon",
                hex: "#881337",
                image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80"]
            },
            {
                color: "Emerald Green",
                hex: "#065f46",
                image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80"]
            }
        ],
        tags: ["Ethnic", "Saree", "Wedding"],
        stock: 35,
        inStock: true
    },
    {
        id: 4,
        title: "Designer Embroidered Anarkali Kurti Set",
        category: "kurti",
        subcategory: "anarkali-sets",
        price: 1499,
        originalPrice: 2799,
        rating: 4.7,
        reviews: 96,
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
        images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80"],
        shortDescription: "Full-flair georgette Anarkali kurti with intricate sequin yoke and organza dupatta.",
        description: "Elevate your ethnic fashion with this graceful Anarkali suit set with hand-worked sequin neckline.",
        sizes: ["M", "L", "XL", "XXL"],
        colors: ["Dusty Rose Pink"],
        colorVariants: [
            {
                color: "Dusty Rose Pink",
                hex: "#f472b6",
                image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80"]
            }
        ],
        tags: ["Ethnic", "Kurti", "Festive"],
        stock: 45,
        inStock: true
    },
    {
        id: 5,
        title: "Tactical Multi-Pocket Bomber Jacket",
        category: "hoodies",
        subcategory: "bomber-jackets",
        price: 1999,
        originalPrice: 3999,
        rating: 4.8,
        reviews: 112,
        image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
        images: ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80"],
        shortDescription: "Thermal insulated water-resistant streetwear flight bomber jacket with arm utility zip.",
        description: "Engineered for all-season versatility with water-repellent matte polyester shell.",
        sizes: ["M", "L", "XL"],
        colors: ["Matte Black"],
        colorVariants: [
            {
                color: "Matte Black",
                hex: "#111827",
                image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80"]
            }
        ],
        tags: ["Jackets", "Winter", "Bomber"],
        stock: 30,
        inStock: true
    },
    {
        id: 6,
        title: "Pure French Linen Casual Button-Down Shirt",
        category: "shirt",
        subcategory: "linen-blend",
        price: 1199,
        originalPrice: 1999,
        rating: 4.6,
        reviews: 85,
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
        images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80"],
        shortDescription: "Tailored from ultra-breathable pure linen blend with classic spread collar.",
        description: "Tailored from ultra-breathable French linen blend fabric. Designed with a structured spread collar.",
        sizes: ["M", "L", "XL", "XXL"],
        colors: ["Sage Green"],
        colorVariants: [
            {
                color: "Sage Green",
                hex: "#4d7c0f",
                image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80"]
            }
        ],
        tags: ["Breathable", "Premium", "Linen"],
        stock: 50,
        inStock: true
    },
    {
        id: 7,
        title: "Tactical 6-Pocket Heavy Ripstop Cargo Pants",
        category: "pants",
        subcategory: "tactical-cargo",
        price: 1299,
        originalPrice: 2199,
        rating: 4.8,
        reviews: 142,
        image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80",
        images: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80"],
        shortDescription: "Heavy cotton twill cargo pants with 6 utility pockets and drawstring ankle cuffs.",
        description: "Crafted from heavy 320 GSM cotton ripstop twill. Features 6 deep utility bellows pockets.",
        sizes: ["30", "32", "34", "36"],
        colors: ["Matte Black"],
        colorVariants: [
            {
                color: "Matte Black",
                hex: "#111827",
                image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80"]
            }
        ],
        tags: ["Rugged", "Cargo", "Utility"],
        stock: 50,
        inStock: true
    }
];

const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5001/api'
    : 'https://netravefashion.onrender.com/api';

function MaintenanceCountdown({ expiryTimestamp }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!expiryTimestamp) return;

        const updateTimer = () => {
            const diff = expiryTimestamp - Date.now();
            if (diff <= 0) {
                setTimeLeft('Ended');
                return;
            }

            const hrs = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`);
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [expiryTimestamp]);

    if (timeLeft === 'Ended' || !timeLeft) return null;

    return (
        <span className="maintenance-timer">
            ⏱️ Ends in: {timeLeft}
        </span>
    );
}

export default function App() {
    // A. Main State
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [cart, setCart] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('netrave_cart')) || [];
        } catch {
            return [];
        }
    });

    // B. Filters & UI State
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeTag, setActiveTag] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortMethod, setSortMethod] = useState('default');

    // C. Modal/Drawer Open Toggles
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isBookingsOpen, setIsBookingsOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [pendingCheckout, setPendingCheckout] = useState(false);
    const [isDeveloperOpen, setIsDeveloperOpen] = useState(false);
    const [user, setUser] = useState(() => getCookie('netrave_user'));

    // D. Focused Items
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [placedOrder, setPlacedOrder] = useState(null);

    // E. Admin Control Panel States
    const [isAdminView, setIsAdminView] = useState(false);
    const [settings, setSettings] = useState({ whatsappNumber: '919946550713' });
    const [toast, setToast] = useState({ message: '', type: 'success', visible: false });
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [isOfferDismissed, setIsOfferDismissed] = useState(false);

    // Wishlist & Live Tracking State (Flipkart/Amazon Features)
    const [wishlist, setWishlist] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('netrave_wishlist')) || [];
        } catch {
            return [];
        }
    });
    const [isTrackingOpen, setIsTrackingOpen] = useState(false);
    const [trackingQuery, setTrackingQuery] = useState('');
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('netrave_wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    const handleToggleWishlist = (productId) => {
        if (wishlist.includes(productId)) {
            setWishlist(wishlist.filter(id => id !== productId));
            showToast('Removed item from Wishlist', 'info');
        } else {
            setWishlist([...wishlist, productId]);
            showToast('Saved item to Wishlist ❤️', 'success');
        }
    };

    const handleOpenTracking = (query = '') => {
        setTrackingQuery(query);
        setIsTrackingOpen(true);
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type, visible: true });
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 4000);
    };

    // 1. Fetch categories, products and settings from API on Mount
    const fetchCategories = async () => {
        try {
            const adminToken = getCookie('adminSessionToken');
            const headers = adminToken ? { 'x-admin-session': adminToken } : {};
            const url = adminToken ? `${API_BASE_URL}/categories?all=true` : `${API_BASE_URL}/categories`;
            const response = await fetch(url, { headers });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setCategories(data);
                }
            }
        } catch (err) {
            console.warn('Could not load categories from backend:', err.message);
        }
    };

    const fetchProducts = async () => {
        try {
            const adminToken = getCookie('adminSessionToken');
            const headers = adminToken ? { 'x-admin-session': adminToken } : {};
            const response = await fetch(`${API_BASE_URL}/products`, { headers });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    setProducts(data);
                } else if (Array.isArray(data)) {
                    setProducts(data);
                } else {
                    setProducts(FALLBACK_PRODUCTS);
                }
            } else {
                setProducts(FALLBACK_PRODUCTS);
            }
        } catch (err) {
            console.warn('Backend server offline. Running with fallback product data.', err.message);
            setProducts(FALLBACK_PRODUCTS);
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/settings`);
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            }
        } catch (err) {
            console.warn('Could not load settings from backend:', err.message);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchSettings();
    }, []);

    // 2. Fetch booking history for the logged-in user
    const fetchBookings = async () => {
        if (!user) {
            setBookings([]);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/user/${user.phone}`);
            if (response.ok) {
                const data = await response.json();
                setBookings(data);
            }
        } catch (err) {
            console.warn('Could not load bookings from backend API.', err.message);
            // Fallback load bookings from localStorage, filtering by user phone
            try {
                const localOrders = JSON.parse(localStorage.getItem('netrave_bookings')) || [];
                const filtered = localOrders.filter(b => b.customer.phone === user.phone);
                setBookings(filtered);
            } catch { }
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [user]);

    const handleAuthSuccess = (userData) => {
        setUser(userData);
        setCookie('netrave_user', userData);

        // Merge guest cart with user's saved cart
        try {
            const userCartKey = `netrave_user_cart_${userData.phone}`;
            const userSavedCart = JSON.parse(localStorage.getItem(userCartKey)) || [];
            if (userSavedCart.length > 0 || cart.length > 0) {
                const mergedMap = new Map();
                // Add previously saved user items
                userSavedCart.forEach(item => {
                    const key = `${item.id}_${item.size || ''}_${item.color || ''}`;
                    mergedMap.set(key, { ...item });
                });
                // Merge current guest items
                cart.forEach(item => {
                    const key = `${item.id}_${item.size || ''}_${item.color || ''}`;
                    if (mergedMap.has(key)) {
                        mergedMap.get(key).quantity = (mergedMap.get(key).quantity || 1) + (item.quantity || 1);
                    } else {
                        mergedMap.set(key, { ...item });
                    }
                });
                const mergedList = Array.from(mergedMap.values());
                setCart(mergedList);
                localStorage.setItem('netrave_cart', JSON.stringify(mergedList));
                localStorage.setItem(userCartKey, JSON.stringify(mergedList));
            }
        } catch (e) {
            console.error('Failed to merge guest and user carts:', e);
        }

        if (pendingCheckout) {
            setIsCheckoutOpen(true);
            setPendingCheckout(false);
        } else if (!userData.phone || !userData.address) {
            setIsProfileOpen(true);
            showToast('Welcome! Please complete your phone & delivery address.', 'info');
        } else {
            showToast(`Welcome back, ${userData.name}!`, 'success');
        }
    };

    const handleLogout = () => {
        if (user?.phone) {
            try {
                localStorage.setItem(`netrave_user_cart_${user.phone}`, JSON.stringify(cart));
            } catch (e) {
                console.error(e);
            }
        }
        setUser(null);
        eraseCookie('netrave_user');
        setBookings([]);
    };

    // 2c. Listen to client-side path / route changes to toggle Admin / Developer view
    useEffect(() => {
        const checkRoute = () => {
            const path = window.location.pathname;
            const hash = window.location.hash;
            if (path === '/admin' || path === '/admin/login' || hash === '#/admin' || hash === '#/admin/login') {
                setIsAdminView(true);
            } else {
                setIsAdminView(false);
            }

            if (path === '/developer' || hash === '#/developer') {
                setIsDeveloperOpen(true);
            } else {
                setIsDeveloperOpen(false);
            }
        };
        checkRoute();
        window.addEventListener('popstate', checkRoute);
        window.addEventListener('hashchange', checkRoute);
        return () => {
            window.removeEventListener('popstate', checkRoute);
            window.removeEventListener('hashchange', checkRoute);
        };
    }, []);

    // 3. Cart State Modifications
    const syncCartStorage = (updatedCart) => {
        localStorage.setItem('netrave_cart', JSON.stringify(updatedCart));
        if (user?.phone) {
            try {
                localStorage.setItem(`netrave_user_cart_${user.phone}`, JSON.stringify(updatedCart));
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleAddToCart = (product, size, quantity) => {
        const itemColor = product.color || product.selectedOptions?.Color || '';
        const itemImage = product.image || (product.images && product.images[0]) || '';
        const existingIndex = cart.findIndex(item => item.id === product.id && item.size === size && (item.color || '') === itemColor);
        let updatedCart = [...cart];

        if (existingIndex > -1) {
            updatedCart[existingIndex].quantity += quantity;
        } else {
            updatedCart.push({
                id: product.id,
                title: product.title,
                image: itemImage,
                price: product.price,
                size: size,
                color: itemColor,
                selectedOptions: product.selectedOptions || {},
                quantity: quantity,
                category: product.category,
                sku: product.sku
            });
        }

        setCart(updatedCart);
        syncCartStorage(updatedCart);
        setSelectedProductId(null); // Close the ProductModal
        setIsCartOpen(true);
    };

    const handleRemoveCartItem = (index) => {
        const updatedCart = cart.filter((_, idx) => idx !== index);
        setCart(updatedCart);
        syncCartStorage(updatedCart);
    };

    const handleUpdateCartQuantity = (index, delta) => {
        let updatedCart = [...cart];
        updatedCart[index].quantity += delta;

        if (updatedCart[index].quantity <= 0) {
            updatedCart = updatedCart.filter((_, idx) => idx !== index);
        }

        setCart(updatedCart);
        syncCartStorage(updatedCart);
    };

    // 4. Place Booking Form Submission
    const handlePlaceBooking = async (customerDetails) => {
        const bookingPayload = {
            customer: customerDetails,
            items: cart
        };

        try {
            const response = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingPayload)
            });

            if (response.ok) {
                const orderData = await response.json();

                // Clear cart state
                setCart([]);
                localStorage.setItem('netrave_cart', JSON.stringify([]));

                setPlacedOrder(orderData);
                setIsCheckoutOpen(false);
                setIsSuccessOpen(true);

                // Sync bookings & products (to reflect decremented stock)
                fetchBookings();
                const res = await fetch(`${API_BASE_URL}/products`);
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data);
                }
            } else {
                const errData = await response.json();
                alert(`Booking Failed: ${errData.error || 'Unknown error occurred.'}`);
            }
        } catch (err) {
            console.error('API booking failed, attempting localStorage backup place...', err);

            // Backup offline fallback placement
            const backupOrderId = `TR-${Math.floor(100000 + Math.random() * 900000)}`;
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const delivery = subtotal >= 999 ? 0 : 60;
            const total = subtotal + delivery;

            const backupOrderRecord = {
                orderId: backupOrderId,
                date: new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                customer: customerDetails,
                items: [...cart],
                subtotal,
                delivery,
                total,
                status: 'Pending'
            };

            // Save to localStorage bookings list
            const currentLocalBookings = JSON.parse(localStorage.getItem('netrave_bookings')) || [];
            currentLocalBookings.unshift(backupOrderRecord);
            localStorage.setItem('netrave_bookings', JSON.stringify(currentLocalBookings));
            setBookings(currentLocalBookings);

            // Decrement offline fallback products stock in state
            const updatedProductsList = products.map(p => {
                const boughtItems = cart.filter(ci => ci.id === p.id);
                if (boughtItems.length > 0) {
                    const totalBoughtQty = boughtItems.reduce((sum, item) => sum + item.quantity, 0);
                    const newStock = Math.max(0, p.stock - totalBoughtQty);
                    return {
                        ...p,
                        stock: newStock,
                        inStock: newStock > 0 ? p.inStock : false
                    };
                }
                return p;
            });
            setProducts(updatedProductsList);

            // Reset cart
            setCart([]);
            localStorage.setItem('netrave_cart', JSON.stringify([]));

            setPlacedOrder(backupOrderRecord);
            setIsCheckoutOpen(false);
            setIsSuccessOpen(true);
        }
    };

    // 5. Admin Panel Modification Handlers
    const handleAddProduct = async (productPayload) => {
        try {
            const adminToken = getCookie('adminSessionToken');
            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(adminToken ? { 'x-admin-session': adminToken } : {})
                },
                body: JSON.stringify(productPayload)
            });
            if (response.ok) {
                const created = await response.json();
                setProducts(prev => [created, ...prev]);
                showToast('Product added successfully!', 'success');
                await fetchProducts();
            } else {
                showToast('Failed to save new product on server.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Backend offline. Product added locally only.', 'info');
            const nextId = products.reduce((max, p) => p.id > max ? p.id : max, 0) + 1;
            setProducts([{ id: nextId, ...productPayload, rating: 5, reviews: 0 }, ...products]);
        }
    };

    const handleEditProduct = async (id, productPayload) => {
        try {
            const adminToken = getCookie('adminSessionToken');
            const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(adminToken ? { 'x-admin-session': adminToken } : {})
                },
                body: JSON.stringify(productPayload)
            });
            if (response.ok) {
                const updated = await response.json();
                setProducts(prev => prev.map(p => p.id === id ? { ...p, ...productPayload, ...updated } : p));
                showToast('Product updated successfully!', 'success');
                await fetchProducts();
            } else {
                showToast('Failed to update product details.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Backend offline. Product updated locally only.', 'info');
            setProducts(products.map(p => p.id === id ? { ...p, ...productPayload } : p));
        }
    };

    const handleDeleteProduct = async (id) => {
        try {
            const adminToken = getCookie('adminSessionToken');
            const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'DELETE',
                headers: adminToken ? { 'x-admin-session': adminToken } : {}
            });
            if (response.ok) {
                setProducts(prev => prev.filter(p => p.id !== id));
                showToast('Product deleted successfully.', 'success');
                await fetchProducts();
            } else {
                showToast('Failed to delete product.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Backend offline. Product deleted locally only.', 'info');
            setProducts(products.filter(p => p.id !== id));
        }
    };

    const handleUpdateBookingStatus = async (orderId, newStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                fetchBookings();
                // Refresh products list in case booking was Cancelled (restores stock)
                const res = await fetch(`${API_BASE_URL}/products`);
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data);
                }
            } else {
                showToast('Failed to update booking status.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Backend offline. Booking status updated locally only.', 'info');
            setBookings(bookings.map(b => b.orderId === orderId ? { ...b, status: newStatus } : b));
        }
    };

    const handleSaveSettings = async (settingsPayload) => {
        try {
            const response = await fetch(`${API_BASE_URL}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsPayload)
            });
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
                showToast('Shop configurations saved successfully.', 'success');
            } else {
                showToast('Failed to save settings.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Backend offline. Configurations saved locally only.', 'info');
            setSettings(settingsPayload);
        }
    };

    // 6. Scroll trigger from Hero CTA
    const scrollToProducts = () => {
        setActiveCategory('all');
        const prodSection = document.getElementById('products');
        if (prodSection) {
            prodSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleSummerCtaClick = () => {
        setActiveCategory('summer-t-shirt');
        const prodSection = document.getElementById('products');
        if (prodSection) {
            prodSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const activeProduct = products.find(p => p.id === selectedProductId);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Conditional Admin Dashboard Rendering
    // Conditional Developer Page Rendering (removes storefront header/footer)
    if (isDeveloperOpen) {
        return (
            <DeveloperModal
                isOpen={isDeveloperOpen}
                API_BASE_URL={API_BASE_URL}
                showToast={showToast}
                onClose={() => {
                    setIsDeveloperOpen(false);
                    window.history.pushState({}, '', '/');
                }}
            />
        );
    }

    // Conditional Admin Dashboard Rendering (removes storefront header)
    if (isAdminView) {
        return (
            <div className="app-container">
                <main style={{ paddingTop: '20px' }}>
                    <AdminPanel
                        products={products}
                        categories={categories}
                        bookings={bookings}
                        settings={settings}
                        onAddProduct={handleAddProduct}
                        onEditProduct={handleEditProduct}
                        onDeleteProduct={handleDeleteProduct}
                        onUpdateBookingStatus={handleUpdateBookingStatus}
                        onSaveSettings={handleSaveSettings}
                        onRefreshCategories={fetchCategories}
                        onRefreshProducts={fetchProducts}
                        API_BASE_URL={API_BASE_URL}
                        showToast={showToast}
                        onClose={() => {
                            setIsAdminView(false);
                            window.history.pushState({}, '', '/');
                            fetchProducts();
                            fetchCategories();
                        }}
                    />
                </main>
                <footer className="main-footer">
                    <div className="footer-bottom">
                        <p>&copy; 2026 NETRAVE Store. All rights reserved. Admin Panel Dashboard.</p>
                    </div>
                </footer>
            </div>
        );
    }

    return (
        <div className="app-container">
            {/* Maintenance Mode Banner */}
            {settings.maintenanceMode && (
                <div className="maintenance-banner">
                    🚨 {settings.maintenanceMessage || 'Under scheduled maintenance.'}
                    {settings.maintenanceExpiry > 0 && <MaintenanceCountdown expiryTimestamp={settings.maintenanceExpiry} />}
                </div>
            )}

            {/* Offer Announcement Banner */}
            {(settings.offerNotification && !isOfferDismissed && !settings.maintenanceMode) && (
                <div className="offer-banner">
                    📢 {settings.offerNotification}
                    <button className="offer-close-btn" onClick={() => setIsOfferDismissed(true)}>×</button>
                </div>
            )}

            {/* Header Navigation */}
            <Header
                cartCount={cartCount}
                wishlistCount={wishlist.length}
                onWishlistOpen={() => setIsWishlistOpen(true)}
                onTrackingOpen={() => handleOpenTracking()}
                onCartOpen={() => setIsCartOpen(true)}
                onBookingsOpen={() => setIsBookingsOpen(true)}
                onProfileOpen={() => setIsProfileOpen(true)}
                activeCategory={activeCategory}
                onCategoryChange={(catId) => {
                    setActiveCategory(catId);
                    setActiveTag(null); // clear tag when category changes
                }}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                mobileDrawerOpen={mobileDrawerOpen}
                setMobileDrawerOpen={setMobileDrawerOpen}
                activeTag={activeTag}
                onTagChange={(tag) => {
                    setActiveTag(tag);
                    setActiveCategory('all'); // reset category to all when filtering by tag
                }}
                setIsAdminView={setIsAdminView}
                onSortChange={setSortMethod}
                user={user}
                onLogout={handleLogout}
                onLoginClick={() => setIsAuthOpen(true)}
                categories={categories}
                products={products.length > 0 ? products : FALLBACK_PRODUCTS}
            />

            {/* Main Area */}
            <main>
                <Hero
                    onShopClick={scrollToProducts}
                    onSummerClick={handleSummerCtaClick}
                />
                <HomeSections
                    categories={categories}
                    products={products.length > 0 ? products : FALLBACK_PRODUCTS}
                    onSelectCategory={(catSlug) => {
                        setActiveCategory(catSlug);
                        scrollToProducts();
                    }}
                    onQuickView={setSelectedProductId}
                    wishlist={wishlist}
                    onToggleWishlist={handleToggleWishlist}
                    onShopClick={scrollToProducts}
                />
                <ProductGrid
                    products={products}
                    categories={categories}
                    loading={loadingProducts}
                    activeCategory={activeCategory}
                    onCategoryChange={(catId) => {
                        setActiveCategory(catId);
                        setActiveTag(null);
                    }}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    sortMethod={sortMethod}
                    onSortChange={setSortMethod}
                    onQuickView={setSelectedProductId}
                    activeTag={activeTag}
                    onTagChange={setActiveTag}
                    wishlist={wishlist}
                    onToggleWishlist={handleToggleWishlist}
                />
            </main>

            {/* Footer */}
            <footer className="main-footer">
                <div className="footer-container">
                    <div className="footer-info">
                        <div className="logo" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src="/assets/logo.png" alt="NETRAVE Logo" className="logo-img" style={{ height: '42px' }} />
                            <div className="logo-text" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="logo-accent" style={{ fontSize: '20px', display: 'flex' }}>
                                    <span className="logo-net">NET</span>
                                    <span className="logo-rave" style={{ color: 'var(--primary)' }}>RAVE</span>
                                </div>
                                <span className="logo-sub" style={{ fontSize: '8px', letterSpacing: '1.5px', color: 'var(--primary)' }}>CLOTHING & STYLE</span>
                            </div>
                        </div>
                        <p>We supply high quality men's shirts, custom streetwear t-shirts, and stylish summer apparel.</p>
                        <div className="social-links">
                            <a href="#" aria-label="Instagram" className="social-icon-card">
                                <svg viewBox="0 0 24 24" className="icon"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
                            </a>
                            <a href="#" aria-label="WhatsApp" className="social-icon-card">
                                <svg viewBox="0 0 24 24" className="icon"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.248 8.477 3.517 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.453 5.461 0 9.903-4.44 9.907-9.902.002-2.646-1.02-5.133-2.873-6.988C16.591 1.862 14.103.839 11.45.839c-5.463 0-9.904 4.44-9.908 9.9.001 2.072.547 4.093 1.59 5.891L2.162 21.8l5.588-1.464-.103-.182zM17.06 14.382c-.272-.136-1.61-.794-1.86-.885-.25-.092-.432-.136-.613.136-.18.273-.704.885-.863 1.067-.159.182-.318.204-.59.068-.272-.136-1.15-.424-2.19-1.353-.81-.722-1.357-1.615-1.516-1.888-.159-.272-.017-.42.12-.556.122-.123.272-.318.408-.477.136-.159.182-.272.272-.454.09-.182.046-.341-.023-.477-.068-.136-.613-1.477-.84-2.022-.222-.533-.487-.463-.66-.463-.17 0-.363-.01-.556-.01-.193 0-.51.072-.777.363-.267.292-1.02 1.002-1.02 2.445 0 1.442 1.049 2.836 1.196 3.033.147.197 2.062 3.148 4.996 4.413.698.302 1.243.482 1.668.617.7.223 1.338.192 1.843.117.562-.083 1.61-.659 1.838-1.295.228-.636.228-1.182.159-1.295-.068-.114-.25-.205-.523-.341z" /></svg>
                            </a>
                            <a href="#" aria-label="Facebook" className="social-icon-card">
                                <svg viewBox="0 0 24 24" className="icon"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            </a>
                        </div>
                    </div>

                    <div className="footer-links">
                        <h4>Shop Categories</h4>
                        <ul>
                            <li>
                                <button className="footer-cat-link" onClick={() => { setActiveCategory('summer-t-shirt'); scrollToProducts(); }}>
                                    Summer T-Shirts
                                </button>
                            </li>
                            <li>
                                <button className="footer-cat-link" onClick={() => { setActiveCategory('t-shirt'); scrollToProducts(); }}>
                                    T-Shirts Collection
                                </button>
                            </li>
                            <li>
                                <button className="footer-cat-link" onClick={() => { setActiveCategory('shirt'); scrollToProducts(); }}>
                                    Casual & Formal Shirts
                                </button>
                            </li>
                            <li>
                                <button className="footer-cat-link" onClick={() => { setActiveCategory('pants'); scrollToProducts(); }}>
                                    Cargoes & Chinos
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div className="footer-contact">
                        <h4>Contact Us</h4>
                        <p>📍 Kozhikode, Kerala, 673001</p>
                        <p>📞 Phone: +91 99465 50713</p>
                        <p>💬 WhatsApp Support: +91 99465 50713</p>
                        <p>✉️ Email: netrave@zohomail.com</p>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2026 NETRAVE Store. All rights reserved. Designed for fashion enthusiasts in Kerala.</p>
                </div>
            </footer>

            {/* Intermediary Modals & Drawers */}
            <ProductModal
                isOpen={selectedProductId !== null}
                product={activeProduct}
                allProducts={products.length > 0 ? products : FALLBACK_PRODUCTS}
                onClose={() => setSelectedProductId(null)}
                onAddToCart={handleAddToCart}
                onBuyNow={(prod, size, q) => {
                    handleAddToCart(prod, size, q);
                    setSelectedProductId(null);
                    if (!user) {
                        showToast('Please login or register to complete your purchase.', 'info');
                        setPendingCheckout(true);
                        setIsAuthOpen(true);
                    } else {
                        setIsCheckoutOpen(true);
                    }
                }}
                isWishlisted={wishlist.includes(selectedProductId)}
                onToggleWishlist={handleToggleWishlist}
                onQuickView={setSelectedProductId}
                API_BASE_URL={API_BASE_URL}
            />

            <CartDrawer
                isOpen={isCartOpen}
                cart={cart}
                onClose={() => setIsCartOpen(false)}
                onRemoveItem={handleRemoveCartItem}
                onUpdateQuantity={handleUpdateCartQuantity}
                onCheckoutTrigger={() => {
                    if (settings.maintenanceMode) {
                        showToast('Shop is currently undergoing maintenance. Checkout is temporarily disabled.', 'error');
                        return;
                    }
                    if (!user) {
                        showToast('Please login or register to place your order.', 'info');
                        setPendingCheckout(true);
                        setIsAuthOpen(true);
                        setIsCartOpen(false);
                    } else {
                        setIsCheckoutOpen(true);
                        setIsCartOpen(false);
                    }
                }}
            />

            <CheckoutModal
                isOpen={isCheckoutOpen}
                cart={cart}
                onClose={() => setIsCheckoutOpen(false)}
                onSubmitBooking={handlePlaceBooking}
                user={user}
                API_BASE_URL={API_BASE_URL}
                settings={settings}
                onRazorpaySuccess={(orderData) => {
                    setCart([]);
                    localStorage.setItem('netrave_cart', JSON.stringify([]));
                    setPlacedOrder(orderData);
                    setIsCheckoutOpen(false);
                    setIsSuccessOpen(true);
                    fetchBookings();
                    fetch(`${API_BASE_URL}/products`)
                        .then(res => res.ok ? res.json() : null)
                        .then(data => { if (data) setProducts(data); })
                        .catch(console.error);
                }}
            />

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => {
                    setIsAuthOpen(false);
                    setPendingCheckout(false);
                }}
                onAuthSuccess={handleAuthSuccess}
                API_BASE_URL={API_BASE_URL}
                settings={settings}
            />

            <SuccessModal
                isOpen={isSuccessOpen}
                order={placedOrder}
                whatsappNumber={settings?.whatsappNumber}
                onClose={() => setIsSuccessOpen(false)}
                onTrackOrder={handleOpenTracking}
            />

            <BookingsModal
                isOpen={isBookingsOpen}
                bookings={bookings}
                user={user}
                onCancelSuccess={fetchBookings}
                whatsappNumber={settings?.whatsappNumber}
                onClose={() => setIsBookingsOpen(false)}
                onOpenTracking={handleOpenTracking}
                API_BASE_URL={API_BASE_URL}
            />

            <TrackingModal
                isOpen={isTrackingOpen}
                initialQuery={trackingQuery}
                user={user}
                bookings={bookings}
                onClose={() => setIsTrackingOpen(false)}
                API_BASE_URL={API_BASE_URL}
                onShopClick={scrollToProducts}
            />

            <WishlistModal
                isOpen={isWishlistOpen}
                wishlist={wishlist}
                products={products.length > 0 ? products : FALLBACK_PRODUCTS}
                onClose={() => setIsWishlistOpen(false)}
                onRemoveFromWishlist={(id) => setWishlist(prev => prev.filter(wId => wId !== id))}
                onAddToCart={(prod) => {
                    handleAddToCart(prod, prod.sizes?.[0] || 'M', 1);
                }}
                onQuickView={(id) => {
                    setIsWishlistOpen(false);
                    setSelectedProductId(id);
                }}
            />

            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={user}
                bookings={bookings}
                cartItems={cart}
                cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
                onOpenCart={() => {
                    setIsProfileOpen(false);
                    setIsCartOpen(true);
                }}
                whatsappNumber={settings?.whatsappNumber}
                onUpdateUser={(updated) => {
                    setUser(updated);
                    setCookie('netrave_user', updated);
                }}
                onViewOrders={() => {
                    setIsProfileOpen(false);
                    setIsBookingsOpen(true);
                }}
                onLogout={handleLogout}
                API_BASE_URL={API_BASE_URL}
                showToast={showToast}
            />

            {/* Mobile Bottom Navigation Bar completely removed */}
            {toast.visible && (
                <div className={`toast-container visible toast-${toast.type}`}>
                    <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
                    <div>{toast.message}</div>
                </div>
            )}
        </div>
    );
}
