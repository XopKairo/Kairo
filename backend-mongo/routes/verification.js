const express = require('express');
const router = express.Router();
const VerificationRequest = require('../models/VerificationRequest');
const User = require('../models/User');

// GET all verification requests (Admin)
router.get('/', async (req, res) => {
  try {
    const requests = await VerificationRequest.find({}).populate('userId', 'name email nickname isVerified');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new verification request (App)
router.post('/submit', async (req, res) => {
  try {
    const { userId, photoUrl, idUrl } = req.body;
    
    // Check if user already has a pending request
    const existingRequest = await VerificationRequest.findOne({ userId, status: 'pending' });
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending verification request' });
    }

    const request = new VerificationRequest({ userId, photoUrl, idUrl });
    await request.save();
    
    res.status(201).json({ message: 'Verification request submitted successfully', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST to approve/reject verification request (Admin)
router.post('/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await VerificationRequest.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    // If approved, update user model
    if (status === 'approved') {
      await User.findByIdAndUpdate(request.userId, { isVerified: true });
    } else {
      await User.findByIdAndUpdate(request.userId, { isVerified: false });
    }

    res.json({ message: `Request ${status} successfully`, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
