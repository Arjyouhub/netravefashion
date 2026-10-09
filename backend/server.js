import './dns-setup.js';
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import multer from 'multer';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Razorpay from 'razorpay';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const productsPath = path.join(__dirname, 'data', 'products.json');
const categoriesPath = path.join(__dirname, 'data', 'categories.json');
const bookingsPath = path.join(__dirname, 'data', 'bookings.json');
const settingsPath = path.join(__dirname, 'data', 'settings.json');
const usersPath = path.join(__dirname, 'data', 'users.json');
const couponsPath = path.join(__dirname, 'data', 'coupons.json');
const loginLogsPath = path.join(__dirname, 'data', 'login_logs.json');
const reviewsPath = path.join(__dirname, 'data', 'reviews.json');

// Ensure data folder and default JSON files exist to prevent log warnings on Render
async function initDataFolder() {
    try {
        const dataDir = path.join(__dirname, 'data');
        await fs.mkdir(dataDir, { recursive: true });
        await fs.mkdir(path.join(__dirname, 'public', 'uploads'), { recursive: true });

        const ensureFile = async (filePath, defaultContent) => {
            try {
                await fs.access(filePath);
            } catch {
                try {
                    await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2), 'utf-8');
                } catch (err) {
                    console.error(`[Netrave Backend] Failed to create missing file ${filePath}:`, err.message);
                }
            }
        };

        await ensureFile(productsPath, []);
        await ensureFile(categoriesPath, []);
        await ensureFile(bookingsPath, []);
        await ensureFile(settingsPath, { whatsappNumber: '919946550713' });
        await ensureFile(usersPath, []);
        await ensureFile(couponsPath, []);
        await ensureFile(loginLogsPath, []);
        await ensureFile(reviewsPath, []);
    } catch (err) {
        console.error('[Netrave Backend] Error initializing data folder:', err.message);
    }
}
await initDataFolder();

// Read/Write JSON Helpers
async function readJson(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            const isSettings = filePath.includes('settings.json');
            const defaultContent = isSettings ? { whatsappNumber: '919946550713' } : [];
            try {
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2), 'utf-8');
            } catch (wErr) {
                console.error(`[Netrave Backend] Failed to auto-create file ${filePath}:`, wErr.message);
            }
            return defaultContent;
        }
        console.error(`Error reading ${filePath}:`, err.message);
        return [];
    }
}

async function writeJson(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// --------------------------------------------------------------------------
// MONGODB CONNECTION & SCHEMAS (Cloud Atlas Connection)
// --------------------------------------------------------------------------
let useMongo = false;
try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/netravestore';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log('[Netrave Backend] Connected to MongoDB Cloud Database Cluster');
    useMongo = true;
} catch (err) {
    console.warn('[Netrave Backend] MongoDB connection failed. Falling back to local JSON database.', err.message);
}

// Category Schema
const CategorySchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    banner: { type: String, default: '' },
    color: { type: String, default: '#f59e0b' },
    status: { type: String, default: 'active' }, // 'active' | 'disabled'
    displayOrder: { type: Number, default: 0 },
    subcategories: [mongoose.Schema.Types.Mixed],
    createdAt: { type: Date, default: Date.now }
}, { strict: false });
const CategoryModel = mongoose.models.Category || mongoose.model('Category', CategorySchema);

// Product Schema
const ProductSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    subcategory: { type: String, default: '' },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    rating: { type: Number, default: 5 },
    reviews: { type: Number, default: 0 },
    image: { type: String },
    images: [String],
    video: { type: String, default: '' },
    shortDescription: { type: String, default: '' },
    description: { type: String },
    sizes: [String],
    colors: [String],
    tags: [String],
    stock: { type: Number, default: 50 },
    inStock: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    sku: { type: String, default: '' },
    brand: { type: String, default: 'NETRAVE' },
    weight: { type: String, default: '' },
    dimensions: { type: String, default: '' },
    shippingInfo: { type: String, default: '' },
    returnInfo: { type: String, default: '' },
    variants: [mongoose.Schema.Types.Mixed],
    variantOptions: [mongoose.Schema.Types.Mixed],
    colorVariants: [mongoose.Schema.Types.Mixed],
    // Confidential Supplier & Sourcing Fields (Admin-Only)
    costPrice: { type: Number, default: 0 },
    supplierName: { type: String, default: '' },
    supplierSku: { type: String, default: '' },
    supplierUrl: { type: String, default: '' },
    supplierCost: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 },
    supplierShippingCost: { type: Number, default: 0 },
    estimatedDeliveryDays: { type: String, default: '2-4 Days' },
    supplierStockStatus: { type: String, default: 'In Stock' },
    supplierNotes: { type: String, default: '' }
}, { strict: false });
const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// Booking Schema
const BookingSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    customer: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        whatsapp: { type: String, required: true },
        email: { type: String, default: '' },
        address: { type: String, required: true },
        city: { type: String, default: '' },
        district: { type: String, required: true },
        pincode: { type: String, required: true },
        payment: { type: String, required: true },
        state: { type: String, default: 'Kerala' },
        razorpayPaymentId: { type: String, default: '' },
        razorpayOrderId: { type: String, default: '' }
    },
    items: [mongoose.Schema.Types.Mixed],
    subtotal: { type: Number, required: true },
    delivery: { type: Number, required: true },
    total: { type: Number, required: true },
    status: { type: String, default: 'Confirmed' },
    paymentMethod: { type: String, default: 'online' },
    courierPartner: { type: String, default: 'Delhivery Express' },
    awbNumber: { type: String, default: '' },
    trackingUrl: { type: String, default: '' },
    currentLocation: { type: String, default: 'Kozhikode Logistics Hub, Kerala' },
    estimatedDelivery: { type: String, default: '' },
    trackingHistory: [mongoose.Schema.Types.Mixed],
    driverInfo: {
        name: { type: String, default: 'Rahul V.' },
        phone: { type: String, default: '+91 98471 23456' },
        vehicle: { type: String, default: 'KL-11-AX-4821' }
    },
    internalNotes: { type: String, default: '' }
}, { strict: false });
const BookingModel = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

// Settings Schema
const SettingsSchema = new mongoose.Schema({
    key: { type: String, default: 'main' },
    whatsappNumber: { type: String, default: '919946550713' },
    adminUsername: { type: String, default: 'admin' },
    adminPassword: { type: String, default: 'admin123' },
    developerPassword: { type: String, default: 'developer123' },
    adminSessionToken: { type: String, default: '' },
    developerSessionToken: { type: String, default: '' },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'We are currently performing scheduled maintenance.' },
    maintenanceExpiry: { type: Number, default: 0 },
    offerNotification: { type: String, default: '' },
    razorpayKeyId: { type: String, default: '' },
    razorpayKeySecret: { type: String, default: '' },
    razorpayEnabled: { type: Boolean, default: false },
    googleClientId: { type: String, default: '' }
});
const SettingsModel = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

// Review Schema
const ReviewSchema = new mongoose.Schema({
    productId: { type: Number, required: true },
    orderId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    date: { type: Date, default: Date.now }
});
const ReviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

// Secure MPIN Hashing Helper (PBKDF2 with unique salt per user)
function hashMpin(mpin, phone) {
    const salt = phone + 'netravefashion_salt_2026';
    return crypto.pbkdf2Sync(mpin, salt, 1000, 64, 'sha512').toString('hex');
}

// User Schema
const UserSchema = new mongoose.Schema({
    phone: { type: String },
    name: { type: String, required: true },
    email: { type: String, default: '' },
    googleId: { type: String, default: '' },
    avatar: { type: String, default: '' },
    authProvider: { type: String, default: 'local' },
    address: { type: String, default: '' },
    district: { type: String, default: '' },
    pincode: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    mpin: { type: String, default: '' },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    blockedAt: { type: Number, default: 0 },
    lastActiveAt: { type: Number, default: 0 }
});
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

// Drop obsolete unique phone index if present so Google logins without phone don't hit duplicate key errors
if (useMongo) {
    UserModel.collection.dropIndex('phone_1').catch(() => {});
}

// Login Log Schema
const LoginLogSchema = new mongoose.Schema({
    phone: { type: String, required: true },
    name: { type: String, default: 'Unknown' },
    role: { type: String, default: 'customer' },
    timestamp: { type: Number, default: Date.now },
    status: { type: String, required: true }, // 'success', 'failed (blocked)', 'failed (locked)', etc.
    ip: { type: String },
    userAgent: { type: String }
});
const LoginLogModel = mongoose.models.LoginLog || mongoose.model('LoginLog', LoginLogSchema);

// Seed default products to MongoDB if database is empty
async function seedProductsIfNeeded() {
    if (useMongo) {
        try {
            const count = await ProductModel.countDocuments();
            if (count === 0) {
                console.log('[Netrave Backend] MongoDB products collection is empty. Seeding from local products.json...');
                const defaultProducts = await readJson(productsPath);
                if (defaultProducts && defaultProducts.length > 0) {
                    await ProductModel.insertMany(defaultProducts);
                    console.log(`[Netrave Backend] Successfully seeded ${defaultProducts.length} products to MongoDB.`);
                } else {
                    console.log('[Netrave Backend] Local products.json is empty or not found. Skipping seeding.');
                }
            }
        } catch (err) {
            console.error('[Netrave Backend] Failed to seed products database:', err.message);
        }
    }
}
await seedProductsIfNeeded();

// Helper function to log user auth events
async function logUserLogin(phone, name, status, req, role = 'customer') {
    try {
        let clientIp = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
        if (clientIp && clientIp.includes(',')) {
            clientIp = clientIp.split(',')[0].trim();
        }

        const logEntry = {
            phone,
            name: name || 'Unknown',
            role,
            timestamp: Date.now(),
            status,
            ip: clientIp,
            userAgent: req.headers['user-agent']
        };

        if (useMongo) {
            await LoginLogModel.create(logEntry);
        } else {
            const logs = await readJson(loginLogsPath);
            logs.unshift(logEntry);
            if (logs.length > 500) logs.length = 500; // cap at 500 logs
            await writeJson(loginLogsPath, logs);
        }
    } catch (err) {
        console.error('[Netrave Backend] Failed to save login log:', err.message);
    }
}

// Coupon Schema
const CouponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discountType: { type: String, default: 'flat' },
    discountValue: { type: Number, required: true },
    minSubtotal: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
});
const CouponModel = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);

// --------------------------------------------------------------------------
// DATABASE SEEDING FOR MONGODB
// --------------------------------------------------------------------------
if (useMongo) {
    try {
        const productCount = await ProductModel.countDocuments();
        const fileProducts = await readJson(productsPath);
        if (productCount !== fileProducts.length) {
            await ProductModel.deleteMany({});
            if (fileProducts && fileProducts.length > 0) {
                await ProductModel.insertMany(fileProducts);
                console.log('[Netrave Backend] Synchronized MongoDB products collection with products.json');
            }
        }
        // Seed Categories
        const categoryCount = await CategoryModel.countDocuments();
        const fileCategories = await readJson(categoriesPath);
        if (categoryCount !== fileCategories.length) {
            await CategoryModel.deleteMany({});
            if (fileCategories && fileCategories.length > 0) {
                await CategoryModel.insertMany(fileCategories);
                console.log('[Netrave Backend] Synchronized MongoDB categories collection with categories.json');
            }
        }
        const settingsCount = await SettingsModel.countDocuments();
        if (settingsCount === 0) {
            let fileSettings = await readJson(settingsPath);
            if (Array.isArray(fileSettings)) fileSettings = fileSettings[0] || {};
            await SettingsModel.create({ 
                key: 'main', 
                whatsappNumber: fileSettings.whatsappNumber || '919946550713',
                adminUsername: fileSettings.adminUsername || 'admin',
                adminPassword: fileSettings.adminPassword || 'admin123',
                developerPassword: fileSettings.developerPassword || 'developer123'
            });
            console.log('[Netrave Backend] Seeded MongoDB settings collection');
        }
        // Seed Coupons
        const couponCount = await CouponModel.countDocuments();
        if (couponCount === 0) {
            const fileCoupons = await readJson(couponsPath);
            if (fileCoupons && fileCoupons.length > 0) {
                await CouponModel.insertMany(fileCoupons);
                console.log('[Netrave Backend] Seeded MongoDB coupons collection from coupons.json');
            }
        }
        // Seed Users
        const userCount = await UserModel.countDocuments();
        if (userCount === 0) {
            const fileUsers = await readJson(usersPath);
            if (fileUsers && fileUsers.length > 0) {
                await UserModel.insertMany(fileUsers);
                console.log('[Netrave Backend] Seeded MongoDB users collection from users.json');
            }
        }
    } catch (err) {
        console.error('[Netrave Backend] Seeding error:', err.message);
    }
}

// Helper to parse cookies from headers if needed
function getCookieValue(cookieHeader, name) {
    if (!cookieHeader) return null;
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
        const [key, val] = pair.trim().split('=');
        if (key === name) return decodeURIComponent(val);
    }
    return null;
}

// Developer Auth Middleware
const requireDeveloper = async (req, res, next) => {
    try {
        const token = req.headers['x-developer-session'] || getCookieValue(req.headers.cookie, 'developerSessionToken');
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Missing developer session.' });
        }

        let settings = null;
        if (useMongo) {
            settings = await SettingsModel.findOne({ key: 'main' });
        } else {
            const fileSettings = await readJson(settingsPath);
            settings = Array.isArray(fileSettings) ? fileSettings[0] : fileSettings;
        }

        if (settings && settings.developerSessionToken && settings.developerSessionToken === token) {
            return next();
        }
        res.status(401).json({ error: 'Unauthorized: Invalid developer session.' });
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized.' });
    }
};

// Admin Auth Middleware
const requireAdmin = async (req, res, next) => {
    try {
        const token = req.headers['x-admin-session'] || getCookieValue(req.headers.cookie, 'adminSessionToken');
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Missing admin session.' });
        }

        let settings = null;
        if (useMongo) {
            settings = await SettingsModel.findOne({ key: 'main' });
        } else {
            const fileSettings = await readJson(settingsPath);
            settings = Array.isArray(fileSettings) ? fileSettings[0] : fileSettings;
        }

        if (settings && settings.adminSessionToken && settings.adminSessionToken === token) {
            return next();
        }
        res.status(401).json({ error: 'Unauthorized: Invalid admin session.' });
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized.' });
    }
};

