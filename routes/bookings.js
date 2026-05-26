const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Listing = require('../models/listing'); // Make sure your filename casing matches your file system!
const mongoose = require('mongoose'); 
// ==========================================
// 1. READ: Get All Bookings (Root Utility)
// ==========================================
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find().populate("listingId", "name");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. CREATE: Guest submits a booking request
// ==========================================
// ==========================================
// 2. CREATE: Guest submits a booking request
// ==========================================
router.post('/', async (req, res) => {
    try {
        // FIX: Extract guestId from the request body instead of guest
        const { listingId, guestId, guestName, startDate, endDate } = req.body;
        
        const newBooking = new Booking({
            listingId,
            guestId,      // FIX: Map it explicitly to match your Mongoose schema property
            guestName,
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

// ==========================================
// 3. READ: Get Bookings for a Specific Host
// ==========================================
// routes/bookings.js
// Ensure mongoose is imported at the top!

// routes/bookings.js

router.get('/host/:hostID', async (req, res) => {
    try {
        const hostIdString = req.params.hostID;
        let hostObjectId = new mongoose.Types.ObjectId(hostIdString);

        // 1. Fetch listings owned by this host
        const hostListings = await Listing.find({ host: hostObjectId }).lean();
        
        // Convert all host listing IDs to pure strings safely
        const listingIdsStrings = hostListings.map(item => item._id.toString());

        // 2. Fetch all bookings matching these listing ID strings
        const incomingBookings = await Booking.find({ listingId: { $in: listingIdsStrings } })
            .sort({ createdAt: -1 })
            .lean(); 

        // 3. Merge data using uniform string values
        const formattedResponse = incomingBookings.map(booking => {
            
            // Extract the listing reference from the booking row safely
            let bookingRefString = "";
            if (booking.listingId) {
                bookingRefString = booking.listingId.toString();
            } else if (booking.listingID) {
                bookingRefString = booking.listingID.toString();
            }

            // FORCE BOTH TO STRINGS TO GUARANTEE TRUTHY MATCHING
            const matchingListing = hostListings.find(list => {
                const listIdString = list._id ? list._id.toString() : "";
                return listIdString === bookingRefString;
            });

            

            return {
                _id: booking._id.toString(),
                status: booking.status || 'pending',
                guestId: booking.guestId ? booking.guestId.toString() : 'Anonymous Guest',
                startDate: booking.startDate,
                endDate: booking.endDate,
                rawListingId: bookingRefString,
                listingDetails: matchingListing ? {
                    name: matchingListing.name,
                    price: matchingListing.price,
                    type: matchingListing.type || "Accommodation",
                    image: matchingListing.image || ""
                } : null
            };
        });

        return res.status(200).json(formattedResponse);

    } catch (err) {
        return res.status(500).json({ error: "Data link broken: " + err.message });
    }
});
// ==========================================
// 4. READ: Get Bookings for a Specific Guest
// ==========================================
router.get('/guest/:guestId', async (req, res) => {
    try {
        const bookings = await Booking.find({ guest: req.params.guestId })
            .populate('listingId'); 
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 5. READ: Get Bookings for a Specific Listing
// ==========================================
router.get('/listing/:listingId', async (req, res) => {
    try {
        const bookings = await Booking.find({ listingId: req.params.listingId });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 6. UPDATE: Host Approves or Rejects a Booking
// ==========================================
router.put('/:id', async (req, res) => {
    try {
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status }, // Receives either 'approved' or 'rejected'
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