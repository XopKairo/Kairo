const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Host = require('../models/Host');
const Payout = require('../models/Payout');
const Call = require('../models/Call');
const Transaction = require('../models/Transaction');

// Real-time stats fetching from DB
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedHosts = await Host.countDocuments({ isVerified: true });
    const pendingPayouts = await Payout.countDocuments({ status: 'Pending' });
    const totalCalls = await Call.countDocuments();
    const totalTransactions = await Transaction.countDocuments({ status: 'completed' });
    
    // Active Users (Logged in today)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const activeUsersToday = await User.countDocuments({ lastLoginDate: { $gte: startOfToday } });

    // Daily Revenue (Completed transactions today)
    const dailyRevenueResult = await Transaction.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const dailyRevenue = dailyRevenueResult.length > 0 ? dailyRevenueResult[0].total : 0;

    // Total Revenue (Lifetime)
    const totalRevenueResult = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    res.json({
      totalUsers,
      activeUsersToday,
      totalCalls,
      totalTransactions,
      verifiedHosts,
      pendingPayouts,
      dailyRevenue: `₹${dailyRevenue.toLocaleString('en-IN')}`,
      totalRevenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
      rawTotalRevenue: totalRevenue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Analytics Route for Chart
router.get('/analytics', async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // 1. User Growth Aggregation
    const userGrowthData = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // 2. Revenue Aggregation (using the ad-hoc collection)
    const mongoose = require('mongoose');
    const revenueCollection = mongoose.connection.db.collection('admin_revenues');
    const revenueData = await revenueCollection.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          total: { $sum: "$adminEarning" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]).toArray();

    // Map to last 6 months labels
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labels = [];
    const userCounts = [];
    const revenueTotals = [];

    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      
      labels.push(`${months[m-1]} ${y}`);
      
      const userMatch = userGrowthData.find(ug => ug._id.month === m && ug._id.year === y);
      userCounts.push(userMatch ? userMatch.count : 0);

      const revMatch = revenueData.find(rd => rd._id.month === m && rd._id.year === y);
      revenueTotals.push(revMatch ? (revMatch.total * 0.1).toFixed(2) : 0); // Convert coins to INR
    }

    res.json({
      labels,
      userGrowth: userCounts,
      revenueData: revenueTotals
    });
  } catch (error) {
     console.error('Analytics Error:', error);
     res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