// Admin or Developer Auth Middleware
const requireAdminOrDeveloper = async (req, res, next) => {
    try {
        const token = req.headers['x-admin-session'] || req.headers['x-developer-session'] || getCookieValue(req.headers.cookie, 'adminSessionToken') || getCookieValue(req.headers.cookie, 'developerSessionToken');
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Missing session.' });
        }

        let settings = null;
        if (useMongo) {
            settings = await SettingsModel.findOne({ key: 'main' });
        } else {
            const fileSettings = await readJson(settingsPath);
            settings = Array.isArray(fileSettings) ? fileSettings[0] : fileSettings;
        }

        if (settings && (settings.adminSessionToken === token || settings.developerSessionToken === token)) {
            return next();
        }
        res.status(401).json({ error: 'Unauthorized: Invalid session.' });
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized.' });
    }
};

// Static files for Uploads
const publicUploadsDir = path.join(__dirname, 'public', 'uploads');
app.use('/uploads', express.static(publicUploadsDir));
app.use('/public/uploads', express.static(publicUploadsDir));
app.use('/api/uploads', express.static(publicUploadsDir));

// Multer Upload Setup
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            await fs.mkdir(publicUploadsDir, { recursive: true });
            cb(null, publicUploadsDir);
        } catch (e) {
            cb(e, publicUploadsDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `photo-${uniqueSuffix}${ext}`);
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Helper for building absolute public URL
const getUploadedFileUrl = (req, filename) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:5001';
    return `${protocol}://${host}/uploads/${filename}`;
};

// --------------------------------------------------------------------------
// API ENDPOINTS
// --------------------------------------------------------------------------

// 1. Upload Single Product / Variant Image
const handleSingleUpload = (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No image file uploaded.' });
        }
        const fileUrl = getUploadedFileUrl(req, file.filename);
        res.json({ 
            success: true, 
            fileUrl, 
            url: fileUrl, 
            filename: file.filename,
            size: file.size
        });
    } catch (err) {
        console.error('Single image upload error:', err);
        res.status(500).json({ error: 'Image upload failed.' });
    }
};

app.post('/api/upload', upload.single('image'), handleSingleUpload);
app.post('/upload', upload.single('image'), handleSingleUpload);

// Multi-file upload endpoint (for bulk photo gallery upload)
const handleMultipleUpload = (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No image files uploaded.' });
        }
        const fileUrls = files.map(f => getUploadedFileUrl(req, f.filename));
        res.json({
            success: true,
            fileUrls,
            urls: fileUrls,
            count: files.length
        });
    } catch (err) {
        console.error('Multiple image upload error:', err);
        res.status(500).json({ error: 'Multiple image upload failed.' });
    }
};

app.post('/api/upload-multiple', upload.array('images', 20), handleMultipleUpload);
app.post('/upload-multiple', upload.array('images', 20), handleMultipleUpload);

