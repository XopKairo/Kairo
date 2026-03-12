import express from "express";
const router = express.Router();
import { protectUser } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Razorpay from "razorpay";
import Coupon from "../models/Coupon.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_secret_placeholder",
});

router.post("/validate-coupon", protectUser, async (req, res) => {
  try {
    const { code, amount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Invalid coupon code" });
    if (new Date() > coupon.expiryDate) return res.status(400).json({ success: false, message: "Coupon expired" });
    if (amount < coupon.minPurchaseAmount) return res.status(400).json({ success: false, message: `Minimum purchase of ${coupon.minPurchaseAmount} required` });
    if (coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, message: "Coupon limit reached" });
    const discount = Math.min((amount * coupon.discountPercentage) / 100, coupon.maxDiscountAmount);
    res.json({ success: true, discount, finalAmount: amount - discount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/create-razorpay-order", protectUser, async (req, res) => {
  try {
    const { amount, coins, currency } = req.body;
    const userId = req.user._id || req.user.id;
    const options = {
      amount: Math.round(amount * 100),
      currency: currency || "INR",
      receipt: `rcpt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    await Transaction.create({
      userId,
      amount,
      orderId: order.id,
      status: "pending",
      paymentId: "",
      description: `Purchase ${coins} Coins`,
      coinsCredited: coins || 0
    });
    res.json({ success: true, order });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/verify-razorpay", protectUser, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
    const finalOrderId = razorpay_order_id || order_id;
    const userId = req.user._id || req.user.id;

    console.log(`Verifying Razorpay: Order=${finalOrderId}, Payment=${razorpay_payment_id}`);

    // 1. Signature Verification (Security)
    if (razorpay_signature) {
      const crypto = await import("crypto");
      const generated_signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "rzp_secret_placeholder")
        .update(finalOrderId + "|" + razorpay_payment_id)
        .digest("hex");

      if (generated_signature !== razorpay_signature) {
        console.error("Invalid Razorpay Signature");
        return res.status(400).json({ success: false, message: "Invalid payment signature" });
      }
    }

    // 2. Find and update transaction
    const transaction = await Transaction.findOne({ orderId: finalOrderId, status: "pending" });
    if (transaction) {
      transaction.status = "completed";
      transaction.paymentId = razorpay_payment_id;
      await transaction.save();
      
      const coinsToAdd = transaction.coinsCredited || Math.floor(transaction.amount);
      await User.findByIdAndUpdate(userId, { $inc: { coins: coinsToAdd } });
      
      console.log(`Success: Credited ${coinsToAdd} coins to user ${userId}`);
      return res.json({ success: true, message: "Razorpay verified", coinsAdded: coinsToAdd });
    }

    console.warn(`Transaction not found for Order ID: ${finalOrderId}`);
    res.status(404).json({ success: false, message: "Transaction record not found in system" });
  } catch (error) {
    console.error("Verification Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
