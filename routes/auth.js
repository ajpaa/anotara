// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// SIGNUP ROUTE
router.post('/signup', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        // Check if user exists
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ message: "User already exists" });

        // Create new user
        user = new User({ username, password, role });
        await user.save();
        
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error during signup" });
    }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (!user) return res.status(404).json({ message: "No account found. Please sign up!" });
        
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error during login" });
    }
});

module.exports = router;