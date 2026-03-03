const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const Call = require('../models/Call');
const User = require('../models/User');
const Host = require('../models/Host');
const { protectUser } = require('../middleware/authMiddleware');

// 1. Generate ZegoCloud Token
router.post('/generate-token', protectUser, (req, res) => {
  const { userId, roomId } = req.body;
  const appId = parseInt(process.env.ZEGO_APP_ID) || 1106955329;
  const serverSecret = process.env.ZEGO_SERVER_SECRET;
  if (!serverSecret) {
    return res.status(500).json({ success: false, message: 'ZEGO_SERVER_SECRET is not configured' });
  }
  
  res.json({
    appId,
    appSign: serverSecret,
    message: "Use these credentials to initialize ZegoUIKitPrebuiltCall"
  });
});

// 2. Start Call (Live Monitoring & Coin Enforcement)
router.post('/start', protectUser, async (req, res) => {
  try {
    const { hostId, callId } = req.body;
    const userId = req.user._id;

    // RULE 1: Minimum coins required to start a call: 30
    if (req.user.coins < 30) {
      return res.status(403).json({ 
        success: false, 
        message: 'Minimum 30 coins required to start a call' 
      });
    }
    
    const call = await Call.create({
      userId,
      hostId,
      callId,
      status: 'Active',
      startTime: new Date()
    });

    if (req.io) {
      req.io.to('admin-room').emit('callStartedAlert', {
        message: `New call started between User ${req.user.name} and Host ${hostId}`,
        callId,
        userId
      });
    }

    res.json({ success: true, message: 'Call allowed', call });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. End Call & Transaction Logic (70/30 Split with ACID Transaction)
router.post('/end', async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { callId, durationInMinutes } = req.body;
    
    const call = await Call.findOne({ callId, status: 'Active' }).session(session);
    if (!call) throw new Error('Active call not found');

    const host = await Host.findById(call.hostId).session(session);
    if (!host) throw new Error('Host not found');

    // Fetch Global Settings
    const Settings = require('../models/Settings');
    let settings = await Settings.findOne().session(session);
    if (!settings) settings = { callRate: 30, commission: 30 }; // Fallback

    const callRatePerMinute = settings.callRate; // Using global setting instead of host-specific for consistency if required

    // Calculate Coins
    const totalCoinsDeducted = durationInMinutes * callRatePerMinute;
    const hostCommissionPercent = settings.commission;
    const hostShare = totalCoinsDeducted * ((100 - hostCommissionPercent) / 100);
    const adminShare = totalCoinsDeducted * (hostCommissionPercent / 100);

    // Verify & Deduct User Coins
    const user = await User.findById(call.userId).session(session);
    if (!user || user.coins < totalCoinsDeducted) {
      throw new Error('Insufficient coins to end call properly');
    }
    user.coins -= totalCoinsDeducted;
    await user.save({ session });

    // --- SENIOR SECURITY ARCHITECT ENFORCEMENT ---
    // Update Host Earnings (STRICT: Only if Female AND Gender Verified by Admin)
    const isEarningEligible = host && host.gender === 'Female' && host.isGenderVerified;

    if (isEarningEligible) {
      host.earnings += hostShare;
      host.status = 'Online';
      await host.save({ session });
      
      // System gets 30% commission (Converted to INR)
      const adminShareINR = Number((adminShare * 0.1).toFixed(2));
      const Admin = require('../models/Admin');
      await Admin.findOneAndUpdate({}, { $inc: { totalRevenue: adminShareINR } }).session(session);
    } else if (host) {
      host.status = 'Online';
      await host.save({ session });
      
      // 100% OF TRANSACTION FLOWS TO SYSTEM REVENUE (Converted to INR)
      const totalAmountINR = Number((totalCoinsDeducted * 0.1).toFixed(2));
      const Admin = require('../models/Admin');
      await Admin.findOneAndUpdate({}, { $inc: { totalRevenue: totalAmountINR } }).session(session);
    }
    // --- END ENFORCEMENT ---

    // Save Call Record
    call.status = 'Completed';
    call.durationInMinutes = durationInMinutes;
    call.coinsDeducted = totalCoinsDeducted;
    call.hostEarning = hostShare;
    call.adminEarning = adminShare;
    call.endTime = new Date();
    await call.save({ session });

    // Update Admin Revenue Table (Master Sync)
    const revenueCollection = mongoose.connection.db.collection('admin_revenues');
    await revenueCollection.insertOne({
      callId: call._id,
      adminEarning: adminShare,
      createdAt: new Date()
    }, { session });

    await session.commitTransaction();

    res.json({
      message: 'Call ended and transaction processed successfully',
      transaction: { totalCoinsDeducted, hostShare, adminShare }
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// 4. Get Active Calls for Admin Live Monitoring Wall
router.get('/active', async (req, res) => {
  try {
    const activeCalls = await Call.find({ status: 'Active' })
      .populate('userId', 'name email')
      .populate('hostId', 'name email');
    res.json(activeCalls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
