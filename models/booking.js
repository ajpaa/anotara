const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    // FIXED: Changed 'listing' to 'listingId' to match your database column header
    listingId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Listing', 
        required: true 
    },
    // FIXED: Changed 'guest' to 'guestId' to match your database column header
    guestId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
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
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);