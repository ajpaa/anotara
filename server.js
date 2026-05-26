const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose'); 
const session = require('express-session'); 

// Models
const User = require('./models/user');
const Host = require('./models/host');

// Route Requirements
const hostRoutes = require('./routes/hostRoutes');
const authRoutes = require("./routes/auth");

// 1. LOAD DOTENV FIRST
dotenv.config(); 

console.log("Checking MONGO_URI:", process.env.MONGO_URI ? "Found! ✅" : "Not Found! ❌");

const connectDB = require('./config/db');
const app = express();

// 2. CONNECT TO DATABASE
connectDB();

// =========================================================
// FORCE MONGOOSE TO ALIGN SCHEMA AND INDEX LAYOUTS
// =========================================================
mongoose.connection.once('open', async () => {
    try {
        await Host.syncIndexes();
        console.log("🎯 MongoDB Host Collection Indexes Synchronized Perfectly!");
    } catch (err) {
        console.error("⚠️ Index Sync Warning:", err.message);
    }
});

// ==========================================
// 3. CORE PARSING MIDDLEWARES
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 4. INITIALIZE EXPRESS SESSION
// ==========================================
app.use(session({
    secret: 'cmsc121_secret_key_airbnb', 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Must remain false on localhost environments (Non-HTTPS)
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 Day lifespan
    }
}));

// ==========================================
// SECURITY MIDDLEWARE FUNCTIONS
// ==========================================
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next(); 
    }
    // Clear redirect to point users straight to /index route
    res.redirect("/index");
}

function hasRole(role) {
    return (req, res, next) => {
        if (req.session && req.session.user && req.session.user.role === role) {
            return next(); 
        }
        
        res.status(403).send(`
            <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
                <h1 style="color: red;">403 Access Forbidden</h1>
                <p>This area is exclusively reserved for authorized ${role} accounts.</p>
                <a href="/index">Click here to sign in with a different account</a>
            </div>
        `);
    };
}

// ==========================================
// 5. BACKEND API ROUTING 
// ==========================================
app.use('/api/auth', authRoutes); 
app.use('/api/listings', require('./routes/listings'));
app.use('/api/bookings', require('./routes/bookings')); 
app.use('/api/host', hostRoutes);
app.use("/api/users", require("./routes/users"));

// 🎯 NEW: SYSTEM EXPLICIT SESSION TERMINATION ROUTE
app.get('/api/auth/logout', (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ message: "Logout failed" });
            }
            res.clearCookie('connect.sid'); // Erase cookie from browser history
            res.redirect('/index'); 
        });
    } else {
        res.redirect('/index');
    }
});

app.get('/api/guest/profile', async (req, res, next) => {
    try {
        const userId = req.session?.user?._id || req.user?._id;

        if (!userId) {
            console.log("No User ID found in session!");
            return res.status(401).json({ error: "Unauthorized. No session found." });
        }

        const guestData = await User.findById(userId).select('username');
        console.log("Database Lookup Result:", guestData);

        res.json(guestData);
    } catch (err) {
        next(err);
    }
});

// ==========================================
// 6. PROTECTED FRONTEND PAGE GATEWAYS
// ==========================================

// Open Public Landing/Auth Endpoint Alias
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Protected Host pages gateway grouping
const hostPages = ['/host', '/host-profile', '/manageListings'];
app.get(hostPages, isAuthenticated, hasRole('host'), (req, res) => {
    const targetFile = req.path.substring(1); 
    res.sendFile(path.join(__dirname, 'public', `${targetFile}.html`));
});

// Protected Guest pages gateway grouping
const guestPages = ['/guest', '/favorites', '/profile', '/listing-details'];
app.get(guestPages, isAuthenticated, hasRole('guest'), (req, res) => {
    const targetFile = req.path.substring(1);
    res.sendFile(path.join(__dirname, 'public', `${targetFile}.html`));
});

// ==========================================
// PROTECTED ADMIN PAGES GATEWAY GROUPING (Handles both URL styles)
// ==========================================
// ==========================================
// PROTECTED ADMIN PAGES GATEWAY GROUPING (Bulletproof)
// ==========================================
const adminPages = [
    '/admin', 
    '/admin/',                  // 🎯 Handles trailing slashes
    '/admin-listings.html', 
    '/admin-bookings.html', 
    '/admin-users.html',
    '/admin/admin-listings.html', 
    '/admin/admin-bookings.html',
    '/admin/admin-users.html'
];

app.get(adminPages, isAuthenticated, hasRole('admin'), (req, res) => {
    // 🛠️ Remove any trailing slashes so path.basename doesn't break
    let cleanPath = req.path.endsWith('/') ? req.path.slice(0, -1) : req.path;
    
    let targetFile = path.basename(cleanPath); 
    
    // // If the request evaluates to empty or just "admin", default to "admin.html"
    // if (!targetFile || targetFile === 'admin') {
    //     targetFile = 'admin.html';
    // }
    
    // Serves the files directly out of your public/admin/ folder structure
    res.sendFile(path.join(__dirname, 'public', 'admin', targetFile));
});
// ==========================================
// 7. PUBLIC STATIC FILE HIGHWAY (MUST BE AFTER PROTECTED ROUTES)
// ==========================================
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 8. UTILITY AND SYSTEM ERROR HANDLING
// ==========================================
app.get('/test', (req, res) => {
    res.send('<h1>The Server is definitely working!</h1>');
});

app.use((err, req, res, next) => {
    console.error("💥 SERVER CRASH:", err.stack);
    res.status(500).json({ message: err.message });
});

// START ENGINE
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server spinning at http://localhost:${PORT}`);
});
