// routes/hostRoutes.js
const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');

// =====================================================================
// ENDPOINT 1: FETCH ONLY PROPERTIES OWNED BY A SPECIFIC HOST OBJECTID
// URL: GET /api/host/listings/my-listings
// =====================================================================
router.get('/listings/my-listings', async (req, res) => {
    try {
        const DEV_HOST_ID = "65f1a2b3c4d5e6f7a8b9c002"; 
        const myProperties = await Listing.find({ host: DEV_HOST_ID });
        res.status(200).json(myProperties);
    } catch (err) {
        res.status(500).json({ error: "Failed to gather host listings: " + err.message });
    }
});

// =====================================================================
// ENDPOINT 2: CREATE A NEW PROPERTY
// URL: POST /api/host/listings/create
// =====================================================================
router.post('/listings/create', async (req, res) => {
    try {
        const VALID_DEV_HOST_ID = "65f1a2b3c4d5e6f7a8b9c002";

        const newListing = new Listing({
            name: req.body.name || "Unnamed Accommodation",
            price: Number(req.body.price) || 0,
            type: req.body.type || "Property",
            description: req.body.description || "",
            locationID: req.body.locationID || "Not Specified",
            host: (req.body.host && req.body.host.trim() !== "") ? req.body.host : VALID_DEV_HOST_ID, 
            
            // FIXED: Now reads the image field sent from the frontend form
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
        const DEV_HOST_ID = "65f1a2b3c4d5e6f7a8b9c002"; 

        const updatePayload = {
            name: req.body.name,         
            price: Number(req.body.price), 
            locationID: req.body.locationID,    
            type: req.body.type,
            image: req.body.image, // FIXED: Added this line to include image tracking inside updates
            description: req.body.description,
            host: DEV_HOST_ID 
        };

        const updatedItem = await Listing.findByIdAndUpdate(
            req.params.id,
            { $set: updatePayload }, 
            { new: true, runValidators: false }
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