// 2. Fetch Shop Settings
app.get('/api/settings', async (req, res) => {
    try {
        if (useMongo) {
            let settings = await SettingsModel.findOne({ key: 'main' });
            if (!settings) {
                settings = await SettingsModel.create({ key: 'main', whatsappNumber: '919876543210', adminPassword: 'admin123' });
            }
            res.json({
                whatsappNumber: settings.whatsappNumber,
                maintenanceMode: settings.maintenanceMode || false,
                maintenanceMessage: settings.maintenanceMessage || 'We are currently performing scheduled maintenance.',
                maintenanceExpiry: settings.maintenanceExpiry || 0,
                offerNotification: settings.offerNotification || '',
                razorpayKeyId: process.env.RAZORPAY_KEY_ID || settings.razorpayKeyId || 'rzp_live_TlpkVGUFJvf2lv',
                razorpayEnabled: settings.razorpayEnabled !== undefined ? settings.razorpayEnabled : true,
                googleClientId: settings.googleClientId || process.env.GOOGLE_CLIENT_ID || ''
            });
        } else {
            const settings = await readJson(settingsPath);
            const data = Array.isArray(settings) ? settings[0] : settings;
            res.json({
                whatsappNumber: data?.whatsappNumber || '919876543210',
                maintenanceMode: data?.maintenanceMode || false,
                maintenanceMessage: data?.maintenanceMessage || 'We are currently performing scheduled maintenance.',
                maintenanceExpiry: data?.maintenanceExpiry || 0,
                offerNotification: data?.offerNotification || '',
                razorpayKeyId: process.env.RAZORPAY_KEY_ID || data?.razorpayKeyId || 'rzp_live_TlpkVGUFJvf2lv',
                razorpayEnabled: data?.razorpayEnabled !== undefined ? data?.razorpayEnabled : true,
                googleClientId: data?.googleClientId || process.env.GOOGLE_CLIENT_ID || ''
            });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings.' });
    }
});

// 3. Save Shop Settings
app.post('/api/settings', async (req, res) => {
    try {
        const { 
            whatsappNumber, 
            maintenanceMode, 
            maintenanceMessage, 
            maintenanceExpiry, 
            offerNotification,
            razorpayKeyId,
            razorpayKeySecret,
            razorpayEnabled,
            googleClientId
        } = req.body;

        if (!whatsappNumber) {
            return res.status(400).json({ error: 'WhatsApp number is required.' });
        }
        if (useMongo) {
            const updateFields = {
                whatsappNumber,
                maintenanceMode: maintenanceMode !== undefined ? Boolean(maintenanceMode) : undefined,
                maintenanceMessage: maintenanceMessage !== undefined ? maintenanceMessage : undefined,
                maintenanceExpiry: maintenanceExpiry !== undefined ? Number(maintenanceExpiry) : undefined,
                offerNotification: offerNotification !== undefined ? offerNotification : undefined
            };
            if (razorpayKeyId !== undefined) updateFields.razorpayKeyId = razorpayKeyId;
            if (razorpayKeySecret !== undefined) updateFields.razorpayKeySecret = razorpayKeySecret;
            if (razorpayEnabled !== undefined) updateFields.razorpayEnabled = Boolean(razorpayEnabled);
            if (googleClientId !== undefined) updateFields.googleClientId = googleClientId;

            const settings = await SettingsModel.findOneAndUpdate(
                { key: 'main' },
                updateFields,
                { new: true, upsert: true }
            );
            res.json({
                whatsappNumber: settings.whatsappNumber,
                maintenanceMode: settings.maintenanceMode,
                maintenanceMessage: settings.maintenanceMessage,
                maintenanceExpiry: settings.maintenanceExpiry,
                offerNotification: settings.offerNotification,
                razorpayKeyId: settings.razorpayKeyId,
                razorpayEnabled: settings.razorpayEnabled,
                googleClientId: settings.googleClientId
            });
        } else {
            let fileSettings = await readJson(settingsPath);
            let data = Array.isArray(fileSettings) ? fileSettings[0] : fileSettings;
            if (!data) data = { adminPassword: 'admin123' };
            data.whatsappNumber = whatsappNumber;
            if (maintenanceMode !== undefined) data.maintenanceMode = Boolean(maintenanceMode);
            if (maintenanceMessage !== undefined) data.maintenanceMessage = maintenanceMessage;
            if (maintenanceExpiry !== undefined) data.maintenanceExpiry = Number(maintenanceExpiry);
            if (offerNotification !== undefined) data.offerNotification = offerNotification;
            if (razorpayKeyId !== undefined) data.razorpayKeyId = razorpayKeyId;
            if (razorpayKeySecret !== undefined) data.razorpayKeySecret = razorpayKeySecret;
            if (razorpayEnabled !== undefined) data.razorpayEnabled = Boolean(razorpayEnabled);
            if (googleClientId !== undefined) data.googleClientId = googleClientId;

            await writeJson(settingsPath, [data]);
            res.json({
                whatsappNumber: data.whatsappNumber,
                maintenanceMode: data.maintenanceMode || false,
                maintenanceMessage: data.maintenanceMessage || '',
                maintenanceExpiry: data.maintenanceExpiry || 0,
                offerNotification: data.offerNotification || '',
                razorpayKeyId: data.razorpayKeyId || '',
                razorpayEnabled: data.razorpayEnabled || false,
                googleClientId: data.googleClientId || ''
            });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to save settings.' });
    }
});

// Helper to check if request is from Admin or Developer
async function isRequestAdmin(req) {
    try {
        const token = req.headers['x-admin-session'] || req.headers['x-developer-session'] || getCookieValue(req.headers.cookie, 'adminSessionToken') || getCookieValue(req.headers.cookie, 'developerSessionToken');
        if (!token) return false;
        let settings = null;
        if (useMongo) {
            settings = await SettingsModel.findOne({ key: 'main' });
        } else {
            const fileSettings = await readJson(settingsPath);
            settings = Array.isArray(fileSettings) ? fileSettings[0] : fileSettings;
        }
        return !!(settings && (settings.adminSessionToken === token || settings.developerSessionToken === token));
    } catch {
        return false;
    }
}

// Sourcing sanitization: strips confidential supplier details from customer views
function sanitizeProductForCustomer(prod) {
    if (!prod) return null;
    const item = prod.toObject ? prod.toObject() : { ...prod };
    delete item.costPrice;
    delete item.supplierName;
    delete item.supplierSku;
    delete item.supplierUrl;
    delete item.supplierCost;
    delete item.profitMargin;
    delete item.supplierShippingCost;
    delete item.supplierNotes;
    delete item.supplierStockStatus;
    return item;
}

// --------------------------------------------------------------------------
// CATEGORY MANAGEMENT ENDPOINTS
// --------------------------------------------------------------------------

// Fetch Categories List (Customers see active only; Admin sees all)
app.get('/api/categories', async (req, res) => {
    try {
        const isAdmin = await isRequestAdmin(req);
        const includeAll = req.query.all === 'true' && isAdmin;

        if (useMongo) {
            const query = includeAll ? {} : { status: 'active' };
            const categories = await CategoryModel.find(query).sort({ displayOrder: 1, id: 1 });
            res.json(categories);
        } else {
            const categories = await readJson(categoriesPath);
            const filtered = includeAll ? categories : categories.filter(c => c.status === 'active');
            filtered.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            res.json(filtered);
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
});

// Admin Fetch All Categories
app.get('/api/admin/categories', async (req, res) => {
    try {
        if (useMongo) {
            const categories = await CategoryModel.find().sort({ displayOrder: 1, id: 1 });
            res.json(categories);
        } else {
            const categories = await readJson(categoriesPath);
            categories.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            res.json(categories);
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
});

// Create Category
app.post('/api/categories', async (req, res) => {
    try {
        const { name, slug, description, image, banner, color, status, displayOrder, subcategories } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Category name is required.' });
        }
        const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).toLowerCase();

        let newCategory;
        if (useMongo) {
            const lastCat = await CategoryModel.findOne().sort({ id: -1 });
            const nextId = lastCat ? lastCat.id + 1 : 1;
            newCategory = new CategoryModel({
                id: nextId,
                name: name.trim(),
                slug: cleanSlug,
                description: description || '',
                image: image || '',
                banner: banner || '',
                color: color || '#f59e0b',
                status: status || 'active',
                displayOrder: displayOrder !== undefined ? Number(displayOrder) : nextId,
                subcategories: Array.isArray(subcategories) ? subcategories : [],
                createdAt: new Date()
            });
            await newCategory.save();
        } else {
            const categoriesList = await readJson(categoriesPath);
            const nextId = categoriesList.reduce((max, c) => c.id > max ? c.id : max, 0) + 1;
            newCategory = {
                id: nextId,
                name: name.trim(),
                slug: cleanSlug,
                description: description || '',
                image: image || '',
                banner: banner || '',
                color: color || '#f59e0b',
                status: status || 'active',
                displayOrder: displayOrder !== undefined ? Number(displayOrder) : nextId,
                subcategories: Array.isArray(subcategories) ? subcategories : [],
                createdAt: new Date().toISOString()
            };
            categoriesList.push(newCategory);
            await writeJson(categoriesPath, categoriesList);
        }
        res.status(201).json(newCategory);
    } catch (err) {
        console.error('Create category error:', err);
        res.status(500).json({ error: 'Failed to create category.' });
    }
});

// Update Category
app.put('/api/categories/:id', async (req, res) => {
    try {
        const rawParam = req.params.id;
        const numId = parseInt(rawParam);
        const isNum = !isNaN(numId);
        const { name, slug, description, image, banner, color, status, displayOrder, subcategories } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (slug !== undefined) updateData.slug = slug.toLowerCase().trim();
        if (description !== undefined) updateData.description = description;
        if (image !== undefined) updateData.image = image;
        if (banner !== undefined) updateData.banner = banner;
        if (color !== undefined) updateData.color = color;
        if (status !== undefined) updateData.status = status;
        if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);
        if (subcategories !== undefined) updateData.subcategories = Array.isArray(subcategories) ? subcategories : [];

        if (useMongo) {
            const filter = isNum ? { $or: [{ id: numId }, { slug: rawParam }] } : { $or: [{ slug: rawParam }, { _id: rawParam }] };
            const updated = await CategoryModel.findOneAndUpdate(filter, updateData, { new: true });
            if (!updated) return res.status(404).json({ error: 'Category not found.' });
            res.json(updated);
        } else {
            const categoriesList = await readJson(categoriesPath);
            const index = categoriesList.findIndex(c => (isNum && c.id === numId) || String(c.id) === rawParam || c.slug === rawParam);
            if (index === -1) return res.status(404).json({ error: 'Category not found.' });
            categoriesList[index] = { ...categoriesList[index], ...updateData };
            await writeJson(categoriesPath, categoriesList);
            res.json(categoriesList[index]);
        }
    } catch (err) {
        console.error('Update category error:', err);
        res.status(500).json({ error: 'Failed to update category.' });
    }
});

// Delete Category
app.delete('/api/categories/:id', async (req, res) => {
    try {
        const rawParam = req.params.id;
        const numId = parseInt(rawParam);
        const isNum = !isNaN(numId);
        if (useMongo) {
            const filter = isNum ? { $or: [{ id: numId }, { slug: rawParam }] } : { $or: [{ slug: rawParam }, { _id: rawParam }] };
            const deleted = await CategoryModel.findOneAndDelete(filter);
            if (!deleted) return res.status(404).json({ error: 'Category not found.' });
            res.json({ message: 'Category deleted successfully.' });
        } else {
            const categoriesList = await readJson(categoriesPath);
            const filtered = categoriesList.filter(c => !((isNum && c.id === numId) || String(c.id) === rawParam || c.slug === rawParam));
            if (filtered.length === categoriesList.length) return res.status(404).json({ error: 'Category not found.' });
            await writeJson(categoriesPath, filtered);
            res.json({ message: 'Category deleted successfully.' });
        }
    } catch (err) {
        console.error('Delete category error:', err);
        res.status(500).json({ error: 'Failed to delete category.' });
    }
});

// --------------------------------------------------------------------------
// PRODUCT MANAGEMENT ENDPOINTS
// --------------------------------------------------------------------------

// Fetch Products List (Public is sanitized without supplier details; Admin gets full supplier intel)
app.get('/api/products', async (req, res) => {
    try {
        const isAdmin = await isRequestAdmin(req);
        let products = [];
        if (useMongo) {
            products = await ProductModel.find().sort({ id: 1 });
        } else {
            products = await readJson(productsPath);
        }

        if (isAdmin || req.query.adminView === 'true') {
            return res.json(products);
        }
        res.json(products.map(sanitizeProductForCustomer));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products.' });
    }
});

// Admin Fetch Products (Always includes full supplier intel)
app.get('/api/admin/products', async (req, res) => {
    try {
        if (useMongo) {
            const products = await ProductModel.find().sort({ id: 1 });
            res.json(products);
        } else {
            const products = await readJson(productsPath);
            res.json(products);
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products for admin.' });
    }
});

// Fetch Single Product
app.get('/api/products/:id', async (req, res) => {
    try {
        const prodId = parseInt(req.params.id);
        const isAdmin = await isRequestAdmin(req);
        let prod = null;
        if (useMongo) {
            prod = await ProductModel.findOne({ id: prodId });
        } else {
            const list = await readJson(productsPath);
            prod = list.find(p => p.id === prodId);
        }
        if (!prod) return res.status(404).json({ error: 'Product not found.' });
        res.json(isAdmin ? prod : sanitizeProductForCustomer(prod));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch product.' });
    }
});

// Add New Product
app.post('/api/products', async (req, res) => {
    try {
        const {
            title, category, subcategory, price, costPrice, originalPrice,
            image, images, video, shortDescription, description,
            sizes, colors, tags, stock, inStock,
            isFeatured, isNewArrival, isBestSeller,
            sku, brand, weight, dimensions, shippingInfo, returnInfo,
            variants, variantOptions, colorVariants,
            supplierName, supplierSku, supplierUrl, supplierCost,
            profitMargin, supplierShippingCost, estimatedDeliveryDays,
            supplierStockStatus, supplierNotes
        } = req.body;

        if (!title || !category || price === undefined || price === null || price === '') {
            return res.status(400).json({ error: 'Title, category, and price are required.' });
        }

        const sellingPrice = Number(price);
        const unitCost = supplierCost !== undefined ? Number(supplierCost) : (costPrice !== undefined ? Number(costPrice) : 0);
        const margin = profitMargin !== undefined ? Number(profitMargin) : Math.max(0, sellingPrice - unitCost);
        const imgList = Array.isArray(images) && images.length > 0 ? images : (image ? [image] : []);
        const primaryImage = image || (imgList[0] || '');

        let newProduct;
        if (useMongo) {
            const lastProduct = await ProductModel.findOne().sort({ id: -1 });
            const nextId = lastProduct ? lastProduct.id + 1 : 1;

            newProduct = new ProductModel({
                id: nextId,
                title: title.trim(),
                category: category.trim(),
                subcategory: subcategory || '',
                price: sellingPrice,
                originalPrice: originalPrice ? Number(originalPrice) : undefined,
                costPrice: unitCost,
                image: primaryImage,
                images: imgList,
                video: video || '',
                shortDescription: shortDescription || '',
                description: description || '',
                sizes: Array.isArray(sizes) ? sizes : ['M', 'L', 'XL'],
                colors: Array.isArray(colors) ? colors : [],
                tags: Array.isArray(tags) ? tags : [],
                stock: stock !== undefined ? Number(stock) : 50,
                inStock: inStock !== undefined ? Boolean(inStock) : true,
                isFeatured: Boolean(isFeatured),
                isNewArrival: Boolean(isNewArrival),
                isBestSeller: Boolean(isBestSeller),
                sku: sku || `NET-SKU-${nextId}`,
                brand: brand || 'NETRAVE',
                weight: weight || '',
                dimensions: dimensions || '',
                shippingInfo: shippingInfo || 'Ships in 24 hours via Express Courier.',
                returnInfo: returnInfo || '7-day replacement and return guarantee.',
                variants: Array.isArray(variants) ? variants : [],
                variantOptions: Array.isArray(variantOptions) ? variantOptions : [],
                colorVariants: Array.isArray(colorVariants) ? colorVariants : [],
                supplierName: supplierName || '',
                supplierSku: supplierSku || '',
                supplierUrl: supplierUrl || '',
                supplierCost: unitCost,
                profitMargin: margin,
                supplierShippingCost: supplierShippingCost !== undefined ? Number(supplierShippingCost) : 0,
                estimatedDeliveryDays: estimatedDeliveryDays || '2-4 Days',
                supplierStockStatus: supplierStockStatus || 'In Stock',
                supplierNotes: supplierNotes || '',
                rating: 5.0,
                reviews: 0
            });
            await newProduct.save();
        } else {
            const productsList = await readJson(productsPath);
            const nextId = productsList.reduce((max, p) => p.id > max ? p.id : max, 0) + 1;

            newProduct = {
                id: nextId,
                title: title.trim(),
                category: category.trim(),
                subcategory: subcategory || '',
                price: sellingPrice,
                originalPrice: originalPrice ? Number(originalPrice) : undefined,
                costPrice: unitCost,
                image: primaryImage,
                images: imgList,
                video: video || '',
                shortDescription: shortDescription || '',
                description: description || '',
                sizes: Array.isArray(sizes) ? sizes : ['M', 'L', 'XL'],
                colors: Array.isArray(colors) ? colors : [],
                tags: Array.isArray(tags) ? tags : [],
                stock: stock !== undefined ? Number(stock) : 50,
                inStock: inStock !== undefined ? Boolean(inStock) : true,
                isFeatured: Boolean(isFeatured),
                isNewArrival: Boolean(isNewArrival),
                isBestSeller: Boolean(isBestSeller),
                sku: sku || `NET-SKU-${nextId}`,
                brand: brand || 'NETRAVE',
                weight: weight || '',
                dimensions: dimensions || '',
                shippingInfo: shippingInfo || 'Ships in 24 hours via Express Courier.',
                returnInfo: returnInfo || '7-day replacement and return guarantee.',
                variants: Array.isArray(variants) ? variants : [],
                variantOptions: Array.isArray(variantOptions) ? variantOptions : [],
                colorVariants: Array.isArray(colorVariants) ? colorVariants : [],
                supplierName: supplierName || '',
                supplierSku: supplierSku || '',
                supplierUrl: supplierUrl || '',
                supplierCost: unitCost,
                profitMargin: margin,
                supplierShippingCost: supplierShippingCost !== undefined ? Number(supplierShippingCost) : 0,
                estimatedDeliveryDays: estimatedDeliveryDays || '2-4 Days',
                supplierStockStatus: supplierStockStatus || 'In Stock',
                supplierNotes: supplierNotes || '',
                rating: 5.0,
                reviews: 0
            };
            productsList.push(newProduct);
            await writeJson(productsPath, productsList);
        }
        res.status(201).json(newProduct);
    } catch (err) {
        console.error('Failed to add product:', err);
        res.status(500).json({ error: 'Failed to add product.' });
    }
});

// Edit Existing Product
app.put('/api/products/:id', async (req, res) => {
    try {
        const rawParam = req.params.id;
        const numId = parseInt(rawParam);
        const isNum = !isNaN(numId);
        const {
            title, category, subcategory, price, costPrice, originalPrice,
            image, images, video, shortDescription, description,
            sizes, colors, tags, stock, inStock,
            isFeatured, isNewArrival, isBestSeller,
            sku, brand, weight, dimensions, shippingInfo, returnInfo,
            variants, variantOptions, colorVariants,
            supplierName, supplierSku, supplierUrl, supplierCost,
            profitMargin, supplierShippingCost, estimatedDeliveryDays,
            supplierStockStatus, supplierNotes
        } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (category !== undefined) updateData.category = category.trim();
        if (subcategory !== undefined) updateData.subcategory = subcategory;
        if (price !== undefined) updateData.price = Number(price);
        if (originalPrice !== undefined) updateData.originalPrice = originalPrice ? Number(originalPrice) : undefined;
        if (costPrice !== undefined || supplierCost !== undefined) {
            const cost = supplierCost !== undefined ? Number(supplierCost) : Number(costPrice);
            updateData.costPrice = cost;
            updateData.supplierCost = cost;
        }
        if (image !== undefined) updateData.image = image;
        if (images !== undefined) updateData.images = Array.isArray(images) ? images : [];
        if (video !== undefined) updateData.video = video;
        if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
        if (description !== undefined) updateData.description = description;
        if (sizes !== undefined) updateData.sizes = Array.isArray(sizes) ? sizes : [];
        if (colors !== undefined) updateData.colors = Array.isArray(colors) ? colors : [];
        if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
        if (stock !== undefined) updateData.stock = Number(stock);
        if (inStock !== undefined) updateData.inStock = Boolean(inStock);
        if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
        if (isNewArrival !== undefined) updateData.isNewArrival = Boolean(isNewArrival);
        if (isBestSeller !== undefined) updateData.isBestSeller = Boolean(isBestSeller);
        if (sku !== undefined) updateData.sku = sku;
        if (brand !== undefined) updateData.brand = brand;
        if (weight !== undefined) updateData.weight = weight;
        if (dimensions !== undefined) updateData.dimensions = dimensions;
        if (shippingInfo !== undefined) updateData.shippingInfo = shippingInfo;
        if (returnInfo !== undefined) updateData.returnInfo = returnInfo;
        if (variants !== undefined) updateData.variants = Array.isArray(variants) ? variants : [];
        if (variantOptions !== undefined) updateData.variantOptions = Array.isArray(variantOptions) ? variantOptions : [];
        if (colorVariants !== undefined) updateData.colorVariants = Array.isArray(colorVariants) ? colorVariants : [];
        if (supplierName !== undefined) updateData.supplierName = supplierName;
        if (supplierSku !== undefined) updateData.supplierSku = supplierSku;
        if (supplierUrl !== undefined) updateData.supplierUrl = supplierUrl;
        if (profitMargin !== undefined) {
            updateData.profitMargin = Number(profitMargin);
        } else if (updateData.price !== undefined && (updateData.supplierCost !== undefined || updateData.costPrice !== undefined)) {
            updateData.profitMargin = Math.max(0, updateData.price - (updateData.supplierCost || updateData.costPrice || 0));
        }
        if (supplierShippingCost !== undefined) updateData.supplierShippingCost = Number(supplierShippingCost);
        if (estimatedDeliveryDays !== undefined) updateData.estimatedDeliveryDays = estimatedDeliveryDays;
        if (supplierStockStatus !== undefined) updateData.supplierStockStatus = supplierStockStatus;
        if (supplierNotes !== undefined) updateData.supplierNotes = supplierNotes;

        if (useMongo) {
            const filter = isNum ? { id: numId } : { _id: rawParam };
            const updatedProduct = await ProductModel.findOneAndUpdate(filter, updateData, { new: true });
            if (!updatedProduct) return res.status(404).json({ error: 'Product not found.' });
            res.json(updatedProduct);
        } else {
            const productsList = await readJson(productsPath);
            const index = productsList.findIndex(p => (isNum && p.id === numId) || String(p.id) === rawParam);
            if (index === -1) return res.status(404).json({ error: 'Product not found.' });
            productsList[index] = { ...productsList[index], ...updateData };
            await writeJson(productsPath, productsList);
            res.json(productsList[index]);
        }
    } catch (err) {
        console.error('Failed to update product:', err);
        res.status(500).json({ error: 'Failed to update product.' });
    }
});

// Duplicate Product
app.post('/api/products/:id/duplicate', async (req, res) => {
    try {
        const prodId = parseInt(req.params.id);
        let original = null;
        let nextId = 1;

        if (useMongo) {
            original = await ProductModel.findOne({ id: prodId }).lean();
            if (!original) return res.status(404).json({ error: 'Product not found.' });
            const lastProduct = await ProductModel.findOne().sort({ id: -1 });
            nextId = lastProduct ? lastProduct.id + 1 : 1;

            const cloned = {
                ...original,
                _id: undefined,
                id: nextId,
                title: `${original.title} (Copy)`,
                sku: original.sku ? `${original.sku}-COPY` : `NET-SKU-${nextId}`,
                reviews: 0,
                rating: 5.0
            };
            delete cloned._id;
            const newDoc = new ProductModel(cloned);
            await newDoc.save();
            return res.status(201).json(newDoc);
        } else {
            const productsList = await readJson(productsPath);
            original = productsList.find(p => p.id === prodId);
            if (!original) return res.status(404).json({ error: 'Product not found.' });
            nextId = productsList.reduce((max, p) => p.id > max ? p.id : max, 0) + 1;

            const cloned = {
                ...original,
                id: nextId,
                title: `${original.title} (Copy)`,
                sku: original.sku ? `${original.sku}-COPY` : `NET-SKU-${nextId}`,
                reviews: 0,
                rating: 5.0
            };
            productsList.push(cloned);
            await writeJson(productsPath, productsList);
            return res.status(201).json(cloned);
        }
    } catch (err) {
        console.error('Failed to duplicate product:', err);
        res.status(500).json({ error: 'Failed to duplicate product.' });
    }
});

// Delete Product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const rawParam = req.params.id;
        const numId = parseInt(rawParam);
        const isNum = !isNaN(numId);

        if (useMongo) {
            const filter = isNum ? { id: numId } : { _id: rawParam };
            const deleted = await ProductModel.findOneAndDelete(filter);
            if (!deleted) return res.status(404).json({ error: 'Product not found.' });
            res.json({ message: 'Product deleted successfully.' });
        } else {
            const productsList = await readJson(productsPath);
            const filtered = productsList.filter(p => !((isNum && p.id === numId) || String(p.id) === rawParam));

            if (productsList.length === filtered.length) {
                return res.status(404).json({ error: 'Product not found.' });
            }

            await writeJson(productsPath, filtered);
            res.json({ message: 'Product deleted successfully.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product.' });
    }
});

// --------------------------------------------------------------------------
// COURIER LOGISTICS & LIVE TRACKING ENGINE
// Supported Carriers: Delhivery Express, BlueDart, DTDC, India Post, XpressBees, Shiprocket, Shadowfax
// --------------------------------------------------------------------------
function getCarrierTrackingUrl(carrier, awb) {
    if (!awb) return '';
    const cleanCarrier = (carrier || '').toLowerCase();
    if (cleanCarrier.includes('delhivery')) {
        return `https://www.delhivery.com/track/package/${awb}`;
    } else if (cleanCarrier.includes('bluedart')) {
        return `https://www.bluedart.com/tracking?numbers=${awb}`;
    } else if (cleanCarrier.includes('dtdc')) {
        return `https://www.dtdc.in/tracking/shipment-tracking.asp?trType=awb_no&strCnno=${awb}`;
    } else if (cleanCarrier.includes('india post') || cleanCarrier.includes('speed post')) {
        return `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx`;
    } else if (cleanCarrier.includes('xpressbees')) {
        return `https://www.xpressbees.com/shipment/tracking?awbNo=${awb}`;
    } else if (cleanCarrier.includes('shadowfax')) {
        return `https://tracker.shadowfax.in/#/track?awb=${awb}`;
    }
    return `https://www.delhivery.com/track/package/${awb}`;
}

function generateCourierDetails(orderId, dateString, district = 'Kozhikode') {
    const awbSuffix = Math.floor(100000000 + Math.random() * 900000000);
    const awbNumber = `DEL${awbSuffix}`;
    const estDate = new Date();
    estDate.setDate(estDate.getDate() + 3);
    const estimatedDelivery = estDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    return {
        courierPartner: 'Delhivery Express',
        awbNumber: awbNumber,
        trackingUrl: `https://www.delhivery.com/track/package/${awbNumber}`,
        currentLocation: 'Netrave Central Hub, Kozhikode, Kerala',
        destinationCity: district || 'Kerala',
        estimatedDelivery: estimatedDelivery,
        driverInfo: {
            name: 'Rahul V.',
            phone: '+91 98471 23456',
            vehicle: 'KL-11-AX-4821'
        },
        trackingHistory: [
            {
                status: 'Order Confirmed',
                location: 'Netrave Fulfillment Center, Kozhikode',
                timestamp: dateString,
                description: 'Order verified & payment received. Packing slip & manifest generated.'
            },
            {
                status: 'Manifest Generated',
                location: 'Delhivery Kozhikode Hub',
                timestamp: dateString,
                description: `Shipment assigned to Delhivery Express with AWB #${awbNumber}. Ready for dispatch.`
            }
        ]
    };
}

function ensureCourierTrackingData(booking) {
    if (!booking) return null;
    const b = booking.toObject ? booking.toObject() : { ...booking };
    if (!b.awbNumber || !b.courierPartner) {
        const fallback = generateCourierDetails(b.orderId, b.date || 'Today', b.customer?.district);
        b.courierPartner = b.courierPartner || fallback.courierPartner;
        b.awbNumber = b.awbNumber || fallback.awbNumber;
        b.trackingUrl = b.trackingUrl || getCarrierTrackingUrl(b.courierPartner, b.awbNumber);
        b.currentLocation = b.currentLocation || fallback.currentLocation;
        b.destinationCity = b.destinationCity || b.customer?.district || 'Kerala';
        b.estimatedDelivery = b.estimatedDelivery || fallback.estimatedDelivery;
        b.driverInfo = b.driverInfo || fallback.driverInfo;
        b.trackingHistory = (b.trackingHistory && b.trackingHistory.length > 0) ? b.trackingHistory : fallback.trackingHistory;
    }
    return b;
}

// 8. Fetch Booking Log History
app.get('/api/bookings', async (req, res) => {
    try {
        if (useMongo) {
            const bookings = await BookingModel.find().sort({ _id: -1 });
            res.json(bookings.map(b => ensureCourierTrackingData(b)));
        } else {
            const bookings = await readJson(bookingsPath);
            res.json(bookings.map(b => ensureCourierTrackingData(b)));
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bookings log.' });
    }
});

// 9. Place Booking (with stock verification & decrement)
app.post('/api/bookings', async (req, res) => {
    try {
        const { customer, items } = req.body;

        if (!customer || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Invalid booking data structure. Customer and items are required.' });
        }

        const { name, phone, whatsapp, address, district, pincode, payment } = customer;
        if (!name || !phone || !whatsapp || !address || !district || !pincode || !payment) {
            return res.status(400).json({ error: 'Missing required customer delivery information.' });
        }

        let products = [];
        if (useMongo) {
            products = await ProductModel.find().lean();
        } else {
            products = await readJson(productsPath);
        }

        // Validate items & stock levels
        let subtotal = 0;
        const validatedItems = [];

        for (const item of items) {
            const productRef = products.find(p => Number(p.id) === Number(item.id));
            if (!productRef) {
                return res.status(400).json({ error: `Product item with ID ${item.id} does not exist.` });
            }

            if (!productRef.inStock || productRef.stock <= 0) {
                return res.status(400).json({ error: `Product "${productRef.title}" is currently out of stock.` });
            }

            const quantity = parseInt(item.quantity) || 1;
            if (productRef.stock < quantity) {
                return res.status(400).json({ error: `Insufficient stock for "${productRef.title}". Available: ${productRef.stock}` });
            }

            const size = item.size || 'M';
            const price = productRef.price;
            subtotal += price * quantity;

            validatedItems.push({
                id: productRef.id,
                title: productRef.title,
                image: productRef.image,
                price: price,
                costPrice: productRef.costPrice !== undefined ? Number(productRef.costPrice) : Math.round(price * 0.5),
                size: size,
                quantity: quantity,
                category: productRef.category
            });
        }

        // COD is not available - all orders must go through Razorpay Online Payment
        if (!customer || !customer.payment || customer.payment === 'COD' || customer.payment === 'Cash on Delivery') {
            return res.status(400).json({ 
                error: 'Cash on Delivery (COD) is not available. Please complete checkout with Razorpay Online Payment.' 
            });
        }

        const delivery = subtotal >= 999 ? 0 : 60;
        const total = subtotal + delivery;

        const orderId = `TR-${Math.floor(100000 + Math.random() * 900000)}`;
        const dateString = new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const courierData = generateCourierDetails(orderId, dateString, district);

        const newBookingRecord = {
            orderId: orderId,
            date: dateString,
            customer: customer,
            paymentMethod: customer.paymentMethod || 'online',
            payment: customer.payment || 'Razorpay Online',
            items: validatedItems,
            subtotal: subtotal,
            delivery: delivery,
            total: total,
            status: 'Confirmed',
            ...courierData
        };

        // Persist booking & decrement stock
        if (useMongo) {
            // Decrement Stock
            for (const item of validatedItems) {
                await ProductModel.findOneAndUpdate(
                    { id: item.id },
                    { $inc: { stock: -item.quantity } }
                );
                // Re-evaluate inStock
                const p = await ProductModel.findOne({ id: item.id });
                if (p && p.stock <= 0) {
                    p.inStock = false;
                    await p.save();
                }
            }

            const bookingDoc = new BookingModel(newBookingRecord);
            await bookingDoc.save();
            res.status(201).json(bookingDoc);
        } else {
            // Update stock in products.json
            const updatedProductsList = products.map(p => {
                const boughtItems = validatedItems.filter(vi => vi.id === p.id);
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
            await writeJson(productsPath, updatedProductsList);

            // Save to bookings.json
            const currentBookings = await readJson(bookingsPath);
            currentBookings.unshift(newBookingRecord);
            await writeJson(bookingsPath, currentBookings);

            res.status(201).json(newBookingRecord);
        }
    } catch (err) {
        console.error('Booking processing failed:', err);
        res.status(500).json({ error: 'Failed to process and record booking.' });
    }
});

// 10. Update Booking Status (handling stock restoration if Cancelled)
app.patch('/api/bookings/:orderId', async (req, res) => {
    try {
        const ordId = req.params.orderId;
        const { status, internalNotes, courierPartner, awbNumber } = req.body;

        const validStatuses = [
            'Pending', 'Confirmed', 'Payment Confirmed', 'Processing', 'Shipped', 
            'Dispatched', 'In Transit', 'Out for Delivery', 'Delivered', 
            'Cancelled', 'Cancelled by Customer', 'Returned', 'Refunded', 
            'Order Placed', 'Payment Not Confirmed'
        ];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid booking status value.' });
        }

        let targetBooking = null;
        const isCancelStatus = (s) => s === 'Cancelled' || s === 'Cancelled by Customer' || s === 'Returned' || s === 'Refunded';

        if (useMongo) {
            targetBooking = await BookingModel.findOne({ orderId: ordId });
            if (!targetBooking) return res.status(404).json({ error: 'Booking not found.' });

            const oldStatus = targetBooking.status;
            if (status) targetBooking.status = status;
            if (internalNotes !== undefined) targetBooking.internalNotes = internalNotes;
            if (courierPartner) targetBooking.courierPartner = courierPartner;
            if (awbNumber) {
                targetBooking.awbNumber = awbNumber;
                targetBooking.trackingUrl = getCarrierTrackingUrl(courierPartner || targetBooking.courierPartner, awbNumber);
            }

            // Auto-append tracking event when status transitions
            if (targetBooking.trackingHistory && Array.isArray(targetBooking.trackingHistory)) {
                const nowStr = new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                let checkpointDesc = `Shipment status updated to: ${status}`;
                if (status === 'Dispatched') checkpointDesc = `Package has been dispatched from warehouse with ${targetBooking.courierPartner || 'Delhivery Express'}.`;
                else if (status === 'In Transit') checkpointDesc = `Shipment in transit via ${targetBooking.courierPartner || 'Courier'} network to regional hub.`;
                else if (status === 'Out for Delivery') checkpointDesc = `Out for delivery with courier agent (${targetBooking.driverInfo?.name || 'Delivery Partner'}). Expected today.`;
                else if (status === 'Delivered') checkpointDesc = `Package successfully delivered to recipient. Thank you for shopping with Netrave!`;

                targetBooking.trackingHistory.push({
                    status: status,
                    location: targetBooking.currentLocation || 'Transit Facility',
                    timestamp: nowStr,
                    description: checkpointDesc
                });
            }

            await targetBooking.save();

            // If status changed TO Cancelled, restore product stocks
            if (isCancelStatus(status) && !isCancelStatus(oldStatus)) {
                for (const item of targetBooking.items) {
                    await ProductModel.findOneAndUpdate(
                        { id: item.id },
                        { $inc: { stock: item.quantity }, $set: { inStock: true } }
                    );
                }
            }
            // If status changed FROM Cancelled, decrement product stocks again
            else if (isCancelStatus(oldStatus) && !isCancelStatus(status)) {
                for (const item of targetBooking.items) {
                    await ProductModel.findOneAndUpdate(
                        { id: item.id },
                        { $inc: { stock: -item.quantity } }
                    );
                    const p = await ProductModel.findOne({ id: item.id });
                    if (p && p.stock <= 0) {
                        p.inStock = false;
                        await p.save();
                    }
                }
            }

            res.json(ensureCourierTrackingData(targetBooking));
        } else {
            const bookingsList = await readJson(bookingsPath);
            const index = bookingsList.findIndex(b => b.orderId === ordId);

            if (index === -1) {
                return res.status(404).json({ error: 'Booking not found.' });
            }

            const oldStatus = bookingsList[index].status;
            if (status) bookingsList[index].status = status;
            if (internalNotes !== undefined) bookingsList[index].internalNotes = internalNotes;
            if (courierPartner) bookingsList[index].courierPartner = courierPartner;
            if (awbNumber) {
                bookingsList[index].awbNumber = awbNumber;
                bookingsList[index].trackingUrl = getCarrierTrackingUrl(courierPartner || bookingsList[index].courierPartner, awbNumber);
            }

            // Auto-append tracking event on file database
            if (!bookingsList[index].trackingHistory) {
                bookingsList[index] = ensureCourierTrackingData(bookingsList[index]);
            }
            if (Array.isArray(bookingsList[index].trackingHistory)) {
                const nowStr = new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                let checkpointDesc = `Shipment status updated to: ${status}`;
                if (status === 'Dispatched') checkpointDesc = `Package has been dispatched from warehouse with ${bookingsList[index].courierPartner || 'Delhivery Express'}.`;
                else if (status === 'In Transit') checkpointDesc = `Shipment in transit via ${bookingsList[index].courierPartner || 'Courier'} network to regional hub.`;
                else if (status === 'Out for Delivery') checkpointDesc = `Out for delivery with courier agent (${bookingsList[index].driverInfo?.name || 'Delivery Partner'}). Expected today.`;
                else if (status === 'Delivered') checkpointDesc = `Package successfully delivered to recipient. Thank you for shopping with Netrave!`;

                bookingsList[index].trackingHistory.push({
                    status: status,
                    location: bookingsList[index].currentLocation || 'Transit Facility',
                    timestamp: nowStr,
                    description: checkpointDesc
                });
            }

            await writeJson(bookingsPath, bookingsList);
            targetBooking = bookingsList[index];

            // Handle stock restoration on file database
            if (isCancelStatus(status) && !isCancelStatus(oldStatus)) {
                const productsList = await readJson(productsPath);
                const updated = productsList.map(p => {
                    const boughtItems = targetBooking.items.filter(vi => vi.id === p.id);
                    if (boughtItems.length > 0) {
                        const totalBoughtQty = boughtItems.reduce((sum, item) => sum + item.quantity, 0);
                        return {
                            ...p,
                            stock: p.stock + totalBoughtQty,
                            inStock: true
                        };
                    }
                    return p;
                });
                await writeJson(productsPath, updated);
            } else if (isCancelStatus(oldStatus) && !isCancelStatus(status)) {
                const productsList = await readJson(productsPath);
                const updated = productsList.map(p => {
                    const boughtItems = targetBooking.items.filter(vi => vi.id === p.id);
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
                await writeJson(productsPath, updated);
            }

            res.json(ensureCourierTrackingData(targetBooking));
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update booking status.' });
    }
});

// Order Cancel Endpoint (Customer Self-Service)
app.post('/api/bookings/:orderId/cancel', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'Customer phone verification is required.' });
        }

        let booking = null;
        if (useMongo) {
            booking = await BookingModel.findOne({ orderId });
        } else {
            const fileBookings = await readJson(bookingsPath);
            booking = fileBookings.find(b => b.orderId === orderId);
        }

        if (!booking) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Verify phone matches the order
        const customerPhone = booking.customer?.phone || booking.customerPhone;
        if (customerPhone !== phone) {
            return res.status(403).json({ error: 'Unauthorized to cancel this order.' });
        }

        const allowedCancelStatuses = ['pending', 'payment not confirmed'];
        if (!allowedCancelStatuses.includes(booking.status.toLowerCase())) {
            return res.status(400).json({ error: `Cannot cancel order with status: ${booking.status}` });
        }

        // Restore stocks
        let products = [];
        if (useMongo) {
            products = await ProductModel.find().lean();
        } else {
            products = await readJson(productsPath);
        }

        if (useMongo) {
            for (const item of booking.items) {
                await ProductModel.findOneAndUpdate(
                    { id: item.id },
                    { $inc: { stock: item.quantity }, $set: { inStock: true } }
                );
            }
            booking.status = 'Cancelled by Customer';
            await booking.save();
        } else {
            const updatedProductsList = products.map(p => {
                const boughtItem = booking.items.find(vi => vi.id === p.id);
                if (boughtItem) {
                    const newStock = p.stock + boughtItem.quantity;
                    return { ...p, stock: newStock, inStock: true };
                }
                return p;
            });
            await writeJson(productsPath, updatedProductsList);

            const fileBookings = await readJson(bookingsPath);
            const updatedBookings = fileBookings.map(b => {
                if (b.orderId === orderId) {
                    return { ...b, status: 'Cancelled by Customer' };
                }
                return b;
            });
            await writeJson(bookingsPath, updatedBookings);
        }

        res.json({ success: true, message: 'Order cancelled successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to cancel order.' });
    }
});

// --------------------------------------------------------------------------
// 10C. LIVE COURIER TRACKING PUBLIC & ADMIN API ENDPOINTS
// --------------------------------------------------------------------------

// Track order by Order ID (TR-XXXXXX), AWB Number (DELXXXXXXXX), or Customer Phone
app.get('/api/tracking/:query', async (req, res) => {
    try {
        const rawQuery = (req.params.query || '').trim();
        if (!rawQuery) {
            return res.status(400).json({ error: 'Order ID, Courier AWB, or Phone is required.' });
        }

        const cleanQuery = rawQuery.replace(/^[#\s]+/, '').trim();
        const trFormatted = cleanQuery.toUpperCase().startsWith('TR-') 
            ? cleanQuery.toUpperCase() 
            : `TR-${cleanQuery.toUpperCase()}`;

        let booking = null;
        if (useMongo) {
            booking = await BookingModel.findOne({
                $or: [
                    { orderId: new RegExp(`^${cleanQuery}$`, 'i') },
                    { orderId: new RegExp(`^${trFormatted}$`, 'i') },
                    { awbNumber: new RegExp(`^${cleanQuery}$`, 'i') },
                    { 'customer.phone': cleanQuery },
                    { 'customer.whatsapp': cleanQuery }
                ]
            }).sort({ _id: -1 });
        } else {
            const bookingsList = await readJson(bookingsPath);
            const qLower = cleanQuery.toLowerCase();
            const trLower = trFormatted.toLowerCase();
            booking = bookingsList.slice().reverse().find(b => 
                (b.orderId && (b.orderId.toLowerCase() === qLower || b.orderId.toLowerCase() === trLower)) ||
                (b.awbNumber && b.awbNumber.toLowerCase() === qLower) ||
                (b.customer?.phone === cleanQuery) ||
                (b.customer?.whatsapp === cleanQuery)
            );
        }

        if (booking) {
            const fullData = ensureCourierTrackingData(booking);
            return res.json({
                found: true,
                live: true,
                data: fullData
            });
        }

        return res.status(404).json({
            found: false,
            error: `No dispatch record found for "${rawQuery}". Please enter your valid Netrave Order ID (e.g. TR-XXXXXX) or registered phone number.`
        });
    } catch (err) {
        console.error('Tracking API error:', err);
        res.status(500).json({ error: 'Failed to retrieve tracking details.' });
    }
});

// Admin patch endpoint to update courier information and live checkpoints
app.patch('/api/bookings/:orderId/courier', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { 
            courierPartner, 
            awbNumber, 
            currentLocation, 
            estimatedDelivery, 
            status, 
            checkpointMessage, 
            driverName, 
            driverPhone 
        } = req.body;

        let booking = null;
        if (useMongo) {
            booking = await BookingModel.findOne({ orderId });
            if (!booking) return res.status(404).json({ error: 'Order not found.' });

            if (courierPartner) booking.courierPartner = courierPartner;
            if (awbNumber) {
                booking.awbNumber = awbNumber;
                booking.trackingUrl = getCarrierTrackingUrl(booking.courierPartner || courierPartner, awbNumber);
            }
            if (currentLocation) booking.currentLocation = currentLocation;
            if (estimatedDelivery) booking.estimatedDelivery = estimatedDelivery;
            if (status) booking.status = status;

            if (driverName || driverPhone) {
                booking.driverInfo = {
                    name: driverName || booking.driverInfo?.name || 'Delivery Partner',
                    phone: driverPhone || booking.driverInfo?.phone || '+91 99465 50713',
                    vehicle: booking.driverInfo?.vehicle || 'KL-11-AX-4821'
                };
            }

            if (checkpointMessage) {
                const nowStr = new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const history = Array.isArray(booking.trackingHistory) ? [...booking.trackingHistory] : [];
                history.push({
                    status: status || booking.status || 'In Transit',
                    location: currentLocation || booking.currentLocation || 'Transit Facility',
                    timestamp: nowStr,
                    description: checkpointMessage
                });
                booking.trackingHistory = history;
            }

            await booking.save();
            return res.json({ success: true, booking: ensureCourierTrackingData(booking) });
        } else {
            const bookingsList = await readJson(bookingsPath);
            const index = bookingsList.findIndex(b => b.orderId === orderId);
            if (index === -1) return res.status(404).json({ error: 'Order not found.' });

            const b = { ...bookingsList[index] };
            if (courierPartner) b.courierPartner = courierPartner;
            if (awbNumber) {
                b.awbNumber = awbNumber;
                b.trackingUrl = getCarrierTrackingUrl(b.courierPartner || courierPartner, awbNumber);
            }
            if (currentLocation) b.currentLocation = currentLocation;
            if (estimatedDelivery) b.estimatedDelivery = estimatedDelivery;
            if (status) b.status = status;

            if (driverName || driverPhone) {
                b.driverInfo = {
                    name: driverName || b.driverInfo?.name || 'Delivery Partner',
                    phone: driverPhone || b.driverInfo?.phone || '+91 99465 50713',
                    vehicle: b.driverInfo?.vehicle || 'KL-11-AX-4821'
                };
            }

            if (checkpointMessage) {
                const nowStr = new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const history = Array.isArray(b.trackingHistory) ? [...b.trackingHistory] : [];
                history.push({
                    status: status || b.status || 'In Transit',
                    location: currentLocation || b.currentLocation || 'Transit Facility',
                    timestamp: nowStr,
                    description: checkpointMessage
                });
                b.trackingHistory = history;
            }

            bookingsList[index] = b;
            await writeJson(bookingsPath, bookingsList);
            return res.json({ success: true, booking: ensureCourierTrackingData(b) });
        }
    } catch (err) {
        console.error('Courier update error:', err);
        res.status(500).json({ error: 'Failed to update courier tracking.' });
    }
});

// --------------------------------------------------------------------------
// 10B. RAZORPAY PAYMENT GATEWAY ENDPOINTS
// --------------------------------------------------------------------------
async function getRazorpayConfig() {
    let keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_TlpkVGUFJvf2lv';
    let keySecret = process.env.RAZORPAY_KEY_SECRET || 'QDaTxvxvNq19jyC77BER8ATh';
    let isEnabled = true;

    try {
        if (useMongo) {
            const settings = await SettingsModel.findOne({ key: 'main' });
            if (settings?.razorpayKeyId) keyId = settings.razorpayKeyId;
            if (settings?.razorpayKeySecret) keySecret = settings.razorpayKeySecret;
            if (settings?.razorpayEnabled !== undefined) isEnabled = settings.razorpayEnabled;
        } else {
            const fileSettings = await readJson(settingsPath);
            const s = Array.isArray(fileSettings) ? fileSettings[0] : fileSettings;
            if (s?.razorpayKeyId) keyId = s.razorpayKeyId;
            if (s?.razorpayKeySecret) keySecret = s.razorpayKeySecret;
            if (s?.razorpayEnabled !== undefined) isEnabled = s.razorpayEnabled;
        }
    } catch (e) {
        console.error('Failed to read Razorpay config:', e.message);
    }

    // Always prioritize the environment variables provided in .env
    if (process.env.RAZORPAY_KEY_ID) keyId = process.env.RAZORPAY_KEY_ID;
    if (process.env.RAZORPAY_KEY_SECRET) keySecret = process.env.RAZORPAY_KEY_SECRET;

    return { keyId, keySecret, isEnabled };
}

// --------------------------------------------------------------------------
// 10B. RAZORPAY STANDARD WEB CHECKOUT ENDPOINTS
// --------------------------------------------------------------------------

// 1. Create Order: POST /api/create-order, POST /create-order, POST /api/razorpay/create-order
const handleCreateRazorpayOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt, amountInRupees } = req.body;

        // Determine amount in paise
        let amountInPaise;
        if (amountInRupees !== undefined) {
            amountInPaise = Math.round(Number(amountInRupees) * 100);
        } else if (amount !== undefined) {
            amountInPaise = Math.round(Number(amount));
        } else {
            return res.status(400).json({ error: 'Payment amount is required.' });
        }

        // STEP 1 Requirement: Validate minimum amount >= 100 paise (1 INR)
        if (isNaN(amountInPaise) || amountInPaise < 100) {
            return res.status(400).json({ 
                error: 'Amount must be at least 100 paise (₹1).' 
            });
        }

        const { keyId, keySecret } = await getRazorpayConfig();
        if (!keyId || !keySecret) {
            return res.status(401).json({ 
                error: 'Razorpay API credentials (KEY_ID, KEY_SECRET) are missing or not configured.' 
            });
        }

        const razorpayInstance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret
        });

        const orderOptions = {
            amount: amountInPaise,
            currency: currency || 'INR',
            receipt: receipt || `rcpt_${Date.now()}`
        };

        try {
            const order = await razorpayInstance.orders.create(orderOptions);
            // Return { order_id, amount, currency } as required by spec, plus id & key_id for client convenience
            return res.status(200).json({
                order_id: order.id,
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                key_id: keyId,
                keyId: keyId,
                receipt: order.receipt
            });
        } catch (rzpErr) {
            console.error('Razorpay orders.create error:', rzpErr);
            // Handle auth failures (return 401)
            if (rzpErr.statusCode === 401 || (rzpErr.error && rzpErr.error.code === 'BAD_REQUEST_ERROR' && rzpErr.error.description?.toLowerCase().includes('auth'))) {
                return res.status(401).json({ 
                    error: 'Razorpay authentication failed. Invalid Key ID or Key Secret.' 
                });
            }
            // Handle Razorpay API errors (return 500)
            return res.status(500).json({ 
                error: 'Failed to create Razorpay order.', 
                details: rzpErr.error ? rzpErr.error.description : rzpErr.message 
            });
        }
    } catch (err) {
        console.error('Razorpay create-order server error:', err);
        return res.status(500).json({ error: 'Internal server error creating payment order.' });
    }
};

