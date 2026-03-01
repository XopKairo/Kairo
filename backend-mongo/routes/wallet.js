const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

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

module.exports = router;
