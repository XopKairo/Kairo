const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// GET all tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.find({}).populate('userId', 'name email');
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update ticket status/response
router.put('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
