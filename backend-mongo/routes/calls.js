import express from 'express';
const router = express.Router();
import crypto from 'crypto';
import mongoose from 'mongoose';
import Call from '../models/Call.js';
import User from '../models/User.js';
import Host from '../models/Host.js';
import Settings from '../models/Settings.js';
import Admin from '../models/Admin.js';
import { protectUser } from '../middleware/authMiddleware.js';

// 1. Generate ZegoCloud Token
router.post('/generate-token', protectUser, (req, res) => {
  const { userId, roomId } = req.body;
  const appId = parseInt(process.env.ZEGO_APP_ID);
  const serverSecret = process.env.ZEGO_SERVER_SECRET;
  
  if (!appId || !serverSecret) {
    return res.status(500).json({ success: false, message: 'ZEGO configuration is missing on server' });
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
    let settings = await Settings.findOne().session(session);
    if (!settings) settings = { callRate: 30, commission: 30 }; // Fallback

    const callRatePerMinute = settings.callRate; 

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
    const isEarningEligible = host && host.gender === 'Female' && host.isGenderVerified;

    if (isEarningEligible) {
      host.earnings += hostShare;
      host.status = 'Online';
      await host.save({ session });
      
      const adminShareINR = Number((adminShare * 0.1).toFixed(2));
      await Admin.findOneAndUpdate({}, { $inc: { totalRevenue: adminShareINR } }).session(session);
    } else if (host) {
      host.status = 'Online';
      await host.save({ session });
      
      const totalAmountINR = Number((totalCoinsDeducted * 0.1).toFixed(2));
      await Admin.findOneAndUpdate({}, { $inc: { totalRevenue: totalAmountINR } }).session(session);
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

export default router;
