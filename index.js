const express = require('express');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
require('dotenv').config(); // For environment variables
const Item = require('./models/Items'); // MongoDB model

const app = express();
app.use(express.json()); // Middleware to parse JSON

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_db', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

// Firebase Admin SDK initialization
admin.initializeApp({
    credential: admin.credential.cert({
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Fix newline issue
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        project_id: process.env.FIREBASE_PROJECT_ID,
    }),
s});

const db = admin.firestore();
const collection = db.collection('products'); // Collection for products in Firebase

// MongoDB CRUD Operations

// 1. API: Get all items (MongoDB)
app.get('/items', async (req, res) => {
    try {
        const items = await Item.find();
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// 2. API: Get item by ID (MongoDB)
app.get('/items/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.status(200).json(item);
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid item ID format' });
        }
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// 3. API: Update item by ID (MongoDB)
app.put('/items/:id', async (req, res) => {
    try {
        const item = await Item.findByIdAndUpdate(req.params.id, req.body, { 
            new: true, 
            runValidators: true 
        });
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.status(200).json(item);
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid item ID format' });
        }
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// 4. API: Create a new item (MongoDB)
app.post('/items', async (req, res) => {
    try {
        const newItem = new Item(req.body);
        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// 5. API: Delete item by ID (MongoDB)
app.delete('/items/:id', async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid item ID format' });
        }
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Firebase CRUD Operations

// 1. Create a new product (Firebase)
app.post('/products', async (req, res) => {
    try {
        const product = req.body;
        const docRef = await collection.add(product);
        res.status(201).json({ id: docRef.id, message: 'Product created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating product: ' + error.message });
    }
});

// 2. Get all products (Firebase)
app.get('/products', async (req, res) => {
    try {
        const snapshot = await collection.get();
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products: ' + error.message });
    }
});

// 3. Get product by ID (Firebase)
app.get('/products/:id', async (req, res) => {
    try {
        const doc = await collection.doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product: ' + error.message });
    }
});

// 4. Update product by ID (Firebase)
app.put('/products/:id', async (req, res) => {
    try {
        const updatedProduct = req.body;
        await collection.doc(req.params.id).update(updatedProduct);
        res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating product: ' + error.message });
    }
});

// 5. Delete product by ID (Firebase)
app.delete('/products/:id', async (req, res) => {
    try {
        await collection.doc(req.params.id).delete();
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product: ' + error.message });
    }
});

// Server configuration
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
