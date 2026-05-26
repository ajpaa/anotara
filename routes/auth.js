// routes/auth.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Models
const User = require('../models/user');   
const Host = require('../models/host');   
const Admin = require('../models/admin'); 

// ==========================================
// 1. SIGNUP ROUTE
// ==========================================
router.post('/signup', async (req, res) => {
    const { username, password, role } = req.body;
    
    try {
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        user = new User({ username, password, role });
        await user.save();

        if (user.role === 'admin') {
            await Admin.create({
                user: user._id,
                adminName: user.username
            });
            console.log(`✅ Admin profile initialized for: ${username}`);
        }

        if (user.role === 'host') {
            const primaryAdmin = await Admin.findOne();
            
            // Build explicit structural instance 
            const newHost = new Host({
                user: user._id,
                hostName: user.username,
                hostContactNumber: "Not Provided",
                adminID: primaryAdmin ? primaryAdmin._id : null
            });

            await newHost.save();
            console.log(`✅ Host profile created successfully with user linkage.`);
        }

        let signupPayload = {
            _id: user._id,
            username: user.username,
            role: user.role
        };

        if (user.role === 'host') {
            const hostProfile = await Host.findOne({ user: user._id });
            if (hostProfile) {
                signupPayload.hostProfileId = hostProfile._id;
            }
        }

        res.status(201).json(signupPayload);

    } catch (err) {
        console.error("Signup Crash Error Log:", err);
        res.status(500).json({ message: "Signup process failed: " + err.message });
    }
});

// ==========================================
// 2. LOGIN ROUTE
// ==========================================
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ message: "No account found. Please check credentials or sign up!" });
        }

        let responsePayload = {
            _id: user._id,
            username: user.username,
            role: user.role
        };

        if (user.role === 'host') {
            const hostProfile = await Host.findOne({ user: user._id });
            if (hostProfile) {
                responsePayload.hostProfileId = hostProfile._id;
            }
        }

        res.status(200).json(responsePayload);

    } catch (err) {
        res.status(500).json({ message: "Server encountered a breakdown during login: " + err.message });
    }
});

module.exports = router;