const express = require("express");
const router = express.Router();
const User = require("../models/user"); // Ensure this matches your model file name

router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
