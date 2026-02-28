const express = require('express');
const router = express.Router();
const Payout = require('../models/Payout');

// Get all payouts
router.get('/', async (req, res) => {
  const payouts = await Payout.find({}).populate('user host');
  res.json(payouts);
});

// Update payout status
router.put('/:id', async (req, res) => {
  const { status } = req.body;
  const payout = await Payout.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(payout);
});

module.exports = router;
