import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Hero from './components/Hero';
import HomeSections from './components/HomeSections';
import ProductGrid from './components/ProductGrid';
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
import CategoryPage from './components/CategoryPage';
import ProductDetailPage from './components/ProductDetailPage';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import AuthPages from './components/AuthPages';
import OrderTrackingPage from './components/OrderTrackingPage';
import MyOrdersPage from './components/MyOrdersPage';
import MyAccountPage from './components/MyAccountPage';
import WishlistPage from './components/WishlistPage';
import OffersPage from './components/OffersPage';
import SearchPage from './components/SearchPage';
import AddressManagementPage from './components/AddressManagementPage';
import BottomNav from './components/BottomNav';
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
            "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80"
        ],
        shortDescription: "Traditional lustrous pure art silk saree with intricate golden zari floral pallu.",
        description: "Exclusively handwoven with rich golden zari borders and intricate floral peacock motifs across the regal pallu.",
        sizes: ["Free Size (5.5m + 0.8m)"],
        colors: ["Royal Maroon", "Emerald Green", "Peacock Blue"],
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
            },
            {
                color: "Peacock Blue",
                hex: "#0284c7",
                image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80"]
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
        images: [
            "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80"
        ],
        shortDescription: "Full-flair georgette Anarkali kurti with intricate sequin yoke and organza dupatta.",
        description: "Elevate your ethnic fashion with this graceful Anarkali suit set with hand-worked sequin neckline.",
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Dusty Rose Pink", "Mustard Gold", "Sky Blue"],
        colorVariants: [
            {
                color: "Dusty Rose Pink",
                hex: "#f472b6",
                image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80"]
            },
            {
                color: "Mustard Gold",
                hex: "#eab308",
                image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80"]
            },
            {
                color: "Sky Blue",
                hex: "#38bdf8",
                image: "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600&auto=format&fit=crop&q=80"]
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
        colors: ["Matte Black", "Army Olive"],
        colorVariants: [
            {
                color: "Matte Black",
                hex: "#111827",
                image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80"]
            },
            {
                color: "Army Olive",
                hex: "#4b5320",
                image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80"]
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
        colors: ["Sage Green", "Sky Blue"],
        colorVariants: [
            {
                color: "Sage Green",
                hex: "#4d7c0f",
                image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80"]
            },
            {
                color: "Sky Blue",
                hex: "#38bdf8",
                image: "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600&auto=format&fit=crop&q=80"]
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
        colors: ["Matte Black", "Desert Khaki"],
        colorVariants: [
            {
                color: "Matte Black",
                hex: "#111827",
                image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80"]
            },
            {
                color: "Desert Khaki",
                hex: "#a8896c",
                image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
                images: ["https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80"]
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

    // F. Modern Dedicated View Navigation State
    const [currentPage, setCurrentPage] = useState('home');
    const [pageParams, setPageParams] = useState({});

    const navigate = (page, params = {}) => {
        setCurrentPage(page);
        setPageParams(params);
        if (page === 'category') {
            if (params.category) {
                setActiveCategory(params.category);
            }
            setSelectedProductId(null);
        } else if (page === 'product' && params.id) {
            setSelectedProductId(params.id);
        } else {
            setSelectedProductId(null);
        }
        if (page === 'search' && params.query) {
            setSearchQuery(params.query);
        }
        const hash = page === 'home' 
            ? '' 
            : page === 'category' 
                ? (params.category && params.category !== 'all' ? `#/category/${params.category}` : '#/category')
                : `#/${page}${params.id ? '/' + params.id : ''}`;
        window.history.pushState({}, '', hash || '/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const handleHash = () => {
            const raw = window.location.hash.replace(/^#\/?/, '');
            if (!raw) {
                setCurrentPage('home');
                setPageParams({});
                setSelectedProductId(null);
            } else {
                const parts = raw.split('/');
                const p = parts[0];
                const id = parts[1];
                setCurrentPage(p);
                if (p === 'product' && id) {
                    setSelectedProductId(Number(id));
                } else if (p === 'category') {
                    setSelectedProductId(null);
                    if (id) {
                        setActiveCategory(id);
                    }
                } else {
                    setSelectedProductId(null);
                }
            }
        };
        handleHash();
        window.addEventListener('hashchange', handleHash);
        return () => window.removeEventListener('hashchange', handleHash);
    }, []);

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

    const allAvailableProds = products.length > 0 ? products : FALLBACK_PRODUCTS;
    const activeProduct = allAvailableProds.find(p => String(p.id) === String(selectedProductId)) || allAvailableProds[0];
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

    // Conditional Admin Dashboard Rendering (Full-screen standalone layout)
    if (isAdminView) {
        return (
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
            {(!['login', 'signup', 'forgot-password'].includes(currentPage) && settings.offerNotification && !isOfferDismissed && !settings.maintenanceMode) && (
                <div className="offer-banner">
                    📢 {settings.offerNotification}
                    <button className="offer-close-btn" onClick={() => setIsOfferDismissed(true)}>×</button>
                </div>
            )}

            {/* Header Navigation */}
            {!['login', 'signup', 'forgot-password'].includes(currentPage) && (
                <Header
                    currentPage={currentPage}
                    cartCount={cartCount}
                    wishlistCount={wishlist.length}
                    onWishlistOpen={() => navigate('wishlist')}
                    onTrackingOpen={() => navigate('tracking')}
                    onCartOpen={() => navigate('cart')}
                    onBookingsOpen={() => navigate('orders')}
                    onProfileOpen={() => navigate('account')}
                    activeCategory={activeCategory}
                    onCategoryChange={(catId) => {
                        setActiveCategory(catId);
                        setActiveTag(null);
                        navigate('category', { category: catId });
                    }}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    mobileDrawerOpen={mobileDrawerOpen}
                    setMobileDrawerOpen={setMobileDrawerOpen}
                    activeTag={activeTag}
                    onTagChange={(tag) => {
                        setActiveTag(tag);
                        setActiveCategory('all');
                    }}
                    setIsAdminView={setIsAdminView}
                    onSortChange={setSortMethod}
                    user={user}
                    onLogout={handleLogout}
                    onLoginClick={() => navigate('login')}
                    onNavigate={navigate}
                    categories={categories}
                    products={products.length > 0 ? products : FALLBACK_PRODUCTS}
                />
            )}

            {/* Main Area: 15 Dedicated Page Views */}
            <main className="netrave-main-viewport">
                {currentPage === 'home' && (
                    <>
                        <Hero
                            onShopClick={scrollToProducts}
                            onNavigateCategory={(cat) => navigate('category', { category: cat })}
                        />
                        <HomeSections
                            categories={categories}
                            products={products.length > 0 ? products : FALLBACK_PRODUCTS}
                            onSelectCategory={(catSlug) => {
                                setActiveCategory(catSlug);
                                navigate('category', { category: catSlug });
                            }}
                            onQuickView={(id) => navigate('product', { id })}
                            wishlist={wishlist}
                            onToggleWishlist={handleToggleWishlist}
                            onAddToCart={handleAddToCart}
                            onShopClick={scrollToProducts}
                            onNavigate={navigate}
                        />
                        <div id="products">
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
                                onQuickView={(id) => navigate('product', { id })}
                                activeTag={activeTag}
                                onTagChange={setActiveTag}
                                wishlist={wishlist}
                                onToggleWishlist={handleToggleWishlist}
                                onAddToCart={handleAddToCart}
                            />
                        </div>
                    </>
                )}

                {currentPage === 'category' && (
                    <CategoryPage
                        products={products.length > 0 ? products : FALLBACK_PRODUCTS}
                        categories={categories}
                        initialCategory={activeCategory}
                        onQuickView={(id) => navigate('product', { id })}
                        wishlist={wishlist}
                        onToggleWishlist={handleToggleWishlist}
                        onAddToCart={handleAddToCart}
                        onNavigate={navigate}
                    />
                )}

                {currentPage === 'product' && (
                    <ProductDetailPage
                        product={activeProduct || (products.length > 0 ? products[0] : FALLBACK_PRODUCTS[0])}
                        allProducts={products.length > 0 ? products : FALLBACK_PRODUCTS}
                        onAddToCart={handleAddToCart}
                        onBuyNow={(prod, size, q, col) => {
                            handleAddToCart(prod, size, q, col);
                            if (!user) {
                                showToast('Please login to complete your checkout.', 'info');
                                navigate('login');
                            } else {
                                navigate('checkout');
                            }
                        }}
                        isWishlisted={wishlist.includes(selectedProductId || activeProduct?.id)}
                        onToggleWishlist={handleToggleWishlist}
                        onNavigate={navigate}
                        onQuickView={(id) => navigate('product', { id })}
                    />
                )}

                {currentPage === 'cart' && (
                    <CartPage
                        cart={cart}
                        onUpdateQuantity={handleUpdateCartQuantity}
                        onRemoveItem={handleRemoveCartItem}
                        onProceedToCheckout={() => {
                            if (settings.maintenanceMode) {
                                showToast('Shop is currently undergoing maintenance. Checkout is disabled.', 'error');
                                return;
                            }
                            if (!user) {
                                showToast('Please login to place your order.', 'info');
                                navigate('login');
                            } else {
                                navigate('checkout');
                            }
                        }}
                        onMoveToWishlist={(id) => {
                            if (!wishlist.includes(id)) {
                                setWishlist(prev => [...prev, id]);
                                showToast('Moved to Wishlist', 'success');
                            }
                        }}
                        onNavigate={navigate}
                    />
                )}

                {currentPage === 'checkout' && (
                    <CheckoutPage
                        cart={cart}
                        user={user}
                        onSubmitBooking={handlePlaceBooking}
                        onRazorpaySuccess={(orderData) => {
                            setCart([]);
                            localStorage.setItem('netrave_cart', JSON.stringify([]));
                            if (user?.phone) {
                                try {
                                    localStorage.setItem(`netrave_user_cart_${user.phone}`, JSON.stringify([]));
                                } catch (e) {
                                    console.error(e);
                                }
                            }
                            setPlacedOrder(orderData);
                            setIsSuccessOpen(true);
                            navigate('home');
                            fetchBookings();
                            fetch(`${API_BASE_URL}/products`)
                                .then(res => res.ok ? res.json() : null)
                                .then(data => { if (data) setProducts(data); })
                                .catch(console.error);
                        }}
                        onNavigate={navigate}
                        settings={settings}
                        API_BASE_URL={API_BASE_URL}
                    />
                )}

                {currentPage === 'login' && (
                    <AuthPages
                        initialMode="login"
                        onAuthSuccess={handleAuthSuccess}
                        onNavigate={navigate}
                        API_BASE_URL={API_BASE_URL}
                        settings={settings}
                    />
                )}

                {currentPage === 'signup' && (
                    <AuthPages
                        initialMode="signup"
                        onAuthSuccess={handleAuthSuccess}
                        onNavigate={navigate}
                        API_BASE_URL={API_BASE_URL}
                        settings={settings}
                    />
                )}

                {currentPage === 'forgot-password' && (
                    <AuthPages
                        initialMode="forgot"
                        onAuthSuccess={handleAuthSuccess}
                        onNavigate={navigate}
                        API_BASE_URL={API_BASE_URL}
                        settings={settings}
                    />
                )}

                {currentPage === 'tracking' && (
                    <OrderTrackingPage
                        initialQuery={trackingQuery}
                        bookings={bookings}
                        onNavigate={navigate}
                    />
                )}

                {currentPage === 'orders' && (
                    <MyOrdersPage
                        bookings={bookings}
                        user={user}
                        onNavigate={navigate}
                        onAddToCart={handleAddToCart}
                    />
                )}

                {currentPage === 'account' && (
                    <MyAccountPage
                        user={user}
                        bookings={bookings}
                        cart={cart}
                        cartCount={cartCount}
                        wishlist={wishlist}
                        onLogout={handleLogout}
                        onNavigate={navigate}
                        onAddToCart={handleAddToCart}
                        onUpdateUser={(updated) => {
                            setUser(updated);
                            setCookie('netrave_user', updated);
                        }}
                        onOpenLogin={() => setIsAuthOpen(true)}
                        API_BASE_URL={API_BASE_URL}
                        showToast={showToast}
                        initialTab={pageParams.tab || 'profile'}
                    />
                )}

                {currentPage === 'wishlist' && (
                    <WishlistPage
                        wishlist={wishlist}
                        products={products.length > 0 ? products : FALLBACK_PRODUCTS}
                        onQuickView={(id) => navigate('product', { id })}
                        onToggleWishlist={handleToggleWishlist}
                        onAddToCart={handleAddToCart}
                        onNavigate={navigate}
                    />
                )}

                {currentPage === 'offers' && (
                    <OffersPage
                        products={products.length > 0 ? products : FALLBACK_PRODUCTS}
                        onQuickView={(id) => navigate('product', { id })}
                        wishlist={wishlist}
                        onToggleWishlist={handleToggleWishlist}
                        onAddToCart={handleAddToCart}
                        onNavigate={navigate}
                    />
                )}

                {currentPage === 'search' && (
                    <SearchPage
                        products={products.length > 0 ? products : FALLBACK_PRODUCTS}
                        initialQuery={pageParams.query || searchQuery}
                        onQuickView={(id) => navigate('product', { id })}
                        wishlist={wishlist}
                        onToggleWishlist={handleToggleWishlist}
                        onAddToCart={handleAddToCart}
                        onNavigate={navigate}
                    />
                )}

                {currentPage === 'addresses' && (
                    <AddressManagementPage
                        user={user}
                        onNavigate={navigate}
                    />
                )}
            </main>

            {/* Dedicated Modern Footer with Preserved Logo */}
            {!['login', 'signup', 'forgot-password'].includes(currentPage) && (
                <Footer onNavigate={navigate} categories={categories} />
            )}

            {/* Intermediary Modals & Drawers */}
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
                        navigate('checkout');
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

            {/* Mobile Bottom Navigation Bar Matching Reference */}
            {currentPage !== 'product' && currentPage !== 'checkout' && !['login', 'signup', 'forgot-password'].includes(currentPage) && (
                <BottomNav
                    currentPage={currentPage}
                    cartCount={cart.reduce((sum, item) => sum + (item.quantity || 1), 0)}
                    wishlistCount={wishlist.length}
                    user={user}
                    onNavigate={navigate}
                    onLoginClick={() => navigate('login')}
                />
            )}

            {toast.visible && (
                <div className={`toast-container visible toast-${toast.type}`}>
                    <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
                    <div>{toast.message}</div>
                </div>
            )}
        </div>
    );
}
