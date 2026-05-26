// routes/auth.js
const express = require('express');
const router = express.Router();

// Models - Verified with your project file structure
const User = require('../models/user');   
const Host = require('../models/host');   
const Admin = require('../models/admin'); 

// ==========================================
// 1. SIGNUP ROUTE
// ==========================================
router.post('/signup', async (req, res) => {
    const { username, password, role } = req.body;
    
    try {
        // Prevent duplicate accounts
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create and save the base user profile
        user = new User({ username, password, role });
        await user.save();

        // Admin-Specific Initialization
        if (user.role === 'admin') {
            await Admin.create({
                user: user._id,
                adminName: user.username
            });
            console.log(`✅ Admin collection profile initialized for: ${username}`);
        }

        // Host-Specific Initialization
        if (user.role === 'host') {
            // Find an admin if one exists, but don't fail if the system has no admin yet
            const primaryAdmin = await Admin.findOne();
            
            await Host.create({
                user: user._id,
                hostName: user.username,
                hostContactNumber: "Not Provided",
                adminID: primaryAdmin ? primaryAdmin._id : null // Safe fallback assignment
            });
            console.log(`✅ Host collection profile initialized for: ${username}`);
        }

        // Send back a clean success response
        res.status(201).json({
            message: "Registration successful!",
            userId: user._id,
            role: user.role
        });

    } catch (err) {
        res.status(500).json({ message: "Signup process failed: " + err.message });
    }
});

// ==========================================
// 2. LOGIN ROUTE
// ==========================================
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Validate credentials against the database
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ message: "No account found. Please check credentials or sign up!" });
        }

        // Establish the core session payload
        let responsePayload = {
            _id: user._id,
            username: user.username,
            role: user.role
        };

        // If the logging-in user is a host, attach their profile ID for easy front-end management
        if (user.role === 'host') {
            const hostProfile = await Host.findOne({ user: user._id });
            if (hostProfile) {
                responsePayload.hostProfileId = hostProfile._id;
            }
        }

        // Return token/payload to browser localstorage handler
        res.status(200).json(responsePayload);

    } catch (err) {
        res.status(500).json({ message: "Server encountered a breakdown during login: " + err.message });
    }
});

module.exports = router;