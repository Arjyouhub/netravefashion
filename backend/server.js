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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const productsPath = path.join(__dirname, 'data', 'products.json');
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

// Product Schema
const ProductSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    rating: { type: Number, default: 5 },
    reviews: { type: Number, default: 0 },
    image: { type: String },
    description: { type: String },
    sizes: [String],
    tags: [String],
    stock: { type: Number, default: 50 },
    inStock: { type: Boolean, default: true }
});
const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// Booking Schema
const BookingSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    customer: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        whatsapp: { type: String, required: true },
        address: { type: String, required: true },
        district: { type: String, required: true },
        pincode: { type: String, required: true },
        payment: { type: String, required: true }
    },
    items: [mongoose.Schema.Types.Mixed],
    subtotal: { type: Number, required: true },
    delivery: { type: Number, required: true },
    total: { type: Number, required: true },
    status: { type: String, default: 'Pending' }
});
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
    offerNotification: { type: String, default: '' }
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
    phone: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    mpin: { type: String, required: true },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    blockedAt: { type: Number, default: 0 },
    lastActiveAt: { type: Number, default: 0 }
});
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

// Login Log Schema
const LoginLogSchema = new mongoose.Schema({
    phone: { type: String, required: true },
    name: { type: String, default: 'Unknown' },
    timestamp: { type: Number, default: Date.now },
    status: { type: String, required: true }, // 'success', 'failed (blocked)', 'failed (locked)', etc.
    ip: { type: String },
    userAgent: { type: String }
});
const LoginLogModel = mongoose.models.LoginLog || mongoose.model('LoginLog', LoginLogSchema);

// Helper function to log user auth events
async function logUserLogin(phone, name, status, req) {
    try {
        const logEntry = {
            phone,
            name: name || 'Unknown',
            timestamp: Date.now(),
            status,
            ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
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
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Multer Upload Setup
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// --------------------------------------------------------------------------
// API ENDPOINTS
// --------------------------------------------------------------------------

// 1. Upload Product Image
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded.' });
        }
        const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
        res.json({ fileUrl });
    } catch (err) {
        res.status(500).json({ error: 'Image upload failed.' });
    }
});

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
                offerNotification: settings.offerNotification || ''
            });
        } else {
            const settings = await readJson(settingsPath);
            const data = Array.isArray(settings) ? settings[0] : settings;
            res.json({
                whatsappNumber: data?.whatsappNumber || '919876543210',
                maintenanceMode: data?.maintenanceMode || false,
                maintenanceMessage: data?.maintenanceMessage || 'We are currently performing scheduled maintenance.',
                maintenanceExpiry: data?.maintenanceExpiry || 0,
                offerNotification: data?.offerNotification || ''
            });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings.' });
    }
});

