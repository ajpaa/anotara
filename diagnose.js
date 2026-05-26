

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Host = require('./models/host');

async function diagnose() {
    console.log("\n🔍 Connecting to Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected!\n");

    // Step 1: Find the user
    const user = await User.findOne({ username: 'host20' });
    console.log("👤 USER DOCUMENT:");
    console.log(user);

    if (!user) {
        console.log("❌ PROBLEM: No user named 'host20' exists in the users collection!");
        process.exit();
    }

    // Step 2: Find matching host profile
    const host = await Host.findOne({ user: user._id });
    console.log("\n🏠 HOST PROFILE DOCUMENT:");
    console.log(host);

    if (!host) {
        console.log("❌ PROBLEM: No Host profile linked to this user _id!");
        console.log("👉 FIX: A Host document needs to be created for this user.");
    } else {
        console.log("\n✅ Both documents exist. Login route must not be attaching hostProfileId.");
        console.log("👉 FIX: Replace your auth.js login route with the version from the previous message.");
    }

    await mongoose.disconnect();
}

diagnose();