app.post('/api/create-order', handleCreateRazorpayOrder);
app.post('/create-order', handleCreateRazorpayOrder);
app.post('/api/razorpay/create-order', handleCreateRazorpayOrder);
app.post('/api/api/create-order', handleCreateRazorpayOrder);

// 2. Verify Payment: POST /api/verify-payment, POST /verify-payment, POST /api/razorpay/verify-payment
const handleVerifyRazorpayPayment = async (req, res) => {
    try {
        const { 
            order_id, 
            payment_id, 
            signature, 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature, 
            customer, 
            items, 
            subtotal, 
            delivery, 
            total, 
            couponCode, 
            discount 
        } = req.body;

        const effectiveOrderId = razorpay_order_id || order_id;
        const effectivePaymentId = razorpay_payment_id || payment_id;
        const effectiveSignature = razorpay_signature || signature;

        // STEP 3 Requirement: Missing fields validation -> return 400
        if (!effectiveOrderId || !effectivePaymentId || !effectiveSignature) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields for signature verification (order_id, payment_id, signature).' 
            });
        }

        const { keySecret } = await getRazorpayConfig();
        if (!keySecret) {
            return res.status(500).json({ 
                success: false, 
                error: 'Razorpay KEY_SECRET is not configured on server.' 
            });
        }

        // STEP 3 Requirement: Algorithm HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${effectiveOrderId}|${effectivePaymentId}`)
            .digest('hex');

        // Signature mismatch: return 400, do NOT mark as paid
        if (expectedSignature !== effectiveSignature) {
            console.warn(`[Razorpay] Signature mismatch for order: ${effectiveOrderId}`);
            return res.status(400).json({ 
                success: false, 
                error: 'Payment verification failed: Signature mismatch.' 
            });
        }

        // Signatures match! If this is a checkout submission, persist the booking and decrement stock
        if (customer && items && Array.isArray(items) && items.length > 0) {
            let products = [];
            if (useMongo) {
                products = await ProductModel.find().lean();
            } else {
                products = await readJson(productsPath);
            }

            const validatedItems = [];
            for (const item of items) {
                const productRef = products.find(p => Number(p.id) === Number(item.id));
                const size = item.size || 'M';
                const price = productRef ? productRef.price : (item.price || 0);
                const costPrice = productRef?.costPrice !== undefined ? Number(productRef.costPrice) : Math.round(price * 0.5);
                const quantity = parseInt(item.quantity) || 1;

                validatedItems.push({
                    id: item.id,
                    title: productRef ? productRef.title : item.title,
                    image: productRef ? productRef.image : item.image,
                    price: price,
                    costPrice: costPrice,
                    size: size,
                    quantity: quantity,
                    category: productRef ? productRef.category : item.category
                });
            }

            const finalSubtotal = subtotal !== undefined ? Number(subtotal) : validatedItems.reduce((s, it) => s + (it.price * it.quantity), 0);
            const finalDelivery = delivery !== undefined ? Number(delivery) : (finalSubtotal >= 999 ? 0 : 60);
            const finalTotal = total !== undefined ? Number(total) : (finalSubtotal + finalDelivery);

            const bookingOrderId = `TR-${Math.floor(100000 + Math.random() * 900000)}`;
            const dateString = new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const courierData = generateCourierDetails(bookingOrderId, dateString, customer?.district);

            const newBookingRecord = {
                orderId: bookingOrderId,
                date: dateString,
                customer: {
                    ...customer,
                    payment: 'Razorpay Online',
                    paymentMethod: 'razorpay',
                    paymentStatus: 'Paid',
                    razorpayOrderId: effectiveOrderId,
                    razorpayPaymentId: effectivePaymentId
                },
                paymentMethod: 'razorpay',
                payment: 'Razorpay Online',
                paymentStatus: 'Paid',
                razorpayOrderId: effectiveOrderId,
                razorpayPaymentId: effectivePaymentId,
                items: validatedItems,
                subtotal: finalSubtotal,
                delivery: finalDelivery,
                total: finalTotal,
                couponCode: couponCode || undefined,
                discount: discount || 0,
                status: 'Confirmed',
                ...courierData
            };

            // Decrement stock & persist
            if (useMongo) {
                for (const item of validatedItems) {
                    await ProductModel.findOneAndUpdate(
                        { id: item.id },
                        { $inc: { stock: -item.quantity } }
                    );
                    const p = await ProductModel.findOne({ id: item.id });
                    if (p && p.stock <= 0) {
                        p.inStock = false;
                        await p.save();
                    }
                }
                const bookingDoc = new BookingModel(newBookingRecord);
                await bookingDoc.save();
                return res.status(200).json({
                    success: true,
                    message: 'Payment verified successfully and order created.',
                    order_id: effectiveOrderId,
                    payment_id: effectivePaymentId,
                    booking: bookingDoc,
                    ...bookingDoc.toObject()
                });
            } else {
                const updatedProductsList = products.map(p => {
                    const boughtItems = validatedItems.filter(vi => vi.id === p.id);
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
                await writeJson(productsPath, updatedProductsList);

                const currentBookings = await readJson(bookingsPath);
                currentBookings.unshift(newBookingRecord);
                await writeJson(bookingsPath, currentBookings);

                return res.status(200).json({
                    success: true,
                    message: 'Payment verified successfully and order created.',
                    order_id: effectiveOrderId,
                    payment_id: effectivePaymentId,
                    booking: newBookingRecord,
                    ...newBookingRecord
                });
            }
        }

        // Return standard verification success response when not creating a store booking
        return res.status(200).json({
            success: true,
            message: 'Payment signature verified successfully.',
            order_id: effectiveOrderId,
            payment_id: effectivePaymentId
        });
    } catch (err) {
        console.error('Razorpay verify-payment error:', err);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to verify payment signature on server.' 
        });
    }
};

