const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    listingId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Listing', 
        required: true 
    },
    guestId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // 🎯 NEW: Add this so Mongoose allows the name to save into Atlas!
    guestName: {
        type: String,
        required: true,
        default: 'Anonymous Guest'
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    endDate: { 
        type: Date, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    }
}, { timestamps: true }); 

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);