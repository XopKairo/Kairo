const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Call = require('../models/Call');
const User = require('../models/User');
const Host = require('../models/Host');

// 1. Generate ZegoCloud Token (Optional if AppSign is directly used in App)
router.post('/generate-token', (req, res) => {
  const { userId, roomId } = req.body;
  const appId = 1106955329;
  const serverSecret = "f6cb4ea31440995b9b6b724678ff112db1d0220cf0dd31a4057c835faae45bd2";
  
  // Note: For ZegoCloud Prebuilt UIKit in React Native, AppID and AppSign are usually 
  // passed directly. If a true backend token is needed (for Web/Advanced security),
  // Zego provides a specific crypto algorithm. For now, we return the AppSign.
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
    
    // Create an active call record
    const call = await Call.create({
      userId,
      hostId,
      callId,
      status: 'Active'
    });

    // Notify Admin Panel Live Wall via Socket.io
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

// 3. End Call & Transaction Logic (70/30 Split)
router.post('/end', async (req, res) => {
  try {
    const { callId, durationInMinutes, callRatePerMinute } = req.body;
    
    const call = await Call.findOne({ callId, status: 'Active' });
    if (!call) return res.status(404).json({ message: 'Active call not found' });

    // Calculate Coins
    const totalCoinsDeducted = durationInMinutes * callRatePerMinute;
    const hostShare = totalCoinsDeducted * 0.70; // 70% to Host
    const adminShare = totalCoinsDeducted * 0.30; // 30% to Admin

    // Update User (Deduct Coins)
    await User.findByIdAndUpdate(call.userId, {
      $inc: { coins: -totalCoinsDeducted }
    });

    // Update Host (Add Earnings & Set status back to Online)
    await Host.findByIdAndUpdate(call.hostId, {
      $inc: { earnings: hostShare },
      status: 'Online'
    });

    // Update Call Record
    call.status = 'Completed';
    call.durationInMinutes = durationInMinutes;
    call.coinsDeducted = totalCoinsDeducted;
    call.hostEarning = hostShare;
    call.adminEarning = adminShare;
    call.endTime = new Date();
    await call.save();

    res.json({
      message: 'Call ended and transaction processed successfully',
      transaction: { totalCoinsDeducted, hostShare, adminShare }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
