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
router.post('/', async (req, res) => {
    try {
        const { listingId, guestId, guestName, startDate, endDate } = req.body;
        
        // 1. Convert incoming date strings into formal JavaScript Date objects
        const newStart = new Date(startDate);
        const newEnd = new Date(endDate);

        // Validation: Ensure checkout date is after check-in date
        if (newStart >= newEnd) {
            return res.status(400).json({ message: "Invalid Date Range: End date must be after start date." });
        }

        // 2. Query Atlas for ANY already 'approved' bookings overlapping this time window
        const conflictingBooking = await Booking.findOne({
            listingId: listingId,
            status: 'approved',
            startDate: { $lt: newEnd },
            endDate: { $gt: newStart }
        });

        if (conflictingBooking) {
            return res.status(400).json({ 
                message: "Dates Unavailable: This accommodation is already booked and approved during your selected timeline." 
            });
        }

        // 3. No conflict found, safe to save pending record
        const newBooking = new Booking({
            listingId,
            guestId,      
            guestName,
            startDate: newStart,
            endDate: newEnd,
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
    
            let bookingRefString = "";
            if (booking.listingId) {
                bookingRefString = booking.listingId.toString();
            } else if (booking.listingID) {
                bookingRefString = booking.listingID.toString();
            }

            const matchingListing = hostListings.find(list => {
                const listIdString = list._id ? list._id.toString() : "";
                return listIdString === bookingRefString;
            });

            return {
                _id: booking._id.toString(),
                status: booking.status || 'pending',
                guestId: booking.guestId ? booking.guestId.toString() : 'Anonymous ID',
                guestName: booking.guestName || 'Anonymous Guest', 
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
        const bookings = await Booking.find({ guestId: req.params.guestId })
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
        const bookingId = req.params.id;
        const { status } = req.body; 

        if (status === 'approved') {
            const currentBooking = await Booking.findById(bookingId);
            if (!currentBooking) {
                return res.status(404).json({ error: "Booking record not found." });
            }

            const overlapConflict = await Booking.findOne({
                listingId: currentBooking.listingId,
                status: 'approved',
                _id: { $ne: bookingId }, // Do not check the booking against itself
                startDate: { $lt: currentBooking.endDate },
                endDate: { $gt: currentBooking.startDate }
            });

            if (overlapConflict) {
                return res.status(400).json({ 
                    error: "Another reservation has already been approved for these dates." 
                });
            }
        }

        // Perform status update and use future-proof modern syntax option
        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            { status: status }, 
            { returnDocument: 'after' } 
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