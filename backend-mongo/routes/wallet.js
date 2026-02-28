const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Route to recharge user wallet
router.post('/recharge', async (req, res) => {
  try {
    const { userId, amount, transactionId } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ message: 'User ID and amount are required' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Add coins to user wallet
    user.coins += Number(amount);
    await user.save();

    // In a real app, you would also save this transaction to a WalletTransaction model
    // along with the payment gateway transactionId.

    // Notify Admin & User via Socket
    if (req.io) {
      req.io.to('admin-room').emit('rechargeAlert', {
        message: `User ${user.name} recharged ${amount} coins.`,
        userId,
        amount
      });
      // Assuming user has joined a room with their userId
      req.io.to(userId).emit('walletUpdate', {
        message: 'Coin Recharge Successful',
        newBalance: user.coins
      });
    }

    res.json({ message: 'Recharge successful', newBalance: user.coins, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
