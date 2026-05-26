// models/host.js
const mongoose = require('mongoose');

const hostSchema = new mongoose.Schema({
    // 1. Put user at the top to force Atlas to render it first
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true 
    },
    hostName: { type: String, required: true },
    hostContactNumber: { type: String, required: true },
    adminID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Host', hostSchema);