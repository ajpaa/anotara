const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose'); 
const hostRoutes = require('./routes/hostRoutes');
const authRoutes = require("./routes/auth");

// 1. LOAD DOTENV FIRST
// This ensures process.env.MONGO_URI is available to the rest of the app
dotenv.config(); 

// Debugging line (You can remove this once it works)
console.log("Checking MONGO_URI:", process.env.MONGO_URI ? "Found! ✅" : "Not Found! ❌");

const connectDB = require('./config/db');
const app = express();

// 2. CONNECT TO DATABASE
connectDB();

// 3. MIDDLEWARE
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 4. API ROUTES
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/host', require('./routes/hostRoutes'));
app.use("/api/users", require("./routes/users"));

// 5. FRONTEND ROUTING (Redirects users to specific pages)
app.get('/guest', (req, res) => res.sendFile(path.join(__dirname, 'public', 'guest.html')));
app.get('/host', (req, res) => res.sendFile(path.join(__dirname, 'public', 'host.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/manageListings.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'manageListings.html')));

// 6. START SERVER
const PORT = process.env.PORT || 5000;
app.get('/test', (req, res) => {
    res.send('<h1>The Server is definitely working!</h1>');
});

// Add this in server.js before app.listen()
app.use((err, req, res, next) => {
    console.error("💥 SERVER CRASH:", err.stack);
    res.status(500).json({ message: err.message });
});
app.listen(PORT, () => {
    console.log(`🚀 Server spinning at http://localhost:${PORT}`);
});


