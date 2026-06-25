import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const productsPath = path.join(__dirname, 'data', 'products.json');
const bookingsPath = path.join(__dirname, 'data', 'bookings.json');
const settingsPath = path.join(__dirname, 'data', 'settings.json');

// Ensure data folder exists
async function initDataFolder() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        await fs.mkdir(path.join(__dirname, 'public', 'uploads'), { recursive: true });
    } catch {}
}
await initDataFolder();

// Read/Write JSON Helpers
async function readJson(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
        return [];
    }
}

async function writeJson(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// --------------------------------------------------------------------------
// MONGODB CONNECTION & SCHEMAS
// --------------------------------------------------------------------------
let useMongo = false;
try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/netravestore';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[Netrave Backend] Connected to MongoDB at ${mongoUri}`);
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
    key: { type: String, default: 'main', unique: true },
    whatsappNumber: { type: String, default: '919946550713' }
});
const SettingsModel = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

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
            await SettingsModel.create({ key: 'main', whatsappNumber: fileSettings.whatsappNumber || '919946550713' });
            console.log('[Netrave Backend] Seeded MongoDB settings collection');
        }
    } catch (err) {
        console.error('[Netrave Backend] Seeding error:', err.message);
    }
}

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
                settings = await SettingsModel.create({ key: 'main', whatsappNumber: '919876543210' });
            }
            res.json(settings);
        } else {
            const settings = await readJson(settingsPath);
            res.json(settings || { whatsappNumber: '919876543210' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings.' });
    }
});

// 3. Save Shop Settings
app.post('/api/settings', async (req, res) => {
    try {
        const { whatsappNumber } = req.body;
        if (!whatsappNumber) {
            return res.status(400).json({ error: 'WhatsApp number is required.' });
        }
        if (useMongo) {
            const settings = await SettingsModel.findOneAndUpdate(
                { key: 'main' },
                { whatsappNumber },
                { new: true, upsert: true }
            );
            res.json(settings);
        } else {
            const settings = { whatsappNumber };
            await writeJson(settingsPath, settings);
            res.json(settings);
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

        const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Delivered'];
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

// Start Server
app.listen(PORT, () => {
    console.log(`[Netrave Backend] Server running on http://localhost:${PORT}`);
});

