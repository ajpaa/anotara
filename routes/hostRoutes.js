// routes/hostRoutes.js
const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');
const Host = require('../models/host');

// =====================================================================
// ENDPOINT 1: FETCH ONLY PROPERTIES OWNED BY A SPECIFIC HOST OBJECTID
// URL: GET /api/host/listings/my-listings
// =====================================================================
router.get('/my-listings', async (req, res) => {
    try {
        const authHostId = req.headers['x-host-profile-id'] || req.query.hostProfileId;

        if (!authHostId) {
            return res.status(400).json({ 
                error: "Identification missing. Please provide a valid hostProfileId context pointer." 
            });
        }

        const listings = await Listing.find({ host: authHostId });
        res.status(200).json(listings);

    } catch (err) {
        console.error("💥 Portfolio Query Fault:", err.message);
        res.status(500).json({ error: "Failed to isolate host listing data: " + err.message });
    }
});

// =====================================================================
// ENDPOINT 2: CREATE A NEW PROPERTY
// URL: POST /api/host/listings/create
// =====================================================================
router.post('/listings/create', async (req, res) => {
    try {
        const currentHostId = req.body.host;

        if (!currentHostId || currentHostId.trim() === "") {
            return res.status(400).json({ error: "Cannot create listing. hostProfileId is missing." });
        }

        const newListing = new Listing({
            name: req.body.name || "Unnamed Accommodation",
            price: Number(req.body.price) || 0,
            type: req.body.type || "Property",
            description: req.body.description || "",
            locationID: req.body.locationID || "Not Specified",
            contact: req.body.contact, // FIXED: Now passing frontend contact value to Mongoose Schema
            host: currentHostId, 
            image: req.body.image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'
        });

        const savedItem = await newListing.save();
        res.status(201).json(savedItem);
    } catch (err) {
        console.error("💥 MONGO CREATION REJECTED:", err.message);
        res.status(400).json({ error: "Database rejected creation instance: " + err.message });
    }
});

// =====================================================================
// ENDPOINT 3: UPDATE ACCOMMODATION DATA BY _ID
// URL: PUT /api/host/listings/edit/:id
// =====================================================================
router.put('/listings/edit/:id', async (req, res) => {
    try {
        const currentHostId = req.body.host;

        if (!currentHostId) {
            return res.status(400).json({ error: "Modification rejected. hostProfileId parameter required." });
        }

        const updatePayload = {
            name: req.body.name,          
            price: Number(req.body.price), 
            locationID: req.body.locationID,    
            type: req.body.type,
            image: req.body.image, 
            description: req.body.description,
            contact: req.body.contact, // FIXED: Mapping modifications during updates
            host: currentHostId 
        };

        const updatedItem = await Listing.findByIdAndUpdate(
            req.params.id,
            { $set: updatePayload }, 
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ error: "Property entry record not located." });
        }

        console.log("✅ Property successfully updated in Atlas:", updatedItem._id);
        res.status(200).json(updatedItem);

    } catch (err) {
        console.error("💥 MONGO UPDATE REJECTED:", err.message);
        res.status(400).json({ error: "Database update verification failure: " + err.message });
    }
});

// =====================================================================
// ENDPOINT 4: PURGE REGISTRY
// URL: DELETE /api/host/listings/delete/:id
// =====================================================================
router.delete('/listings/delete/:id', async (req, res) => {
    try {
        const wipedItem = await Listing.findByIdAndDelete(req.params.id);
        if (!wipedItem) return res.status(404).json({ error: "Listing target missing matching keys." });
        res.status(200).json({ message: "Purged successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;