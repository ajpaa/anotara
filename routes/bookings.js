const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// 1. CREATE: Guest submits a booking request (POST)
router.post('/', async (req, res) => {
    try {
        const { listing, guest, guestName, startDate, endDate } = req.body;
        
        const newBooking = new Booking({
            listing,
            guest,
            guestName,
            startDate,
            endDate,
            status: 'pending' // Default status
        });

        const savedBooking = await newBooking.save();
        res.status(201).json(savedBooking);
    } catch (err) {
        res.status(400).json({ message: "Error creating booking", error: err.message });
    }
});

// 2. READ: Get bookings for a specific Guest (for their Profile Dashboard)
router.get('/guest/:guestId', async (req, res) => {
    try {
        const bookings = await Booking.find({ guest: req.params.guestId })
            .populate('listing'); // This pulls the Listing details (title, image) into the response
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. READ: Get bookings for a specific Listing (for the Host to see who booked)
router.get('/listing/:listingId', async (req, res) => {
    try {
        const bookings = await Booking.find({ listing: req.params.listingId });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. UPDATE: Host approves or rejects a booking (PUT)
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body; // status should be 'approved' or 'rejected'
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );
        res.json(updatedBooking);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;

const Listing = require('../models/listing'); // Required to look up listing owners

// ENDPOINT: GET ALL BOOKINGS FOR LISTINGS OWNED BY A SPECIFIC HOST
router.get('/host/:hostID', async (req, res) => {
    try {
        // 1. Find all listings belonging to this host
        const hostListings = await Listing.find({ hostID: req.params.hostID });
        const listingIds = hostListings.map(item => item._id);

        // 2. Find all bookings tied to those listing IDs and populate details
        const incomingBookings = await Booking.find({ listing: { $in: listingIds } })
            .populate('listing', 'name price locationID')
            .sort({ createdAt: -1 }); // Newest requests first

        res.status(200).json(incomingBookings);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch host bookings: " + err.message });
    }
});

// ENDPOINT: UPDATE A BOOKING STATUS (APPROVE / REJECT)
router.put('/:id', async (req, res) => {
    try {
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status }, // 'approved' or 'rejected'
            { new: true }
        );

        if (!updatedBooking) {
            return res.status(404).json({ error: "Booking session not found." });
        }

        res.status(200).json(updatedBooking);
    } catch (err) {
        res.status(400).json({ error: "Failed to update status: " + err.message });
    }
});

module.exports = router;