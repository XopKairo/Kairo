const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Host = require('../models/Host');
const Payout = require('../models/Payout');

// Real-time stats fetching from DB
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedHosts = await Host.countDocuments({ isVerified: true });
    const pendingPayouts = await Payout.countDocuments({ status: 'Pending' });
    
    // Calculate total coins in circulation
    const users = await User.find({}).select('coins');
    const totalCoins = users.reduce((sum, user) => sum + (user.coins || 0), 0);
    
    // Revenue placeholder logic (sum of successful payout values for example)
    const paidPayouts = await Payout.find({ status: 'Paid' });
    const revenueValue = paidPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      totalUsers,
      totalCoins,
      verifiedHosts,
      pendingPayouts,
      revenue: `₹${revenueValue.toLocaleString('en-IN')}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Analytics Route for Chart
router.get('/analytics', async (req, res) => {
  try {
    // Return some sample structured data for charts based on real user growth if possible
    // For now, let's return real count and some growth simulation
    const count = await User.countDocuments();
    res.json({
      userGrowth: [0, 0, 0, 0, 0, count], // Simple simulation for now
      revenueData: [0, 0, 0, 0, 0, 0]
    });
  } catch (error) {
     res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