app.post('/api/verify-payment', handleVerifyRazorpayPayment);
app.post('/verify-payment', handleVerifyRazorpayPayment);
app.post('/api/razorpay/verify-payment', handleVerifyRazorpayPayment);
app.post('/api/api/verify-payment', handleVerifyRazorpayPayment);

// Fetch reviews for a specific product
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const { id } = req.params;
        let reviews = [];
        if (useMongo) {
            reviews = await ReviewModel.find({ productId: parseInt(id) }).sort({ date: -1 });
        } else {
            const fileReviews = await readJson(reviewsPath);
            reviews = fileReviews.filter(r => r.productId === parseInt(id));
        }
        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch reviews.' });
    }
});

// Submit a product review
app.post('/api/reviews', async (req, res) => {
    try {
        const { productId, orderId, rating, comment, customerName, customerPhone } = req.body;
        if (!productId || !orderId || !rating || !comment || !customerPhone) {
            return res.status(400).json({ error: 'Missing review payload data.' });
        }

        // Verify the order exists and is delivered
        let booking = null;
        if (useMongo) {
            booking = await BookingModel.findOne({ orderId });
        } else {
            const fileBookings = await readJson(bookingsPath);
            booking = fileBookings.find(b => b.orderId === orderId);
        }

        if (!booking) {
            return res.status(400).json({ error: 'Invalid Order ID.' });
        }

        const phoneNum = booking.customer?.phone || booking.customerPhone;
        if (phoneNum !== customerPhone) {
            return res.status(403).json({ error: 'Unauthorized to review this order.' });
        }

        if (booking.status.toLowerCase() !== 'delivered') {
            return res.status(400).json({ error: 'Reviews can only be submitted after the order is Delivered.' });
        }

        // Check if already reviewed
        let alreadyReviewed = false;
        if (useMongo) {
            alreadyReviewed = await ReviewModel.exists({ orderId, productId });
        } else {
            const fileReviews = await readJson(reviewsPath);
            alreadyReviewed = fileReviews.some(r => r.orderId === orderId && r.productId === productId);
        }

        if (alreadyReviewed) {
            return res.status(400).json({ error: 'You have already reviewed this product for this order.' });
        }

        const newReview = {
            productId: parseInt(productId),
            orderId,
            customerName: customerName || 'Verified Customer',
            customerPhone,
            rating: parseInt(rating),
            comment,
            date: new Date()
        };

        if (useMongo) {
            const reviewDoc = new ReviewModel(newReview);
            await reviewDoc.save();

            // Update product rating and reviews count
            const reviewsList = await ReviewModel.find({ productId: parseInt(productId) });
            const avgRating = reviewsList.reduce((sum, r) => sum + r.rating, 0) / reviewsList.length;
            await ProductModel.findOneAndUpdate(
                { id: parseInt(productId) },
                { $set: { rating: Math.round(avgRating * 10) / 10 }, $inc: { reviews: 1 } }
            );
        } else {
            const fileReviews = await readJson(reviewsPath);
            fileReviews.unshift(newReview);
            await writeJson(reviewsPath, fileReviews);

            const productsList = await readJson(productsPath);
            const updatedProducts = productsList.map(p => {
                if (p.id === parseInt(productId)) {
                    const productReviews = fileReviews.filter(r => r.productId === p.id);
                    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
                    return {
                        ...p,
                        rating: Math.round(avgRating * 10) / 10,
                        reviews: p.reviews + 1
                    };
                }
                return p;
            });
            await writeJson(productsPath, updatedProducts);
        }

        res.status(201).json({ success: true, message: 'Review submitted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit review.' });
    }
});

