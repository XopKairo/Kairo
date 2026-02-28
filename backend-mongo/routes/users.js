const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { getUserBadge } = require('../utils/badgeSystem');

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

// POST to ban/unban users
router.post('/:id/ban', async (req, res) => {
  try {
    const { isBanned } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
