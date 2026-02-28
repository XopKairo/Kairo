const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getUserBadge } = require('../utils/badgeSystem');

// User Registration
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const user = await User.create({ name, email, password, lastLoginDate: new Date(), zoraPoints: 5 }); // 5 points for sign up
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });
    const badge = getUserBadge(user.zoraPoints);
    res.status(201).json({ 
      success: true, 
      token, 
      user: { id: user._id, name: user.name, email: user.email, coins: user.coins, zoraPoints: user.zoraPoints, badge } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      if (user.isBanned) {
         return res.status(403).json({ success: false, message: 'Account is banned by admin' });
      }

      // Check daily login points
      const today = new Date().setHours(0, 0, 0, 0);
      const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate).setHours(0, 0, 0, 0) : 0;
      
      let pointsAwarded = false;
      if (today > lastLogin || !user.lastLoginDate) {
        user.zoraPoints += 5; // 5 points for daily login
        user.lastLoginDate = new Date();
        await user.save();
        pointsAwarded = true;
      }

      const badge = getUserBadge(user.zoraPoints);
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });
      
      res.json({ 
        success: true, 
        token, 
        pointsAwarded,
        user: { id: user._id, name: user.name, email: user.email, coins: user.coins, zoraPoints: user.zoraPoints, badge } 
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