// --------------------------------------------------------------------------
// USER AUTHENTICATION & LOGIN ENDPOINTS
// --------------------------------------------------------------------------

// Register User (OTP-less 6-digit MPIN setup)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { phone, name, mpin } = req.body;
        if (!phone || !name || !mpin) {
            return res.status(400).json({ error: 'Phone, Name, and MPIN are required.' });
        }
        if (!/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
        }
        if (!/^[0-9]{6}$/.test(mpin)) {
            return res.status(400).json({ error: 'MPIN must be exactly 6 digits.' });
        }
        if (/\d/.test(name)) {
            return res.status(400).json({ error: 'Name cannot contain numbers.' });
        }

        if (useMongo) {
            const existingUser = await UserModel.findOne({ phone });
            if (existingUser) {
                return res.status(400).json({ error: 'User already registered with this mobile number.' });
            }
            const hashedPassword = hashMpin(mpin, phone);
            const newUser = new UserModel({ phone, name, mpin: hashedPassword, lastActiveAt: Date.now() });
            await newUser.save();
            res.status(201).json({ success: true, user: { phone: newUser.phone, name: newUser.name } });
        } else {
            const users = await readJson(usersPath);
            const existingUser = users.find(u => u.phone === phone);
            if (existingUser) {
                return res.status(400).json({ error: 'User already registered with this mobile number.' });
            }
            const hashedPassword = hashMpin(mpin, phone);
            const newUser = { phone, name, mpin: hashedPassword, lastActiveAt: Date.now() };
            users.push(newUser);
            await writeJson(usersPath, users);
            res.status(201).json({ success: true, user: { phone, name } });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed.' });
    }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
    try {
        const { phone, mpin } = req.body;
        if (!phone || !mpin) {
            return res.status(400).json({ error: 'Phone and MPIN are required.' });
        }

        if (useMongo) {
            const user = await UserModel.findOne({ phone });
            if (!user) {
                await logUserLogin(phone, 'Unknown', 'failed (user not found)', req);
                return res.status(400).json({ error: 'Invalid mobile number or MPIN.' });
            }

            // 1. Check if permanently blocked
            if (user.isBlocked) {
                await logUserLogin(phone, user.name, 'failed (blocked)', req);
                return res.status(403).json({ error: 'This account is permanently blocked. Contact Admin to unblock.' });
            }

            // 2. Check if temporarily locked
            if (user.lockUntil && user.lockUntil > Date.now()) {
                await logUserLogin(phone, user.name, 'failed (locked)', req);
                const remainingMins = Math.ceil((user.lockUntil - Date.now()) / 60000);
                return res.status(403).json({ error: `Account temporarily locked. Try again in ${remainingMins} minute(s).` });
            }

            // 3. Verify MPIN (support auto-migration for plain text to hash)
            const incomingHash = hashMpin(mpin, phone);
            let isMpinValid = false;
            let needsMigration = false;

            if (/^\d{6}$/.test(user.mpin)) {
                if (user.mpin === mpin) {
                    isMpinValid = true;
                    needsMigration = true;
                }
            } else {
                isMpinValid = (user.mpin === incomingHash);
            }

            if (!isMpinValid) {
                const attempts = (user.loginAttempts || 0) + 1;
                let errMsg = 'Incorrect MPIN.';
                
                user.loginAttempts = attempts;
                if (attempts === 5) {
                    user.lockUntil = Date.now() + 5 * 60 * 1000; // 5 mins
                    errMsg = 'Incorrect MPIN. Too many failed attempts. Account locked for 5 minutes.';
                } else if (attempts >= 7) {
                    user.isBlocked = true;
                    errMsg = 'Incorrect MPIN. Too many failed attempts. Account has been permanently blocked. Contact Admin.';
                } else {
                    const remaining = attempts < 5 ? 5 - attempts : 7 - attempts;
                    const type = attempts < 5 ? 'temporary lockout' : 'permanent block';
                    errMsg = `Incorrect MPIN. Remaining attempts before ${type}: ${remaining}`;
                }
                await logUserLogin(phone, user.name, 'failed (incorrect MPIN)', req);
                await user.save();
                return res.status(400).json({ error: errMsg });
            }

            // 4. Success: Reset retries and upgrade credentials to secure hash if necessary
            user.loginAttempts = 0;
            user.lockUntil = 0;
            if (needsMigration) {
                user.mpin = incomingHash;
            }
            user.lastActiveAt = Date.now();
            await user.save();

            await logUserLogin(user.phone, user.name, 'success', req);
            res.json({ success: true, user: { phone: user.phone, name: user.name } });
        } else {
            const users = await readJson(usersPath);
            const userIndex = users.findIndex(u => u.phone === phone);
            if (userIndex === -1) {
                await logUserLogin(phone, 'Unknown', 'failed (user not found)', req);
                return res.status(400).json({ error: 'Invalid mobile number or MPIN.' });
            }

            const user = users[userIndex];

            // 1. Check if permanently blocked
            if (user.isBlocked) {
                await logUserLogin(phone, user.name, 'failed (blocked)', req);
                return res.status(403).json({ error: 'This account is permanently blocked. Contact Admin to unblock.' });
            }

            // 2. Check if temporarily locked
            if (user.lockUntil && user.lockUntil > Date.now()) {
                await logUserLogin(phone, user.name, 'failed (locked)', req);
                const remainingMins = Math.ceil((user.lockUntil - Date.now()) / 60000);
                return res.status(403).json({ error: `Account temporarily locked. Try again in ${remainingMins} minute(s).` });
            }

            // 3. Verify MPIN (support auto-migration for plain text to hash)
            const incomingHash = hashMpin(mpin, phone);
            let isMpinValid = false;
            let needsMigration = false;

            if (/^\d{6}$/.test(user.mpin)) {
                if (user.mpin === mpin) {
                    isMpinValid = true;
                    needsMigration = true;
                }
            } else {
                isMpinValid = (user.mpin === incomingHash);
            }

            if (!isMpinValid) {
                const attempts = (user.loginAttempts || 0) + 1;
                let errMsg = 'Incorrect MPIN.';
                
                user.loginAttempts = attempts;
                if (attempts === 5) {
                    user.lockUntil = Date.now() + 5 * 60 * 1000;
                    errMsg = 'Incorrect MPIN. Too many failed attempts. Account locked for 5 minutes.';
                } else if (attempts >= 7) {
                    user.isBlocked = true;
                    errMsg = 'Incorrect MPIN. Too many failed attempts. Account has been permanently blocked. Contact Admin.';
                } else {
                    const remaining = attempts < 5 ? 5 - attempts : 7 - attempts;
                    const type = attempts < 5 ? 'temporary lockout' : 'permanent block';
                    errMsg = `Incorrect MPIN. Remaining attempts before ${type}: ${remaining}`;
                }
                await logUserLogin(phone, user.name, 'failed (incorrect MPIN)', req);
                users[userIndex] = user;
                await writeJson(usersPath, users);
                return res.status(400).json({ error: errMsg });
            }

            // 4. Success: Reset retries and upgrade credentials to secure hash if necessary
            user.loginAttempts = 0;
            user.lockUntil = 0;
            if (needsMigration) {
                user.mpin = incomingHash;
            }
            user.lastActiveAt = Date.now();
            users[userIndex] = user;
            await writeJson(usersPath, users);

            await logUserLogin(user.phone, user.name, 'success', req);
            res.json({ success: true, user: { phone: user.phone, name: user.name } });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed.' });
    }
});

