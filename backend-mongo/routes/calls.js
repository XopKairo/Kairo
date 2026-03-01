const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const Call = require('../models/Call');
const User = require('../models/User');
const Host = require('../models/Host');

// 1. Generate ZegoCloud Token (Optional if AppSign is directly used in App)
router.post('/generate-token', (req, res) => {
  const { userId, roomId } = req.body;
  const appId = 1106955329;
  const serverSecret = "f6cb4ea31440995b9b6b724678ff112db1d0220cf0dd31a4057c835faae45bd2";
  
  res.json({
    appId,
    appSign: serverSecret,
    message: "Use these credentials to initialize ZegoUIKitPrebuiltCall"
  });
});

// 2. Start Call (Live Monitoring)
router.post('/start', async (req, res) => {
  try {
    const { userId, hostId, callId } = req.body;
    
    const call = await Call.create({
      userId,
      hostId,
      callId,
      status: 'Active'
    });

    if (req.io) {
      req.io.to('admin-room').emit('callStartedAlert', {
        message: `New call started between User ${userId} and Host ${hostId}`,
        callId
      });
    }

    res.json({ message: 'Call started successfully', call });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. End Call & Transaction Logic (70/30 Split with ACID Transaction)
router.post('/end', async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { callId, durationInMinutes, callRatePerMinute } = req.body;
    
    const call = await Call.findOne({ callId, status: 'Active' }).session(session);
    if (!call) throw new Error('Active call not found');

    // Calculate Coins
    const totalCoinsDeducted = durationInMinutes * callRatePerMinute;
    const hostShare = totalCoinsDeducted * 0.70; // 70% to Host
    const adminShare = totalCoinsDeducted * 0.30; // 30% to Admin

    // Verify & Deduct User Coins
    const user = await User.findById(call.userId).session(session);
    if (!user || user.coins < totalCoinsDeducted) {
      throw new Error('Insufficient coins to end call properly');
    }
    user.coins -= totalCoinsDeducted;
    await user.save({ session });

    // Update Host Earnings
    const host = await Host.findById(call.hostId).session(session);
    if (host) {
      host.earnings += hostShare;
      host.status = 'Online';
      await host.save({ session });
    }

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
