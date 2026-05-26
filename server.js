const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose'); 
const hostRoutes = require('./routes/hostRoutes');
const authRoutes = require("./routes/auth"); // Using this variable cleanly now!

// 1. LOAD DOTENV FIRST
dotenv.config(); 

console.log("Checking MONGO_URI:", process.env.MONGO_URI ? "Found! ✅" : "Not Found! ❌");

const connectDB = require('./config/db');
const app = express();

// 2. CONNECT TO DATABASE
connectDB();

// =========================================================
// NEW: FORCE MONGOOSE TO ALIGN SCHEMA AND INDEX LAYOUTS
// =========================================================
const Host = require('./models/host');
mongoose.connection.once('open', async () => {
    try {
        // This drops broken ghost indexes in Atlas making fields vanish
        await Host.syncIndexes();
        console.log("🎯 MongoDB Host Collection Indexes Synchronized Perfectly!");
    } catch (err) {
        console.error("⚠️ Index Sync Warning:", err.message);
    }
});

// 3. MIDDLEWARE
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 4. API ROUTES (Ensure there is only one declaration per route!)
app.use('/api/auth', authRoutes); 
app.use('/api/listings', require('./routes/listings'));
app.use('/api/bookings', require('./routes/bookings')); // This maps to routes/bookings.js
app.use('/api/host', hostRoutes);
app.use("/api/users", require("./routes/users"));

// 5. FRONTEND ROUTING
app.get('/guest', (req, res) => res.sendFile(path.join(__dirname, 'public', 'guest.html')));
app.get('/host', (req, res) => res.sendFile(path.join(__dirname, 'public', 'host.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/manageListings.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'manageListings.html')));

// 6. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server spinning at http://localhost:${PORT}`);
});