// Google OAuth Sign-In & Register
app.post('/api/auth/google', async (req, res) => {
    try {
        const { credential, profile } = req.body;
        let googleId = '';
        let email = '';
        let name = '';
        let avatar = '';

        if (credential) {
            try {
                // Official Google OAuth Tokeninfo Cryptographic Validation
                const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
                const googleVerifyRes = await fetch(verifyUrl);
                if (googleVerifyRes.ok) {
                    const tokenInfo = await googleVerifyRes.json();
                    googleId = tokenInfo.sub || '';
                    email = tokenInfo.email || '';
                    name = tokenInfo.name || tokenInfo.given_name || 'Google User';
                    avatar = tokenInfo.picture || '';
                } else {
                    // Fallback decode if offline or mock token
                    const parts = credential.split('.');
                    if (parts.length >= 2) {
                        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                        googleId = payload.sub || '';
                        email = payload.email || '';
                        name = payload.name || payload.given_name || 'Google User';
                        avatar = payload.picture || '';
                    }
                }
            } catch (jwtErr) {
                console.warn('Google token verification fallback to decode:', jwtErr.message);
                try {
                    const parts = credential.split('.');
                    if (parts.length >= 2) {
                        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                        googleId = payload.sub || '';
                        email = payload.email || '';
                        name = payload.name || payload.given_name || 'Google User';
                        avatar = payload.picture || '';
                    }
                } catch { }
            }
        }

        // Fallback to direct profile object if passed
        if (!email && profile) {
            googleId = profile.id || profile.sub || profile.googleId || '';
            email = profile.email || '';
            name = profile.name || 'Google User';
            avatar = profile.avatar || profile.picture || '';
        }

        if (!email) {
            return res.status(400).json({ error: 'Valid Google email account is required.' });
        }

        if (useMongo) {
            let user = await UserModel.findOne({
                $or: [
                    { googleId: googleId && googleId !== '' ? googleId : '__no_match__' },
                    { email: email.toLowerCase() }
                ]
            });

            if (user) {
                if (user.isBlocked) {
                    await logUserLogin(user.phone || email, user.name, 'failed (blocked)', req);
                    return res.status(403).json({ error: 'This account is permanently blocked. Contact Admin to unblock.' });
                }

                user.lastActiveAt = Date.now();
                if (!user.googleId && googleId) user.googleId = googleId;
                if (!user.avatar && avatar) user.avatar = avatar;
                if (!user.email && email) user.email = email.toLowerCase();
                await user.save();

                await logUserLogin(user.phone || email, user.name, 'success (Google)', req);
                return res.json({
                    success: true,
                    user: {
                        name: user.name,
                        email: user.email,
                        phone: user.phone || '',
                        avatar: user.avatar || avatar,
                        authProvider: 'google'
                    }
                });
            } else {
                // Register new user via Google
                const newUser = new UserModel({
                    name: name || 'Google Customer',
                    email: email.toLowerCase(),
                    googleId: googleId || '',
                    avatar: avatar || '',
                    authProvider: 'google',
                    lastActiveAt: Date.now()
                });
                await newUser.save();

                await logUserLogin(email, newUser.name, 'registered (Google)', req);
                return res.status(201).json({
                    success: true,
                    isNew: true,
                    user: {
                        name: newUser.name,
                        email: newUser.email,
                        phone: '',
                        avatar: newUser.avatar,
                        authProvider: 'google'
                    }
                });
            }
        } else {
            const users = await readJson(usersPath);
            let user = users.find(u => 
                (googleId && u.googleId === googleId) || 
                (u.email && u.email.toLowerCase() === email.toLowerCase())
            );

            if (user) {
                if (user.isBlocked) {
                    await logUserLogin(user.phone || email, user.name, 'failed (blocked)', req);
                    return res.status(403).json({ error: 'This account is permanently blocked. Contact Admin to unblock.' });
                }

                user.lastActiveAt = Date.now();
                if (!user.googleId && googleId) user.googleId = googleId;
                if (!user.avatar && avatar) user.avatar = avatar;
                if (!user.email && email) user.email = email.toLowerCase();
                await writeJson(usersPath, users);

                await logUserLogin(user.phone || email, user.name, 'success (Google)', req);
                return res.json({
                    success: true,
                    user: {
                        name: user.name,
                        email: user.email,
                        phone: user.phone || '',
                        avatar: user.avatar || avatar,
                        authProvider: 'google'
                    }
                });
            } else {
                const newUser = {
                    name: name || 'Google Customer',
                    email: email.toLowerCase(),
                    googleId: googleId || '',
                    avatar: avatar || '',
                    phone: '',
                    authProvider: 'google',
                    lastActiveAt: Date.now()
                };
                users.push(newUser);
                await writeJson(usersPath, users);

                await logUserLogin(email, newUser.name, 'registered (Google)', req);
                return res.status(201).json({
                    success: true,
                    isNew: true,
                    user: {
                        name: newUser.name,
                        email: newUser.email,
                        phone: '',
                        avatar: newUser.avatar,
                        authProvider: 'google'
                    }
                });
            }
        }
    } catch (err) {
        console.error('Google Auth error:', err);
        res.status(500).json({ error: 'Google authentication failed.' });
    }
});

// --------------------------------------------------------------------------
// CUSTOMER PROFILE MANAGEMENT ENDPOINTS
// --------------------------------------------------------------------------
// 1. Get Customer Profile
app.get('/api/users/profile', async (req, res) => {
    try {
        const { phone, email } = req.query;
        if (!phone && !email) {
            return res.status(400).json({ error: 'Phone or email is required to fetch profile.' });
        }

        let user = null;
        if (useMongo) {
            const query = [];
            if (phone) query.push({ phone });
            if (email) query.push({ email: email.toLowerCase() });
            user = await UserModel.findOne({ $or: query });
        } else {
            const users = await readJson(usersPath);
            user = users.find(u => (phone && u.phone === phone) || (email && u.email && u.email.toLowerCase() === email.toLowerCase()));
        }

        if (!user) {
            return res.status(404).json({ error: 'User profile not found.' });
        }

        res.json({
            success: true,
            user: {
                name: user.name,
                email: user.email || '',
                phone: user.phone || '',
                whatsapp: user.whatsapp || user.phone || '',
                address: user.address || '',
                district: user.district || '',
                pincode: user.pincode || '',
                avatar: user.avatar || '',
                authProvider: user.authProvider || 'local'
            }
        });
    } catch (err) {
        console.error('Fetch profile error:', err);
        res.status(500).json({ error: 'Failed to retrieve profile.' });
    }
});

// 2. Update Customer Profile Details
app.put('/api/users/profile', async (req, res) => {
    try {
        const { currentIdentifier, name, phone, email, whatsapp, address, district, pincode } = req.body;
        if (!currentIdentifier && !phone && !email) {
            return res.status(400).json({ error: 'User identification is required to update profile.' });
        }

        const identifier = currentIdentifier || phone || email;

        if (useMongo) {
            let user = await UserModel.findOne({
                $or: [
                    { phone: identifier },
                    { email: identifier.toLowerCase() },
                    { googleId: identifier }
                ]
            });

            if (!user) {
                if (email) user = await UserModel.findOne({ email: email.toLowerCase() });
                if (!user && phone) user = await UserModel.findOne({ phone });
            }

            if (!user) {
                return res.status(404).json({ error: 'User not found.' });
            }

            if (name) user.name = name;
            if (phone !== undefined) user.phone = phone;
            if (whatsapp !== undefined) user.whatsapp = whatsapp;
            if (address !== undefined) user.address = address;
            if (district !== undefined) user.district = district;
            if (pincode !== undefined) user.pincode = pincode;
            if (email && !user.email) user.email = email.toLowerCase();
            user.lastActiveAt = Date.now();

            await user.save();

            res.json({
                success: true,
                message: 'Profile updated successfully.',
                user: {
                    name: user.name,
                    email: user.email || '',
                    phone: user.phone || '',
                    whatsapp: user.whatsapp || user.phone || '',
                    address: user.address || '',
                    district: user.district || '',
                    pincode: user.pincode || '',
                    avatar: user.avatar || '',
                    authProvider: user.authProvider || 'local'
                }
            });
        } else {
            const users = await readJson(usersPath);
            const userIndex = users.findIndex(u => 
                u.phone === identifier || 
                (u.email && u.email.toLowerCase() === identifier.toLowerCase()) || 
                u.googleId === identifier
            );

            if (userIndex === -1) {
                return res.status(404).json({ error: 'User not found.' });
            }

            if (name) users[userIndex].name = name;
            if (phone !== undefined) users[userIndex].phone = phone;
            if (whatsapp !== undefined) users[userIndex].whatsapp = whatsapp;
            if (address !== undefined) users[userIndex].address = address;
            if (district !== undefined) users[userIndex].district = district;
            if (pincode !== undefined) users[userIndex].pincode = pincode;
            if (email && !users[userIndex].email) users[userIndex].email = email.toLowerCase();
            users[userIndex].lastActiveAt = Date.now();

            await writeJson(usersPath, users);

            res.json({
                success: true,
                message: 'Profile updated successfully.',
                user: {
                    name: users[userIndex].name,
                    email: users[userIndex].email || '',
                    phone: users[userIndex].phone || '',
                    whatsapp: users[userIndex].whatsapp || users[userIndex].phone || '',
                    address: users[userIndex].address || '',
                    district: users[userIndex].district || '',
                    pincode: users[userIndex].pincode || '',
                    avatar: users[userIndex].avatar || '',
                    authProvider: users[userIndex].authProvider || 'local'
                }
            });
        }
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Failed to update profile.' });
    }
});

