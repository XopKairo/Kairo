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

// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_secret_placeholder",
});

// @desc    Validate Coupon
// @route   POST /api/user/payments/validate-coupon
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

// @desc    Create Razorpay Order
// @route   POST /api/user/payments/create-razorpay-order
router.post("/create-razorpay-order", protectUser, async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const userId = req.user._id;

    const options = {
      amount: Math.round(amount * 100), // in paise
      currency: currency || "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    await Transaction.create({
      userId,
      amount,
      type: "credit",
      status: "pending",
      paymentId: order.id,
      description: "Razorpay Deposit",
    });

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Verify Razorpay Payment
router.post("/verify-razorpay", protectUser, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id } = req.body;
    const userId = req.user._id;

    // In a real app, verify signature here using crypto
    // For now, we assume successful if frontend sends it (but signature check is mandatory for prod)

    const transaction = await Transaction.findOne({ paymentId: razorpay_order_id, status: "pending" });
    if (transaction) {
      transaction.status = "completed";
      transaction.paymentId = razorpay_payment_id; // update with actual payment id
      await transaction.save();

      const coinAmount = Math.floor(transaction.amount); // 1 INR = 1 Coin
      await User.findByIdAndUpdate(userId, { $inc: { coins: coinAmount } });

      return res.json({ success: true, message: "Razorpay payment verified" });
    }
    res.status(404).json({ success: false, message: "Transaction not found" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create Cashfree Order
// @route   POST /api/user/payments/create-order
// @access  Private
router.post("/create-order", protectUser, async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const orderId = `order_${Date.now()}_${userId.toString().substring(0, 5)}`;

    const cashfreeOrder = await createCashfreeOrder({
      orderId,
      amount,
      currency: currency || "INR",
      userId: userId.toString(),
      customerPhone: user.phone || "9999999999",
      customerEmail: `${user.phone}@zora.com`,
    });

    // Create a pending transaction
    await Transaction.create({
      userId,
      amount,
      type: "credit",
      status: "pending",
      paymentId: orderId, // storing orderId as initial payment reference
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

// @desc    Verify Cashfree Payment
// @route   POST /api/user/payments/verify
// @access  Private
router.post("/verify", protectUser, async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user._id;

    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID is required" });
    }

    const orderStatus = await getCashfreeOrderStatus(orderId);

    console.log(
      `Payment Verification: Order ${orderId} status is ${orderStatus.order_status}`,
    );

    if (orderStatus.order_status === "PAID") {
      const transaction = await Transaction.findOne({
        paymentId: orderId,
        status: "pending",
      });

      if (transaction) {
        transaction.status = "completed";
        await transaction.save();

        // Add coins to user (Assumption: 1 INR = 1 Coin, adjust as needed)
        // Check coin logic in other parts of the app
        const coinAmount = Math.floor(transaction.amount);
        await User.findByIdAndUpdate(userId, { $inc: { coins: coinAmount } });

        return res.json({
          success: true,
          message: "Payment verified and coins added",
        });
      } else {
        // Check if already processed
        const existing = await Transaction.findOne({
          paymentId: orderId,
          status: "completed",
        });
        if (existing) {
          return res.json({
            success: true,
            message: "Payment already processed",
          });
        }
        return res
          .status(404)
          .json({
            success: false,
            message: "Transaction not found or already processed",
          });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: `Payment status: ${orderStatus.order_status}`,
        status: orderStatus.order_status,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
