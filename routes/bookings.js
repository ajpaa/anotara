const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Listing = require('../models/listing');

// 1. CREATE: Guest submits a booking request
router.post('/', async (req, res) => {
    try {
        // We use the keys sent from your details.js: listingId, guestId, startDate, endDate
        const { listingId, guestId, startDate, endDate } = req.body;
        
        const newBooking = new Booking({
            listingId,      // Ensure these match your Mongoose Schema
            guestId,
            startDate,
            endDate,
            status: 'pending'
        });

        const savedBooking = await newBooking.save();
        res.status(201).json(savedBooking);
    } catch (err) {
        console.error("Booking Creation Error:", err);
        res.status(400).json({ message: "Error creating booking", error: err.message });
    }
});

// 2. READ: Get ALL bookings (Admin or general)
router.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find().populate('listingId', 'name');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. READ: Get bookings for a specific Guest
router.get('/guest/:guestId', async (req, res) => {
    try {
        const bookings = await Booking.find({ guestId: req.params.guestId })
            .populate('listingId');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. READ: Get bookings for all listings owned by a specific Host
router.get('/host/:hostID', async (req, res) => {
    try {
        const hostListings = await Listing.find({ hostID: req.params.hostID });
        const listingIds = hostListings.map(item => item._id);

        const incomingBookings = await Booking.find({ listingId: { $in: listingIds } })
            .populate('listingId', 'name price locationID')
            .sort({ createdAt: -1 });

        res.status(200).json(incomingBookings);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch host bookings: " + err.message });
    }
});

// 5. UPDATE: Host approves or rejects a booking
router.put('/:id', async (req, res) => {
    try {
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        if (!updatedBooking) {
            return res.status(404).json({ error: "Booking not found." });
        }

        res.status(200).json(updatedBooking);
    } catch (err) {
        res.status(400).json({ error: "Failed to update status: " + err.message });
    }
});

module.exports = router;