require('dotenv').config();
const mongoose = require('mongoose');

console.log("MONGO_URI:", process.env.MONGO_URI ? "Found ✅" : "NOT FOUND ❌");

const User = require('./models/User');
const Host = require('./models/host');
const Admin = require('./models/admin');

async function fix() {
    try {
        console.log("Connecting to Atlas...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected!\n");

        const user = await User.findOne({ username: 'host20' });
        console.log("User found:", user);

        const admin = await Admin.findOne();
        console.log("Admin found:", admin);

        if (!admin) {
            console.log("❌ No admin found!");
            process.exit();
        }

        if (!user) {
            console.log("❌ No user 'host20' found!");
            process.exit();
        }

        const existing = await Host.findOne({ user: user._id });
        if (existing) {
            console.log("✅ Host profile already exists:", existing);
            process.exit();
        }

        const newHost = await Host.create({
            user: user._id,
            hostName: user.username,
            hostContactNumber: "Not Provided",
            adminID: admin._id
        });

        console.log("✅ Host profile created!", newHost);
        await mongoose.disconnect();
        console.log("Done!");

    } catch (err) {
        console.error("💥 ERROR:", err.message);
    }
}

fix();