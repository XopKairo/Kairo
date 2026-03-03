const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const Payout = require('../models/Payout');
const Transaction = require('../models/Transaction');
const CoinPackage = require('../models/CoinPackage');
const razorpay = require('../utils/razorpay');
const { createOrderSchema, validateRequest } = require('../utils/validation');

// Conversion Rate: 100 Coins = 10 INR (1 Coin = 0.1 INR)
const COIN_TO_INR_RATE = 0.1;

// Create Razorpay Order
router.post('/create-order', validateRequest(createOrderSchema), async (req, res) => {
  try {
    const { amount, coinPackageId, userId } = req.body;

    if (!razorpay) {
      return res.status(500).json({ success: false, message: 'Razorpay is not configured' });
    }

    const coinPackage = await CoinPackage.findById(coinPackageId);
    if (!coinPackage) {
      return res.status(404).json({ success: false, message: 'Coin package not found' });
    }

    // Verify amount matches package price
    if (coinPackage.priceINR !== amount) {
       return res.status(400).json({ success: false, message: 'Amount mismatch' });
    }

    const options = {
      amount: amount * 100, // amount in the smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Save pending transaction
    await Transaction.create({
      userId,
      amount,
      razorpayOrderId: order.id,
      coinPackageId,
      status: 'pending',
      coinsCredited: coinPackage.coins
    });

    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Manual Payment Verification (Called by mobile app)
router.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const transaction = await Transaction.findOne({ razorpayOrderId: razorpay_order_id }).session(session);
      
      if (!transaction) throw new Error('Transaction not found');
      if (transaction.status === 'completed') {
        await session.commitTransaction();
        return res.status(200).json({ success: true, message: 'Payment already verified' });
      }

      transaction.status = 'completed';
      transaction.razorpayPaymentId = razorpay_payment_id;
      transaction.razorpaySignature = razorpay_signature;
      await transaction.save({ session });

      const user = await User.findById(transaction.userId).session(session);
      if (!user) throw new Error('User not found');

      user.coins += transaction.coinsCredited;
      await user.save({ session });

      await session.commitTransaction();

      // Notify User via Socket
      if (req.io) {
        req.io.to(user._id.toString()).emit('walletUpdate', {
          message: `${transaction.coinsCredited} coins credited!`,
          newBalance: user.coins
        });
      }

      res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } catch (error) {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: error.message });
    } finally {
      session.endSession();
    }
  } else {
    res.status(400).json({ success: false, message: 'Invalid signature' });
  }
});

// Razorpay Webhook
router.post('/webhook', async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (expectedSignature === signature) {
    if (req.body.event === 'payment.captured') {
      const { order_id, id: payment_id } = req.body.payload.payment.entity;
      
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const transaction = await Transaction.findOne({ razorpayOrderId: order_id }).session(session);
        if (transaction && transaction.status === 'pending') {
          transaction.status = 'completed';
          transaction.razorpayPaymentId = payment_id;
          await transaction.save({ session });

          const user = await User.findById(transaction.userId).session(session);
          if (user) {
            user.coins += transaction.coinsCredited;
            await user.save({ session });
          }
        }
        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        console.error('Webhook processing error:', err);
      } finally {
        session.endSession();
      }
    }
    res.status(200).send('OK');
  } else {
    res.status(400).send('Invalid signature');
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

// Route to earn coins via Ads
router.post('/earn-ad', async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { userId } = req.body;

    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');

    // Fetch Reward Amount from Global Settings
    const Settings = require('../models/Settings');
    const settings = await Settings.findOne().session(session);
    const rewardAmount = settings ? settings.rewardPerAd : 5;

    user.coins += rewardAmount;
    await user.save({ session });

    await session.commitTransaction();
    res.json({ success: true, message: `You earned ${rewardAmount} coins!`, newBalance: user.coins });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
