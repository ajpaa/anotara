const mongoose = require('mongoose');

// 1. Define the Schema (the structural blueprint of your document)
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        default: 'guest'
    }
}, { 
    // CRITICAL: Forces Mongoose to talk directly to your existing 
    // collection in MongoDB Atlas, preventing it from making a new one.
    collection: 'users' 
});

// 2. Compile the Schema into a Model and export it
const User = mongoose.model('User', userSchema);
module.exports = User;