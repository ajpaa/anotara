const mongoose = require('mongoose');

const hostSchema = new mongoose.Schema({
    hostName: { type: String, required: true },
    hostContactNumber: { type: String, required: true },
    adminID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
}, { timestamps: true });

module.exports = mongoose.model('Host', hostSchema);