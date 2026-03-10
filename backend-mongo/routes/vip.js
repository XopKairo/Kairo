import express from "express";
const router = express.Router();
import { protectUser } from "../middleware/authMiddleware.js";
import VipPackage from "../models/VipPackage.js";
import ScratchCard from "../models/ScratchCard.js";
import User from "../models/User.js";

// @desc    Get all active VIP packages
router.get("/packages", async (req, res) => {
  try {
    const packages = await VipPackage.find({ isActive: true });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Buy VIP Package
router.post("/buy-vip", protectUser, async (req, res) => {
  try {
    const { packageId } = req.body;
    const userId = req.user._id;

    const pkg = await VipPackage.findById(packageId);
    if (!pkg) return res.status(404).json({ message: "Package not found" });

    const user = await User.findById(userId);
    // Logic: If user has enough coins (Assume coins used for VIP or direct INR)
    // Here we assume a transaction was already completed via Razorpay/Cashfree
    
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + pkg.durationDays);

    user.isVip = true;
    user.vipLevel = pkg.name; // e.g., Gold
    user.vipExpiry = expiry;
    await user.save();

    res.json({ success: true, message: `VIP ${pkg.name} activated until ${expiry.toDateString()}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get User's Scratch Cards
router.get("/scratch-cards", protectUser, async (req, res) => {
  try {
    const cards = await ScratchCard.find({ userId: req.user._id, isScratched: false, expiryDate: { $gt: new Date() } });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Scratch a card
router.post("/scratch", protectUser, async (req, res) => {
  try {
    const { cardId } = req.body;
    const card = await ScratchCard.findOne({ _id: cardId, userId: req.user._id, isScratched: false });

    if (!card) return res.status(404).json({ message: "Valid scratch card not found" });

    card.isScratched = true;
    await card.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { coins: card.rewardCoins } });

    res.json({ success: true, reward: card.rewardCoins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
