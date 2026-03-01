const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Payout = require('../models/Payout');

// Conversion Rate: 100 Coins = 10 INR (1 Coin = 0.1 INR)
const COIN_TO_INR_RATE = 0.1;

// Route to recharge user wallet (Protected with Transactions)
router.post('/recharge', async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { userId, amount, transactionId } = req.body;

    if (!userId || !amount || !transactionId) {
      throw new Error('User ID, amount, and transactionId are required');
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    const transactionCollection = mongoose.connection.db.collection('transactions');
    
    // Uniqueness Check for transactionId
    const existingTx = await transactionCollection.findOne({ transactionId }, { session });
    if (existingTx) {
      throw new Error('Transaction ID already processed');
    }

    // Add coins to user wallet
    user.coins += Number(amount);
    await user.save({ session });

    // Update Admin's Master Transactions Table
    await transactionCollection.insertOne({
      userId: user._id,
      type: 'RECHARGE',
      amount: Number(amount),
      transactionId,
      status: 'SUCCESS',
      createdAt: new Date()
    }, { session });

    await session.commitTransaction();

    // Notify Admin & User via Socket
    if (req.io) {
      req.io.to('admin-room').emit('rechargeAlert', {
        message: `User ${user.name} recharged ${amount} coins. TxId: ${transactionId}`,
        userId,
        amount,
        transactionId
      });
      req.io.to(userId).emit('walletUpdate', {
        message: 'Coin Recharge Successful',
        newBalance: user.coins
      });
    }

    res.json({ message: 'Recharge successful', newBalance: user.coins, transactionId });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// Route to request withdrawal (User/Host)
router.post('/withdraw', async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { userId, amountCoins, paymentDetails, isAdminWithdrawal } = req.body;

    if (!userId || !amountCoins || !paymentDetails) {
      throw new Error('User ID, amount in coins, and payment details are required');
    }

    const amountNum = Number(amountCoins);
    const amountINR = Number((amountNum * COIN_TO_INR_RATE).toFixed(2));

    // Admin Payout Logic (No Limits)
    if (isAdminWithdrawal) {
      const Admin = require('../models/Admin');
      const admin = await Admin.findById(userId).session(session);
      if (!admin || admin.totalRevenue < amountINR) throw new Error('Insufficient Admin revenue');
      
      admin.totalRevenue -= amountINR;
      await admin.save({ session });

      await Payout.create([{
        user: userId, // Using user field for admin ID here for simplicity
        amountINR,
        coinsDeducted: 0,
        paymentDetails,
        status: 'Approved' // Admin withdrawals auto-approved? Or Pending? Let's say Pending for record.
      }], { session });

      await session.commitTransaction();
      return res.json({ success: true, message: 'Admin withdrawal submitted', amountINR });
    }

    // Normal User/Host Logic
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');

    // BLOCK MALE WITHDRAWALS
    if (user.gender === 'Male') {
      throw new Error('Withdrawal is only available for Female Hosts');
    }

    if (user.coins < amountNum) {
      throw new Error('Insufficient coins in wallet');
    }

    // Rule 1: Minimum 500 INR
    if (amountINR < 500) {
      throw new Error('Minimum withdrawal amount is ₹500');
    }

    // Date Ranges
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);

    // Rule 2: Daily Limit 2000 INR
    const dailyPayouts = await Payout.find({ 
      user: userId, 
      createdAt: { $gte: startOfDay },
      status: { $ne: 'Rejected' }
    }).session(session);
    const dailyTotal = dailyPayouts.reduce((sum, p) => sum + p.amountINR, 0);
    if (dailyTotal + amountINR > 2000) {
      throw new Error('Daily withdrawal limit exceeded (Max ₹2000/day)');
    }

    // Rule 3: Monthly Limit 10,000 INR (Only for Non-Female users)
    if (user.gender !== 'Female') {
      const monthlyPayouts = await Payout.find({ 
        user: userId, 
        createdAt: { $gte: startOfMonth },
        status: { $ne: 'Rejected' }
      }).session(session);
      const monthlyTotal = monthlyPayouts.reduce((sum, p) => sum + p.amountINR, 0);
      if (monthlyTotal + amountINR > 10000) {
        throw new Error('Monthly withdrawal limit of ₹10,000 exceeded for male users.');
      }
    }

    // Create Payout Request
    const payout = await Payout.create([{
      user: userId,
      amountINR,
      coinsDeducted: amountNum,
      paymentDetails,
      status: 'Pending'
    }], { session });

    // Deduct Coins from User Wallet
    user.coins -= amountNum;
    await user.save({ session });

    await session.commitTransaction();

    // Notify Admin via Socket
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
      newBalance: user.coins,
      amountINR 
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