// 3. Save Shop Settings
app.post('/api/settings', async (req, res) => {
    try {
        const { whatsappNumber, maintenanceMode, maintenanceMessage, maintenanceExpiry, offerNotification } = req.body;
        if (!whatsappNumber) {
            return res.status(400).json({ error: 'WhatsApp number is required.' });
        }
        if (useMongo) {
            const settings = await SettingsModel.findOneAndUpdate(
                { key: 'main' },
                {
                    whatsappNumber,
                    maintenanceMode: maintenanceMode !== undefined ? Boolean(maintenanceMode) : undefined,
                    maintenanceMessage: maintenanceMessage !== undefined ? maintenanceMessage : undefined,
                    maintenanceExpiry: maintenanceExpiry !== undefined ? Number(maintenanceExpiry) : undefined,
                    offerNotification: offerNotification !== undefined ? offerNotification : undefined
                },
                { new: true, upsert: true }
            );
            res.json({
                whatsappNumber: settings.whatsappNumber,
                maintenanceMode: settings.maintenanceMode,
                maintenanceMessage: settings.maintenanceMessage,
                maintenanceExpiry: settings.maintenanceExpiry,
                offerNotification: settings.offerNotification
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
            await writeJson(settingsPath, [data]);
            res.json({
                whatsappNumber: data.whatsappNumber,
                maintenanceMode: data.maintenanceMode || false,
                maintenanceMessage: data.maintenanceMessage || '',
                maintenanceExpiry: data.maintenanceExpiry || 0,
                offerNotification: data.offerNotification || ''
            });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to save settings.' });
    }
});

// 4. Fetch Products List
app.get('/api/products', async (req, res) => {
    try {
        if (useMongo) {
            const products = await ProductModel.find().sort({ id: 1 });
            res.json(products);
        } else {
            const products = await readJson(productsPath);
            res.json(products);
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products.' });
    }
});

// 5. Add New Product
app.post('/api/products', async (req, res) => {
    try {
        const { title, category, price, originalPrice, image, description, sizes, tags, stock, inStock } = req.body;

        // Input validation
        if (!title || !category || !price) {
            return res.status(400).json({ error: 'Title, category, and price are required.' });
        }

        let productsList = [];
        if (useMongo) {
            const lastProduct = await ProductModel.findOne().sort({ id: -1 });
            const nextId = lastProduct ? lastProduct.id + 1 : 1;

            const newProduct = new ProductModel({
                id: nextId,
                title,
                category,
                price: Number(price),
                originalPrice: originalPrice ? Number(originalPrice) : undefined,
                image: image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
                description: description || '',
                sizes: Array.isArray(sizes) ? sizes : ['M', 'L', 'XL'],
                tags: Array.isArray(tags) ? tags : [],
                stock: stock !== undefined ? Number(stock) : 50,
                inStock: inStock !== undefined ? Boolean(inStock) : true,
                rating: 5.0,
                reviews: 0
            });
            await newProduct.save();
            res.status(201).json(newProduct);
        } else {
            productsList = await readJson(productsPath);
            const nextId = productsList.reduce((max, p) => p.id > max ? p.id : max, 0) + 1;

            const newProduct = {
                id: nextId,
                title,
                category,
                price: Number(price),
                originalPrice: originalPrice ? Number(originalPrice) : undefined,
                image: image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
                description: description || '',
                sizes: Array.isArray(sizes) ? sizes : ['M', 'L', 'XL'],
                tags: Array.isArray(tags) ? tags : [],
                stock: stock !== undefined ? Number(stock) : 50,
                inStock: inStock !== undefined ? Boolean(inStock) : true,
                rating: 5.0,
                reviews: 0
            };
            productsList.push(newProduct);
            await writeJson(productsPath, productsList);
            res.status(201).json(newProduct);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add product.' });
    }
});

// 6. Edit Existing Product
app.put('/api/products/:id', async (req, res) => {
    try {
        const prodId = parseInt(req.params.id);
        const { title, category, price, originalPrice, image, description, sizes, tags, stock, inStock } = req.body;

        if (useMongo) {
            const updatedProduct = await ProductModel.findOneAndUpdate(
                { id: prodId },
                {
                    title,
                    category,
                    price: Number(price),
                    originalPrice: originalPrice ? Number(originalPrice) : undefined,
                    image,
                    description,
                    sizes,
                    tags,
                    stock: stock !== undefined ? Number(stock) : 50,
                    inStock: inStock !== undefined ? Boolean(inStock) : true
                },
                { new: true }
            );

            if (!updatedProduct) {
                return res.status(404).json({ error: 'Product not found.' });
            }
            res.json(updatedProduct);
        } else {
            const productsList = await readJson(productsPath);
            const index = productsList.findIndex(p => p.id === prodId);

            if (index === -1) {
                return res.status(404).json({ error: 'Product not found.' });
            }

            productsList[index] = {
                ...productsList[index],
                title,
                category,
                price: Number(price),
                originalPrice: originalPrice ? Number(originalPrice) : undefined,
                image,
                description,
                sizes,
                tags,
                stock: stock !== undefined ? Number(stock) : 50,
                inStock: inStock !== undefined ? Boolean(inStock) : true
            };

            await writeJson(productsPath, productsList);
            res.json(productsList[index]);
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to update product.' });
    }
});

// 7. Delete Product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const prodId = parseInt(req.params.id);

        if (useMongo) {
            const deleted = await ProductModel.findOneAndDelete({ id: prodId });
            if (!deleted) return res.status(404).json({ error: 'Product not found.' });
            res.json({ message: 'Product deleted successfully.' });
        } else {
            const productsList = await readJson(productsPath);
            const filtered = productsList.filter(p => p.id !== prodId);

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

// 8. Fetch Booking Log History
app.get('/api/bookings', async (req, res) => {
    try {
        if (useMongo) {
            const bookings = await BookingModel.find().sort({ _id: -1 });
            res.json(bookings);
        } else {
            const bookings = await readJson(bookingsPath);
            res.json(bookings);
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
            const productRef = products.find(p => p.id === item.id);
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
                size: size,
                quantity: quantity,
                category: productRef.category
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

        const newBookingRecord = {
            orderId: orderId,
            date: dateString,
            customer: customer,
            items: validatedItems,
            subtotal: subtotal,
            delivery: delivery,
            total: total,
            status: 'Pending'
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
                const boughtItem = validatedItems.find(vi => vi.id === p.id);
                if (boughtItem) {
                    const newStock = Math.max(0, p.stock - boughtItem.quantity);
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
        const { status } = req.body;

        const validStatuses = ['Pending', 'Order Placed', 'Payment Confirmed', 'Dispatched', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid booking status value.' });
        }

        let targetBooking = null;

        if (useMongo) {
            targetBooking = await BookingModel.findOne({ orderId: ordId });
            if (!targetBooking) return res.status(404).json({ error: 'Booking not found.' });

            const oldStatus = targetBooking.status;
            targetBooking.status = status;
            await targetBooking.save();

            // If status changed TO Cancelled, restore product stocks
            if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
                for (const item of targetBooking.items) {
                    await ProductModel.findOneAndUpdate(
                        { id: item.id },
                        { $inc: { stock: item.quantity }, $set: { inStock: true } }
                    );
                }
            }
            // If status changed FROM Cancelled, decrement product stocks again
            else if (oldStatus === 'Cancelled' && status !== 'Cancelled') {
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

            res.json(targetBooking);
        } else {
            const bookingsList = await readJson(bookingsPath);
            const index = bookingsList.findIndex(b => b.orderId === ordId);

            if (index === -1) {
                return res.status(404).json({ error: 'Booking not found.' });
            }

            const oldStatus = bookingsList[index].status;
            bookingsList[index].status = status;
            await writeJson(bookingsPath, bookingsList);

            targetBooking = bookingsList[index];

            // Handle stock restoration on file database
            if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
                const productsList = await readJson(productsPath);
                const updated = productsList.map(p => {
                    const boughtItem = targetBooking.items.find(vi => vi.id === p.id);
                    if (boughtItem) {
                        return {
                            ...p,
                            stock: p.stock + boughtItem.quantity,
                            inStock: true
                        };
                    }
                    return p;
                });
                await writeJson(productsPath, updated);
            } else if (oldStatus === 'Cancelled' && status !== 'Cancelled') {
                const productsList = await readJson(productsPath);
                const updated = productsList.map(p => {
                    const boughtItem = targetBooking.items.find(vi => vi.id === p.id);
                    if (boughtItem) {
                        const newStock = Math.max(0, p.stock - boughtItem.quantity);
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

            res.json(targetBooking);
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

        if (booking.status.toLowerCase() !== 'pending') {
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
            booking.status = 'Cancelled';
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
                    return { ...b, status: 'Cancelled' };
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

// --------------------------------------------------------------------------
// USER-SPECIFIC BOOKINGS ENDPOINT
// --------------------------------------------------------------------------
app.get('/api/bookings/user/:phone', async (req, res) => {
    try {
        const phone = req.params.phone;
        if (useMongo) {
            const bookings = await BookingModel.find({ 'customer.phone': phone }).sort({ _id: -1 });
            res.json(bookings);
        } else {
            const bookings = await readJson(bookingsPath);
            const filtered = bookings.filter(b => b.customer.phone === phone);
            res.json(filtered);
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
            res.json({ success: true, sessionToken, message: 'Logged in successfully.' });
        } else {
            res.status(401).json({ error: 'Invalid admin credentials' });
        }
    } catch (err) {
        console.error(err);
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
            res.json({ success: true, sessionToken, message: 'Logged in successfully.' });
        } else {
            res.status(401).json({ error: 'Invalid developer credentials' });
        }
    } catch (err) {
        console.error(err);
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

