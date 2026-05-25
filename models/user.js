const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['guest', 'host', 'admin'], default: 'guest' },
  contactInfo: String,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }]
});
module.exports = mongoose.model('User', UserSchema);