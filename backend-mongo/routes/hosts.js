const express = require('express');
const router = express.Router();
const Host = require('../models/Host');

// GET all hosts
router.get('/', async (req, res) => {
  try {
    const hosts = await Host.find({});
    res.json(hosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST to verify host
router.post('/:id/verify', async (req, res) => {
  try {
    const { isVerified } = req.body;
    const host = await Host.findByIdAndUpdate(req.params.id, { isVerified }, { new: true });
    if (!host) return res.status(404).json({ message: 'Host not found' });
    res.json({ message: 'Host verification status updated', host });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT to update host status (Online/Busy/Offline)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const host = await Host.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!host) return res.status(404).json({ message: 'Host not found' });
    res.json({ message: 'Host status updated', host });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
