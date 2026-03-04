import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js.js';
import Payout from '../models/Payout.js.js';
import Transaction from '../models/Transaction.js.js';
import CoinPackage from '../models/CoinPackage.js.js';
import AdminActionLog from '../models/AdminActionLog.js.js';
import Admin from '../models/Admin.js.js';
import Settings from '../models/Settings.js.js';

const router = express.Router();

// Conversion Rate: 100 Coins = 10 INR (1 Coin = 0.1 INR)
const COIN_TO_INR_RATE = 0.1;

// Route to request withdrawal (User/Host)
router.post('/withdraw', async (req, res) => {
  const { userId, amountCoins, paymentDetails, isAdminWithdrawal, clientRequestId } = req.body;

  if (!clientRequestId) {
    return res.status(400).json({ success: false, message: 'clientRequestId is required for idempotency' });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Check for duplicate request
    const existingRequest = await Payout.findOne({ clientRequestId }).session(session);
    if (existingRequest) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: 'Duplicate withdrawal request detected' });
    }

    if (!userId || !amountCoins || !paymentDetails) {
      throw new Error('User ID, amount in coins, and payment details are required');
    }

    const amountNum = Number(amountCoins);
    const amountINR = Number((amountNum * COIN_TO_INR_RATE).toFixed(2));

    // Admin Payout Logic (No Limits)
    if (isAdminWithdrawal) {
      const admin = await Admin.findById(userId).session(session);
      if (!admin || admin.totalRevenue < amountINR) throw new Error('Insufficient Admin revenue');
      
      admin.totalRevenue -= amountINR;
      await admin.save({ session });

      await Payout.create([{
        user: userId,
        amountINR,
        coinsDeducted: 0,
        paymentDetails,
        status: 'Approved',
        clientRequestId
      }], { session });

      await session.commitTransaction();
      return res.json({ success: true, message: 'Admin withdrawal submitted', amountINR });
    }

    // Normal User/Host Logic
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');

    if (user.gender === 'Male') {
      throw new Error('Withdrawal is only available for Female Hosts');
    }

    if (user.coins < amountNum) {
      throw new Error('Insufficient coins in wallet');
    }

    if (amountINR < 500) {
      throw new Error('Minimum withdrawal amount is ₹500');
    }

    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const dailyPayouts = await Payout.find({ 
      user: userId, 
      createdAt: { $gte: startOfDay },
      status: { $ne: 'Rejected' }
    }).session(session);
    const dailyTotal = dailyPayouts.reduce((sum, p) => sum + p.amountINR, 0);
    if (dailyTotal + amountINR > 2000) {
      throw new Error('Daily withdrawal limit exceeded (Max ₹2000/day)');
    }

    // Create Payout Request
    await Payout.create([{
      user: userId,
      amountINR,
      coinsDeducted: amountNum,
      paymentDetails,
      status: 'Pending',
      clientRequestId
    }], { session });

    // ATOMIC DEDUCTION
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, coins: { $gte: amountNum } },
      { $inc: { coins: -amountNum } },
      { session, new: true }
    );

    if (!updatedUser) {
      throw new Error('Insufficient coins or user not found during atomic update');
    }

    await session.commitTransaction();

    if (req.io) {
      req.io.to('admin-room').emit('payoutRequestAlert', {
        message: `New withdrawal request from ${user.name}: ₹${amountINR}`,
        userId,
        amountINR
      });
    }

    res.json({ 
      success: true, 
      message: 'Withdrawal request submitted successfully.', 
      newBalance: updatedUser.coins,
      amountINR 
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    res.status(400).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
});

// Route to earn coins via Ads - Using ATOMIC updates
router.post('/earn-ad', async (req, res) => {
  const { userId } = req.body;
  try {
    const settings = await Settings.findOne();
    const rewardAmount = settings ? settings.rewardPerAd : 5;

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { coins: rewardAmount } },
      { new: true }
    );
    
    if (!user) throw new Error('User not found');

    res.json({ success: true, message: `You earned ${rewardAmount} coins!`, newBalance: user.coins });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
