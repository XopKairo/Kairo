const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// GET all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find({});
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update report status
router.put('/:id', async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
