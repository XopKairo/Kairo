const express = require('express');
const router = express.Router();
const Payout = require('../models/Payout');
const User = require('../models/User');
const { processTransfer } = require('../utils/payoutProvider');

// Get all payouts
router.get('/', async (req, res) => {
  try {
    const payouts = await Payout.find({})
      .populate('user', 'name email phone gender')
      .populate('host', 'name email')
      .sort('-createdAt');
    res.json(payouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update payout status (Finalize Transfer)
router.put('/:id', async (req, res) => {
  const { status } = req.body; // 'Approved' or 'Rejected'
  
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout) return res.status(404).json({ message: 'Payout request not found' });
    if (payout.status !== 'Pending') return res.status(400).json({ message: 'Payout already processed' });

    if (status === 'Approved') {
      // 1. Trigger Payment Provider
      const transferResult = await processTransfer(payout);
      
      // 2. Update Payout Record
      payout.status = 'Approved';
      payout.transferId = transferResult.transferId;
      await payout.save();

      // 3. Notify User (Socket)
      if (req.io && payout.user) {
        req.io.to(payout.user.toString()).emit('payoutProcessed', {
          success: true,
          message: `Your withdrawal of ₹${payout.amountINR} has been approved and sent!`
        });
      }
    } else if (status === 'Rejected') {
      // 1. REFUND COINS TO USER
      if (payout.user && payout.coinsDeducted > 0) {
        await User.findByIdAndUpdate(payout.user, { 
          $inc: { coins: payout.coinsDeducted } 
        });
      }

      payout.status = 'Rejected';
      await payout.save();

      // 2. Notify User
      if (req.io && payout.user) {
        req.io.to(payout.user.toString()).emit('payoutProcessed', {
          success: false,
          message: `Your withdrawal request was rejected. ${payout.coinsDeducted} coins have been refunded to your wallet.`
        });
      }
    }

    res.json({ success: true, payout });
  } catch (error) {
    console.error('Payout Finalization Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
