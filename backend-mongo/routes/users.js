const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTP = require('../models/OTP');
const { getUserBadge } = require('../utils/badgeSystem');

// GET /otps - Fetch active OTPs for Admin verification and debugging
router.get('/otps', async (req, res) => {
  try {
    const otps = await OTP.find({}).sort({ createdAt: -1 });
    res.status(200).json(otps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /search - Fuzzy search users by nickname, location, and interests
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    // Create a case-insensitive regex for fuzzy search
    const regex = new RegExp(q, 'i');

    let users = await User.find({
      $or: [
        { nickname: { $regex: regex } },
        { location: { $regex: regex } },
        { interests: { $regex: regex } }
      ]
    }).select('-password -__v').limit(20);

    // Map badges
    users = users.map(u => {
       const uObj = u.toObject();
       uObj.badge = getUserBadge(u.zoraPoints || 0);
       return uObj;
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all users
router.get('/', async (req, res) => {
  try {
    let users = await User.find({}).select('-password');
    users = users.map(u => {
       const uObj = u.toObject();
       uObj.badge = getUserBadge(u.zoraPoints || 0);
       return uObj;
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT to update Zora Points (Admin)
router.put('/:id/points', async (req, res) => {
  try {
    const { points } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { zoraPoints: Number(points) },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const badge = getUserBadge(user.zoraPoints);
    res.json({ message: 'Points updated successfully', user, badge });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT to add/deduct coins
router.put('/:id/coins', async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.coins += Number(amount);
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT to update user interests
router.put('/:id/interests', async (req, res) => {
  try {
    const { interests } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { interests },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'Interests updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST to update push token
router.post('/:id/push-token', async (req, res) => {
  try {
    const { pushToken } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { pushToken }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Push token updated successfully', pushToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST to verify/unverify users
router.post('/:id/verify', async (req, res) => {
  try {
    const { isVerified } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: `User ${isVerified ? 'verified' : 'unverified'} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST to ban/unban users
router.post('/:id/ban', async (req, res) => {
  try {
    const { isBanned } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Real-time Ban Enforcement via Socket
    if (isBanned && req.io) {
      req.io.to(req.params.id).emit('userBanned', {
        message: 'Your account has been banned by the administrator.'
      });
    }

    res.json({ message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE user (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
