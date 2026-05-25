const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');

router.get('/', async (req, res) => {
  const { search, category, sort } = req.query;
  let query = {};
  if (search) query.title = { $regex: search, $options: 'i' };
  if (category) query.category = category;
  
  let listings = Listing.find(query);
  if (sort === 'price_asc') listings.sort({ price: 1 });
  res.json(await listings);
});

router.post('/', async (req, res) => {
  const listing = new Listing(req.body);
  await listing.save();
  res.json(listing);
});

router.delete('/:id', async (req, res) => {
  await Listing.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

router.get('/:id', async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    res.json(listing);
});

module.exports = router;