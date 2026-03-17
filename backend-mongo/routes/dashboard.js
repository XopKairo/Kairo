import express from "express";
import mongoose from "mongoose";
import os from "os";
import User from "../models/User.js";
import Host from "../models/Host.js";
import Payout from "../models/Payout.js";
import Call from "../models/Call.js";
import Transaction from "../models/Transaction.js";
import Report from "../models/Report.js";
import CallScreenshot from "../models/CallScreenshot.js";
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

    // Admin Call Commission Revenue
    const adminCallEarningResult = await Call.aggregate([
      { $match: { status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$adminEarning" } } },
    ]);
    const totalAdminEarning = adminCallEarningResult.length > 0 ? adminCallEarningResult[0].total : 0;

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

    // --- Trends (Last 30 Days) ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const registrationTrend = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const revenueTrend = await Transaction.aggregate([
      { $match: { status: "completed", createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } }
    ]);

    // --- Top Performing Hosts ---
    const topHosts = await Host.find({ isVerified: true, isDeleted: false })
      .sort({ earnings: -1 })
      .limit(5)
      .select("name hostId earnings profilePicture totalCalls");

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
      adminTotalEarnings: `₹${totalAdminEarning.toLocaleString("en-IN")}`,
      retentionRate: retentionRate.toFixed(2) + "%",
      peakHours: peakHoursData,
      registrationTrend,
      revenueTrend,
      topHosts,
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

// GET Current Live Calls (Supreme Monitor with both Call and LiveCall models)
router.get("/live-calls", async (req, res) => {
  try {
    // 1. Fetch from Call model (Database Layer)
    const activeDbCalls = await Call.find({ status: "Active" })
      .populate("userId", "name phone profilePicture")
      .populate("hostId", "name phone hostId profilePicture")
      .sort({ startTime: -1 });

    // 2. Fetch from LiveCall model (Socket Layer)
    const activeSocketCalls = await LiveCall.find({ status: "ACTIVE" });

    // 3. Merge and format (Supreme Sync)
    const allCallIds = new Set(activeDbCalls.map(c => c.callId));
    
    // Add socket calls that are not in DB calls yet
    const missingSocketCalls = activeSocketCalls.filter(sc => !allCallIds.has(sc.callId));

    const formattedDbCalls = await Promise.all(activeDbCalls.map(async (call) => {
      const latestScreenshot = await CallScreenshot.findOne({ callId: call._id })
        .sort({ createdAt: -1 })
        .select("imageUrl isFlagged confidenceScore");

      return {
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
        duration: Math.floor((new Date() - new Date(call.startTime)) / 1000),
        startTime: call.startTime,
        source: "DB",
        screenshot: latestScreenshot ? {
          url: latestScreenshot.imageUrl,
          flagged: latestScreenshot.isFlagged,
          score: latestScreenshot.confidenceScore
        } : null
      };
    }));

    const formattedSocketCalls = await Promise.all(missingSocketCalls.map(async (sc) => {
       // Minimal info for socket-only calls (Fallback)
       const user = await User.findById(sc.userId).select("name phone profilePicture");
       const host = await Host.findOne({ userId: sc.hostId }).select("name phone hostId profilePicture");

       return {
         _id: sc._id,
         callId: sc.callId,
         user: {
           name: user?.name || "User",
           phone: user?.phone || "N/A",
           profilePicture: user?.profilePicture
         },
         host: {
           name: host?.name || "Host",
           hostId: host?.hostId || "N/A",
           profilePicture: host?.profilePicture
         },
         duration: Math.floor((new Date() - new Date(sc.startedAt)) / 1000),
         startTime: sc.startedAt,
         source: "SOCKET",
         screenshot: null
       };
    }));

    res.json([...formattedDbCalls, ...formattedSocketCalls]);
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
