import express from "express";
import mongoose from "mongoose";
import os from "os";
import User from "../models/User.js";
import Host from "../models/Host.js";
import Payout from "../models/Payout.js";
import Call from "../models/Call.js";
import Transaction from "../models/Transaction.js";
import Report from "../models/Report.js";
import redisClient from "../config/redis.js";

const router = express.Router();

// Real-time stats fetching from DB
router.get("/stats", async (req, res) => {
  try {
    const cacheKey = "admin_dashboard_stats";
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) return res.json(JSON.parse(cachedData));

    const totalUsers = await User.countDocuments();
    const verifiedHosts = await Host.countDocuments({ isVerified: true });
    const pendingPayouts = await Payout.countDocuments({ status: "Pending" });
    const totalReports = await Report.countDocuments({ status: "Open" });
    const totalCalls = await Call.countDocuments();
    const totalTransactions = await Transaction.countDocuments({
      status: "completed",
    });

    // Active Users (Logged in today)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const activeUsersToday = await User.countDocuments({
      lastLoginDate: { $gte: startOfToday },
    });

    // Daily Revenue (Completed transactions today)
    const dailyRevenueResult = await Transaction.aggregate([
      { $match: { status: "completed", createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const dailyRevenue =
      dailyRevenueResult.length > 0 ? dailyRevenueResult[0].total : 0;

    // Total Revenue (Lifetime)
    const totalRevenueResult = await Transaction.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue =
      totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // --- Peak Hours ---
    const peakHoursData = await User.aggregate([
      { $match: { lastLoginDate: { $ne: null } } },
      { $project: { hour: { $hour: "$lastLoginDate" } } },
      { $group: { _id: "$hour", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // --- Retention ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeLast7Days = await User.countDocuments({ lastLoginDate: { $gte: sevenDaysAgo } });
    const retentionRate = totalUsers > 0 ? (activeLast7Days / totalUsers) * 100 : 0;

    const statsResult = {
      totalUsers,
      activeUsersToday,
      totalCalls,
      totalTransactions,
      verifiedHosts,
      pendingPayouts,
      totalReports,
      dailyRevenue: `₹${dailyRevenue.toLocaleString("en-IN")}`,
      totalRevenue: `₹${totalRevenue.toLocaleString("en-IN")}`,
      retentionRate: retentionRate.toFixed(2) + "%",
      peakHours: peakHoursData,
      rawTotalRevenue: totalRevenue,
      system: {
        cpuUsage: (os.loadavg()[0] * 10).toFixed(1) + "%",
        memoryUsage:
          ((1 - os.freemem() / os.totalmem()) * 100).toFixed(1) + "%",
        uptime: Math.floor(os.uptime() / 3600) + "h",
        dbStatus:
          mongoose.connection.readyState === 1 ? "Healthy" : "Disconnected",
      },
    };

    await redisClient.setEx(cacheKey, 60, JSON.stringify(statsResult));
    res.json(statsResult);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET Current Live Calls (Supreme Monitor)
router.get("/live-calls", async (req, res) => {
  try {
    const liveCalls = await Call.find({ status: "Active" })
      .populate("userId", "name phone profilePicture")
      .populate("hostId", "name phone hostId profilePicture")
      .sort({ startTime: -1 })
      .limit(20);

    const formattedCalls = liveCalls.map(call => ({
      _id: call._id,
      callId: call.callId,
      user: {
        name: call.userId?.name || "User",
        phone: call.userId?.phone || "N/A",
        profilePicture: call.userId?.profilePicture
      },
      host: {
        name: call.hostId?.name || "Host",
        hostId: call.hostId?.hostId || "N/A",
        profilePicture: call.hostId?.profilePicture
      },
      duration: Math.floor((new Date() - new Date(call.startTime)) / 1000), // in seconds
      startTime: call.startTime
    }));

    res.json(formattedCalls);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Analytics Route for Chart
router.get("/analytics", async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const userGrowthData = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const revenueCollection = mongoose.connection.db.collection("admin_revenues");
    const revenueData = await revenueCollection
      .aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              year: { $year: "$createdAt" },
            },
            total: { $sum: "$adminEarning" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])
      .toArray();

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labels = [];
    const userCounts = [];
    const revenueTotals = [];

    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      labels.push(`${months[m - 1]} ${y}`);

      const userMatch = userGrowthData.find(ug => ug._id.month === m && ug._id.year === y);
      userCounts.push(userMatch ? userMatch.count : 0);

      const revMatch = revenueData.find(rd => rd._id.month === m && rd._id.year === y);
      revenueTotals.push(revMatch ? (revMatch.total * 0.1).toFixed(2) : 0);
    }

    res.json({ labels, userGrowth: userCounts, revenueData: revenueTotals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