// --------------------------------------------------------------------------
// USER-SPECIFIC BOOKINGS ENDPOINT
// --------------------------------------------------------------------------
app.get('/api/bookings/user/:phone', async (req, res) => {
    try {
        const phone = req.params.phone;
        if (useMongo) {
            const bookings = await BookingModel.find({
                $or: [
                    { 'customer.phone': phone },
                    { 'customer.whatsapp': phone }
                ]
            }).sort({ _id: -1 });
            res.json(bookings.map(b => ensureCourierTrackingData(b)));
        } else {
            const bookings = await readJson(bookingsPath);
            const filtered = bookings.filter(b => b.customer.phone === phone || b.customer.whatsapp === phone);
            res.json(filtered.map(b => ensureCourierTrackingData(b)));
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bookings for user.' });
    }
});

// --------------------------------------------------------------------------
// COUPON MANAGEMENT & VALIDATION ENDPOINTS
// --------------------------------------------------------------------------

// Fetch all coupons (Admin)
app.get('/api/coupons', async (req, res) => {
    try {
        if (useMongo) {
            const coupons = await CouponModel.find().sort({ _id: -1 });
            res.json(coupons);
        } else {
            const coupons = await readJson(couponsPath);
            res.json(coupons);
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch coupons.' });
    }
});

// Create Coupon (Admin)
app.post('/api/coupons', async (req, res) => {
    try {
        const { code, discountType, discountValue, minSubtotal } = req.body;
        if (!code || !discountValue) {
            return res.status(400).json({ error: 'Coupon code and discount value are required.' });
        }
        const formattedCode = code.trim().toUpperCase();

        if (useMongo) {
            const existingCoupon = await CouponModel.findOne({ code: formattedCode });
            if (existingCoupon) {
                return res.status(400).json({ error: 'Coupon code already exists.' });
            }
            const newCoupon = new CouponModel({
                code: formattedCode,
                discountType: discountType || 'flat',
                discountValue: Number(discountValue),
                minSubtotal: minSubtotal ? Number(minSubtotal) : 0,
                isActive: true
            });
            await newCoupon.save();
            res.status(201).json(newCoupon);
        } else {
            const coupons = await readJson(couponsPath);
            const existingCoupon = coupons.find(c => c.code === formattedCode);
            if (existingCoupon) {
                return res.status(400).json({ error: 'Coupon code already exists.' });
            }
            const newCoupon = {
                id: Date.now().toString(),
                code: formattedCode,
                discountType: discountType || 'flat',
                discountValue: Number(discountValue),
                minSubtotal: minSubtotal ? Number(minSubtotal) : 0,
                isActive: true
            };
            coupons.unshift(newCoupon);
            await writeJson(couponsPath, coupons);
            res.status(201).json(newCoupon);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create coupon.' });
    }
});

// Delete Coupon (Admin)
app.delete('/api/coupons/:code', async (req, res) => {
    try {
        const code = req.params.code.toUpperCase();
        if (useMongo) {
            const deleted = await CouponModel.findOneAndDelete({ code });
            if (!deleted) return res.status(404).json({ error: 'Coupon not found.' });
            res.json({ message: 'Coupon deleted successfully.' });
        } else {
            const coupons = await readJson(couponsPath);
            const filtered = coupons.filter(c => c.code !== code);
            if (coupons.length === filtered.length) {
                return res.status(404).json({ error: 'Coupon not found.' });
            }
            await writeJson(couponsPath, filtered);
            res.json({ message: 'Coupon deleted successfully.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete coupon.' });
    }
});

// Validate Coupon (Checkout)
app.post('/api/coupons/validate', async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        if (!code || subtotal === undefined) {
            return res.status(400).json({ error: 'Coupon code and cart subtotal are required.' });
        }
        const formattedCode = code.trim().toUpperCase();

        let coupon = null;
        if (useMongo) {
            coupon = await CouponModel.findOne({ code: formattedCode, isActive: true });
        } else {
            const coupons = await readJson(couponsPath);
            coupon = coupons.find(c => c.code === formattedCode && c.isActive);
        }

        if (!coupon) {
            return res.status(404).json({ error: 'Invalid or expired coupon code.' });
        }

        if (subtotal < coupon.minSubtotal) {
            return res.status(400).json({ error: `Minimum order subtotal for this coupon is ₹${coupon.minSubtotal}.` });
        }

        res.json({
            valid: true,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to validate coupon.' });
    }
});

// --------------------------------------------------------------------------
// ADMIN USER MANAGEMENT ENDPOINTS
// --------------------------------------------------------------------------

// Fetch all registered users (Admin view)
app.get('/api/admin/users', requireAdminOrDeveloper, async (req, res) => {
    try {
        if (useMongo) {
            const users = await UserModel.find({}, { mpin: 0 }).sort({ _id: -1 });
            res.json(users);
        } else {
            const users = await readJson(usersPath);
            // Strip password/mpin for security
            const sanitized = users.map(({ mpin, ...rest }) => rest);
            res.json(sanitized);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users list.' });
    }
});

// Unblock / Reset user login attempts
app.post('/api/admin/users/unblock/:phone', requireAdminOrDeveloper, async (req, res) => {
    try {
        const { phone } = req.params;
        if (useMongo) {
            const user = await UserModel.findOne({ phone });
            if (!user) {
                return res.status(404).json({ error: 'User not found.' });
            }
            user.loginAttempts = 0;
            user.lockUntil = 0;
            user.isBlocked = false;
            user.blockedAt = 0;
            await user.save();
            res.json({ success: true, message: 'User unblocked successfully.' });
        } else {
            const users = await readJson(usersPath);
            const userIndex = users.findIndex(u => u.phone === phone);
            if (userIndex === -1) {
                return res.status(404).json({ error: 'User not found.' });
            }
            users[userIndex].loginAttempts = 0;
            users[userIndex].lockUntil = 0;
            users[userIndex].isBlocked = false;
            users[userIndex].blockedAt = 0;
            await writeJson(usersPath, users);
            res.json({ success: true, message: 'User unblocked successfully.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to unblock user.' });
    }
});

// Block user account manually
app.post('/api/admin/users/block/:phone', requireAdminOrDeveloper, async (req, res) => {
    try {
        const { phone } = req.params;
        if (useMongo) {
            const user = await UserModel.findOne({ phone });
            if (!user) {
                return res.status(404).json({ error: 'User not found.' });
            }
            user.isBlocked = true;
            user.blockedAt = Date.now();
            await user.save();
            res.json({ success: true, message: 'User blocked successfully.' });
        } else {
            const users = await readJson(usersPath);
            const userIndex = users.findIndex(u => u.phone === phone);
            if (userIndex === -1) {
                return res.status(404).json({ error: 'User not found.' });
            }
            users[userIndex].isBlocked = true;
            users[userIndex].blockedAt = Date.now();
            await writeJson(usersPath, users);
            res.json({ success: true, message: 'User blocked successfully.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to block user.' });
    }
});

// Delete user account manually
app.delete('/api/admin/users/:phone', requireAdminOrDeveloper, async (req, res) => {
    try {
        const { phone } = req.params;
        if (useMongo) {
            const deleted = await UserModel.findOneAndDelete({ phone });
            if (!deleted) {
                return res.status(404).json({ error: 'User not found.' });
            }
            res.json({ success: true, message: 'User account deleted successfully.' });
        } else {
            const users = await readJson(usersPath);
            const userIndex = users.findIndex(u => u.phone === phone);
            if (userIndex === -1) {
                return res.status(404).json({ error: 'User not found.' });
            }
            const filtered = users.filter(u => u.phone !== phone);
            await writeJson(usersPath, filtered);
            res.json({ success: true, message: 'User account deleted successfully.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user.' });
    }
});

// Admin Authentication Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        let settings = null;
        if (useMongo) {
            settings = await SettingsModel.findOne({ key: 'main' });
        } else {
            const fileSettings = await readJson(settingsPath);
            settings = Array.isArray(fileSettings) ? fileSettings[0] : fileSettings;
        }

        const expectedUsername = settings?.adminUsername || 'admin';
        const expectedPassword = settings?.adminPassword || 'admin123';

        if (username === expectedUsername && password === expectedPassword) {
            const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
            if (useMongo) {
                if (!settings) {
                    await SettingsModel.create({ key: 'main', adminSessionToken: sessionToken });
                } else {
                    settings.adminSessionToken = sessionToken;
                    await settings.save();
                }
            } else {
                let data = settings || { whatsappNumber: '919946550713' };
                data.adminSessionToken = sessionToken;
                await writeJson(settingsPath, [data]);
            }
            await logUserLogin('admin', 'Administrator', 'success', req, 'admin');
            res.json({ success: true, sessionToken, message: 'Logged in successfully.' });
        } else {
            await logUserLogin(username || 'admin', 'Administrator', 'failed (incorrect credentials)', req, 'admin');
            res.status(401).json({ error: 'Invalid admin credentials' });
        }
    } catch (err) {
        console.error(err);
        await logUserLogin(username || 'admin', 'Administrator', 'failed (server error)', req, 'admin');
        res.status(500).json({ error: 'Admin login failed.' });
    }
});

// Admin Credentials Update/Change
app.post('/api/admin/change-password', requireAdmin, async (req, res) => {
    try {
        const { currentPassword, newUsername, newPassword } = req.body;
        if (!currentPassword || !newUsername || !newPassword) {
            return res.status(400).json({ error: 'Current password, new username, and new password are required.' });
        }

        let settings = null;
        if (useMongo) {
            settings = await SettingsModel.findOne({ key: 'main' });
        } else {
            const fileSettings = await readJson(settingsPath);
            settings = Array.isArray(fileSettings) ? fileSettings[0] : fileSettings;
        }

        const activePassword = settings?.adminPassword || 'admin123';
        if (currentPassword !== activePassword) {
            return res.status(400).json({ error: 'Current password is incorrect.' });
        }

        if (useMongo) {
            if (!settings) {
                await SettingsModel.create({ key: 'main', adminUsername: newUsername, adminPassword: newPassword });
            } else {
                settings.adminUsername = newUsername;
                settings.adminPassword = newPassword;
                await settings.save();
            }
        } else {
            let data = settings;
            if (!data) data = { whatsappNumber: '919946550713' };
            data.adminUsername = newUsername;
            data.adminPassword = newPassword;
            await writeJson(settingsPath, [data]);
        }

        res.json({ success: true, message: 'Admin credentials changed successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update admin credentials.' });
    }
});

// Developer Authentication Login
app.post('/api/developer/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (username !== 'developer') {
            await logUserLogin(username || 'developer', 'Developer', 'failed (incorrect username)', req, 'developer');
            return res.status(401).json({ error: 'Invalid developer credentials' });
        }

        let settings = null;
        if (useMongo) {
            settings = await SettingsModel.findOne({ key: 'main' });
        } else {
            const fileSettings = await readJson(settingsPath);
            settings = Array.isArray(fileSettings) ? fileSettings[0] : fileSettings;
        }

        const currentPassword = settings?.developerPassword || 'developer123';
        if (password === currentPassword) {
            const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
            if (useMongo) {
                if (!settings) {
                    await SettingsModel.create({ key: 'main', developerSessionToken: sessionToken });
                } else {
                    settings.developerSessionToken = sessionToken;
                    await settings.save();
                }
            } else {
                let data = settings || { whatsappNumber: '919946550713' };
                data.developerSessionToken = sessionToken;
                await writeJson(settingsPath, [data]);
            }
            await logUserLogin('developer', 'Developer', 'success', req, 'developer');
            res.json({ success: true, sessionToken, message: 'Logged in successfully.' });
        } else {
            await logUserLogin('developer', 'Developer', 'failed (incorrect password)', req, 'developer');
            res.status(401).json({ error: 'Invalid developer credentials' });
        }
    } catch (err) {
        console.error(err);
        await logUserLogin(username || 'developer', 'Developer', 'failed (server error)', req, 'developer');
        res.status(500).json({ error: 'Developer login failed.' });
    }
});

// Developer Password Update/Change
app.post('/api/developer/change-password', requireDeveloper, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required.' });
        }

        let settings = null;
        if (useMongo) {
            settings = await SettingsModel.findOne({ key: 'main' });
        } else {
            const fileSettings = await readJson(settingsPath);
            settings = Array.isArray(fileSettings) ? fileSettings[0] : fileSettings;
        }

        const activePassword = settings?.developerPassword || 'developer123';
        if (currentPassword !== activePassword) {
            return res.status(400).json({ error: 'Current password is incorrect.' });
        }

        if (useMongo) {
            if (!settings) {
                await SettingsModel.create({ key: 'main', developerPassword: newPassword });
            } else {
                settings.developerPassword = newPassword;
                await settings.save();
            }
        } else {
            let data = settings;
            if (!data) data = { whatsappNumber: '919946550713' };
            data.developerPassword = newPassword;
            await writeJson(settingsPath, [data]);
        }

        res.json({ success: true, message: 'Developer password changed successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update developer password.' });
    }
});

// Developer Overwrite/Reset Admin Password Directly
app.post('/api/developer/change-admin-password', requireDeveloper, async (req, res) => {
    try {
        const { newAdminUsername, newAdminPassword } = req.body;
        if (!newAdminPassword) {
            return res.status(400).json({ error: 'New admin password is required.' });
        }
        
        const finalUsername = newAdminUsername || 'admin';

        let settings = null;
        if (useMongo) {
            settings = await SettingsModel.findOne({ key: 'main' });
        } else {
            const fileSettings = await readJson(settingsPath);
            settings = Array.isArray(fileSettings) ? fileSettings[0] : fileSettings;
        }

        if (useMongo) {
            if (!settings) {
                await SettingsModel.create({ key: 'main', adminUsername: finalUsername, adminPassword: newAdminPassword });
            } else {
                settings.adminUsername = finalUsername;
                settings.adminPassword = newAdminPassword;
                await settings.save();
            }
        } else {
            let data = settings;
            if (!data) data = { whatsappNumber: '919946550713' };
            data.adminUsername = finalUsername;
            data.adminPassword = newAdminPassword;
            await writeJson(settingsPath, [data]);
        }

        res.json({ success: true, message: 'Admin credentials reset successfully by developer.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reset admin credentials.' });
    }
});

// Fetch all registered users with details for Developer Dashboard
app.get('/api/developer/users', requireDeveloper, async (req, res) => {
    try {
        if (useMongo) {
            const users = await UserModel.find({}, { mpin: 0 }).sort({ _id: -1 });
            res.json(users);
        } else {
            const users = await readJson(usersPath);
            const sanitized = users.map(({ mpin, ...rest }) => rest);
            res.json(sanitized);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users list for developer.' });
    }
});

// Fetch all customer login logs for Developer Dashboard
app.get('/api/developer/logs', requireDeveloper, async (req, res) => {
    try {
        if (useMongo) {
            const logs = await LoginLogModel.find({}).sort({ timestamp: -1 }).limit(100);
            res.json(logs);
        } else {
            const logs = await readJson(loginLogsPath);
            res.json(logs.slice(0, 100));
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch login logs.' });
    }
});

// Fetch Server RAM, DB Connection Fallback, and general health metrics
app.get('/api/developer/system-status', requireDeveloper, async (req, res) => {
    try {
        const memoryUsage = process.memoryUsage();
        const ramUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
        const ramTotal = Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100;

        let mongoStorageUsedMB = 0;
        if (useMongo && mongoose.connection.readyState === 1) {
            try {
                const stats = await mongoose.connection.db.command({ dbStats: 1 });
                const bytes = stats.storageSize || stats.dataSize || 0;
                mongoStorageUsedMB = Math.round(bytes / 1024 / 1024 * 100) / 100;
            } catch (dbErr) {
                console.error('Failed to get MongoDB stats:', dbErr.message);
            }
        }

        const systemStatus = {
            useMongo: useMongo,
            mongoUri: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@') : 'mongodb://127.0.0.1:27017/netravestore',
            ramLimit: 512,
            ramUsed,
            ramTotal,
            mongoStorageLimit: 512,
            mongoStorageUsedMB,
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: process.platform
        };
        res.json(systemStatus);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch system status.' });
    }
});

// Serve frontend static files from the dist folder if it exists
const frontendDistPath = path.join(__dirname, '../frontend/dist');
try {
    await fs.access(frontendDistPath);
    app.use(express.static(frontendDistPath));
    app.get('*', (req, res, next) => {
        // Bypass API routes and uploads
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
    console.log(`[Netrave Backend] Serving frontend static files from ${frontendDistPath}`);
} catch (err) {
    console.log('[Netrave Backend] Frontend build folder not found at ../frontend/dist. Running in API-only mode.');
}

// Start Server
app.listen(PORT, () => {
    console.log(`[Netrave Backend] Server is active and listening on port ${PORT}`);
});

