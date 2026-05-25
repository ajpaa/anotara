const mongoose = require('mongoose');
const BookingSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestName: String,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
});
module.exports = mongoose.model('Booking', BookingSchema);