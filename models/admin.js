const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    // Link to the master account credentials row inside 'users'
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    adminName: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);