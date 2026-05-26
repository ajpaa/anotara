const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const Booking = require('../models/booking');
// ==========================================
// 1. GET ALL LISTINGS (For Guest Dashboard)
// ==========================================
router.get('/', async (req, res) => {
    try {
        // 🛠️ FIXED: Added locationID to the extracted query variables
        const { search, type, sort, maxPrice, locationID, start, end } = req.query;
        let query = {};

        // Use 'name' instead of 'title' to match your Atlas data structure
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        // Use 'type' to match your schema's category field
        if (type) {
            query.type = type;
        }

        // 🛠️ FIXED: Location Filter (Case-Insensitive & Partial Matching)
        if (locationID) {
            query.locationID = { $regex: locationID, $options: 'i' };
        }

        if (start && end) {
            const checkIn = new Date(start);
            const checkOut = new Date(end);
        
            const busyBookings = await Booking.find({
                $and: [
                    { startDate: { $lt: checkOut } },
                    { endDate: { $gt: checkIn } }
                ]
            }).select('listingId');

            const busyListingIds = busyBookings.map(b => b.listingId);
            query._id = { $nin: busyListingIds };
        }

        let listingsQuery = Listing.find(query);
        // Filter by Price if requested
        if (maxPrice) {
            query.price = { $lte: Number(maxPrice) };
        }

        // Sorting Logic
        if (sort === 'price_asc') {
            listingsQuery.sort({ price: 1 });
        } else if (sort === 'price_desc') {
            listingsQuery.sort({ price: -1 });
        } else {
            listingsQuery.sort({ createdAt: -1 }); // Default to newest first
        }

        const listings = await listingsQuery;
        res.json(listings);
    } catch (err) {
        console.error("Database Query Error:", err);
        res.status(500).json({ error: "Failed to fetch listings from cluster." });
    }
});

// ==========================================
// 2. GET SINGLE LISTING BY ID
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ error: "Listing not found" });
        res.json(listing);
    } catch (err) {
        res.status(500).json({ error: "Invalid ID format or server error." });
    }
});

// ==========================================
// 3. CREATE LISTING (POST)
// ==========================================
router.post('/', async (req, res) => {
    try {
        const listing = new Listing(req.body);
        await listing.save();
        res.status(201).json(listing);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ==========================================
// 4. DELETE LISTING
// ==========================================
router.delete('/:id', async (req, res) => {
    try {
        const result = await Listing.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ error: "Listing already removed" });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Delete operation failed." });
    }
});

module.exports = router;