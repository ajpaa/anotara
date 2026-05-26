const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    type: { type: String, required: true },
    description: { type: String },
    image: { type: String },

    contact: { 
        type: String, 
        required: true // Changed to true since your HTML form marks it as 'required'
    },
    
    // NATIVE OBJECTID REFERENCES
    locationID: { 
      type: String,
      required: true
    },

    host: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Host', // References the 'Host' model export name
        required: true 
    },
    adminID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' // Assuming admins live inside your User model
    }
}, { timestamps: true });

module.exports = mongoose.models.Listing || mongoose.model('Listing', listingSchema);