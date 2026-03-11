import express from "express";
const router = express.Router();
import { protectUser } from "../middleware/authMiddleware.js";
import {
  createCashfreeOrder,
  getCashfreeOrderStatus,
} from "../utils/cashfree.js";
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
    const { amount, currency } = req.body;
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
      description: "Razorpay Deposit",
    });
    res.json({ success: true, order });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/verify-razorpay", protectUser, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id } = req.body;
    const userId = req.user._id || req.user.id;
    const transaction = await Transaction.findOne({ orderId: razorpay_order_id, status: "pending" });
    if (transaction) {
      transaction.status = "completed";
      transaction.paymentId = razorpay_payment_id;
      await transaction.save();
      await User.findByIdAndUpdate(userId, { $inc: { coins: Math.floor(transaction.amount) } });
      return res.json({ success: true, message: "Razorpay verified" });
    }
    res.status(404).json({ success: false, message: "Transaction not found" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/create-order", protectUser, async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const orderId = `order_${Date.now()}_${userId.toString().substring(0, 5)}`;
    const cashfreeOrder = await createCashfreeOrder({
      orderId, amount, currency: currency || "INR", userId: userId.toString(),
      customerPhone: user.phone || "9999999999", customerEmail: `${user.phone}@zora.com`,
    });
    await Transaction.create({
      userId, amount, orderId,
      status: "pending", paymentId: cashfreeOrder.order_id,
      description: "Cashfree Deposit",
    });
    res.status(201).json({
      success: true,
      orderId: cashfreeOrder.order_id,
      paymentSessionId: cashfreeOrder.payment_session_id,
      paymentLink: cashfreeOrder.payment_link,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
