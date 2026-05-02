const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path"); // 🆕 [ADDED] for file paths

const app = express();

app.use(express.json());

// ==============================
// 🆕 [ADDED] Serve static files
// ==============================
app.use(express.static("public"));


// ==============================
// 🆕 Session Middleware
// ==============================
app.use(session({
    secret: "secret123",
    resave: false,
    saveUninitialized: true
}));


// ==============================
// MongoDB Connection
// ==============================
mongoose.connect("mongodb://127.0.0.1:27017/airbnbDB")
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));


// ==============================
// Schema + Model
// ==============================
const listingSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    hostId: String,
    contact: String,
    location: String,
    price: Number,
    image: String
});

const Listing = mongoose.model("Listing", listingSchema);


// ==============================
// AUTH MIDDLEWARE
// ==============================
function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect("/loginPage");
}




// ==============================
// LOGIN ROUTE
// ==============================
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "123") {
        req.session.user = { role: "admin" };
        return res.json({ role: "admin" });
    }

    if (username === "student" && password === "123") {
        req.session.user = { role: "student" };
        return res.json({ role: "student" });
    }

    res.status(401).send("Invalid credentials");
});


// ==============================
// LOGOUT
// ==============================
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/loginPage");
    });
});


// ==============================
// ROUTES (NOW USING HTML FILES)
// ==============================
app.get("/", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "public/browseListing.html"));
});

app.get("/listings", async (req, res) => {
    const listings = await Listing.find();
    res.json(listings);
});

app.post("/listings", async (req, res) => {
    try {
        const listing = await Listing.create(req.body);
        res.json(listing);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get("/browseListing", (req, res) => {
    res.sendFile(path.join(__dirname, "public/browseListing.html"));
});

app.get("/loginPage", (req, res) => {
    res.sendFile(path.join(__dirname, "public/login.html"));
});

app.get("/createListing", (req, res) => {
    res.sendFile(path.join(__dirname, "public/createListing.html"));
});


app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
// ==============================
// CRUD API
// ==============================
