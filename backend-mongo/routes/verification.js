const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getStorage } = require('../config/cloudinaryConfig');
const VerificationRequest = require('../models/VerificationRequest');
const User = require('../models/User');

// Configure Multer for Cloudinary
const upload = multer({ storage: getStorage('verification') });

// GET all verification requests (Admin)
router.get('/', async (req, res) => {
  try {
    const requests = await VerificationRequest.find({}).populate('userId', 'name email nickname isVerified');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new verification request (App) - Supports multiple file uploads
router.post('/submit', upload.fields([
  { name: 'selfie', maxCount: 1 },
  { name: 'idProof', maxCount: 1 }
]), async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Check if user already has a pending request
    const existingRequest = await VerificationRequest.findOne({ userId, status: 'pending' });
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending verification request' });
    }

    // Get Cloudinary URLs
    const photoUrl = req.files['selfie'] ? req.files['selfie'][0].path : null;
    const idUrl = req.files['idProof'] ? req.files['idProof'][0].path : null;

    if (!photoUrl) {
      return res.status(400).json({ message: 'Selfie is required for verification.' });
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
      const user = await User.findById(request.userId);
      await User.findByIdAndUpdate(request.userId, { 
        isVerified: true,
        isGenderVerified: true 
      });
      
      // Also update Host if exists
      const Host = require('../models/Host');
      await Host.findOneAndUpdate({ email: user.email }, { isGenderVerified: true, isVerified: true });
    } else {
      await User.findByIdAndUpdate(request.userId, { isGenderVerified: false });
    }

    res.json({ message: `Request ${status} successfully`, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
