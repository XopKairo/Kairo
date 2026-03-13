import express from "express";
const router = express.Router();
import Payout from "../models/Payout.js";
import User from "../models/User.js";
import WalletLedger from "../models/WalletLedger.js";
import AdminActionLog from "../models/AdminActionLog.js";
import { protectAdmin } from "../middleware/authMiddleware.js";
import payoutProvider from "../utils/payoutProvider.js";
const { processTransfer } = payoutProvider;

// Get all payouts
router.get("/", protectAdmin, async (req, res) => {
  try {
    const payouts = await Payout.find({})
      .populate("user", "name phone gender")
      .populate("host", "name phone")
      .sort({ createdAt: -1 });

    const sanitizedPayouts = payouts.map(p => {
      const payoutObj = p.toObject();
      if (!payoutObj.user && !payoutObj.host) {
         payoutObj.user = { name: "Deleted User", phone: "N/A" };
      }
      return payoutObj;
    });

    res.json(sanitizedPayouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update payout status (Finalize Transfer)
router.put("/:id", protectAdmin, async (req, res) => {
  const { status } = req.body; // 'Approved' or 'Rejected'

  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout)
      return res.status(404).json({ message: "Payout request not found" });
    if (payout.status !== "Pending")
      return res.status(400).json({ message: "Payout already processed" });

    if (status === "Approved") {
      const transferResult = await processTransfer(payout);
      payout.status = "Approved";
      payout.transferId = transferResult.transferId;
      await payout.save();

      await WalletLedger.create({
        userId: payout.user || payout.host,
        type: "DEBIT",
        amount: payout.coinsDeducted,
        balanceBefore: 0,
        balanceAfter: 0,
        transactionType: "WITHDRAWAL",
        referenceId: payout._id,
        description: `Withdrawal of ₹${payout.amountINR} approved. Transfer ID: ${transferResult.transferId}`
      });

      if (req.io && (payout.user || payout.host)) {
        const targetId = (payout.user || payout.host).toString();
        req.io.to(`user-${targetId}`).emit("payoutProcessed", {
          success: true,
          message: `Your withdrawal of ₹${payout.amountINR} has been approved and sent!`,
        });
      }
    } else if (status === "Rejected") {
      const userId = payout.user || payout.host;
      if (userId && payout.coinsDeducted > 0) {
        const user = await User.findById(userId);
        if (user) {
          const balanceBefore = user.coins;
          const newBalance = balanceBefore + payout.coinsDeducted;
          await User.findByIdAndUpdate(userId, { $set: { coins: newBalance } });

          await WalletLedger.create({
            userId: userId,
            type: "CREDIT",
            amount: payout.coinsDeducted,
            balanceBefore,
            balanceAfter: newBalance,
            transactionType: "WITHDRAWAL_REFUND",
            referenceId: payout._id,
            description: `Withdrawal rejected. ${payout.coinsDeducted} coins refunded.`
          });
        }
      }
      payout.status = "Rejected";
      await payout.save();

      if (req.io && userId) {
        req.io.to(`user-${userId.toString()}`).emit("payoutProcessed", {
          success: false,
          message: `Your withdrawal request was rejected. ${payout.coinsDeducted} coins have been refunded to your wallet.`,
        });
      }
    }

    // --- Audit Logging ---
    try {
      await AdminActionLog.create({
        adminId: req.admin?._id,
        action: "UPDATE_PAYOUT",
        targetId: payout._id,
        details: `Payout ID ${payout._id} marked as ${status}. coinsDeducted: ${payout.coinsDeducted}`,
      });
    } catch (logErr) {}

    res.json({ success: true, payout });
  } catch (error) {
    console.error("Payout Finalization Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
