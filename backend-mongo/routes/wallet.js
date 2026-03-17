import express from "express";
const router = express.Router();
import { protectUser } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Settings from "../models/Settings.js";
import walletController from "../controllers/walletController.js";

// Secure Ad Reward Sync
router.post("/ad-reward", protectUser, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.isHost) {
      return res.status(400).json({ success: false, message: "Hosts cannot earn coins by watching ads." });
    }

    const settings = await Settings.findOne() || { rewardPerAd: 5, dailyLimit: 10 };

    // Check daily limit
    const today = new Date().setHours(0, 0, 0, 0);
    const lastAdDate = user.lastAdWatchedAt ? new Date(user.lastAdWatchedAt).setHours(0, 0, 0, 0) : 0;

    if (today > lastAdDate) {
      user.dailyAdsWatched = 0;
    }

    if (user.dailyAdsWatched >= settings.dailyLimit) {
      return res.status(400).json({ success: false, message: "Daily ad limit reached" });
    }

    user.coins += settings.rewardPerAd;
    user.dailyAdsWatched += 1;
    user.lastAdWatchedAt = new Date();
    await user.save();

    res.json({ success: true, newBalance: user.coins, message: `Rewarded ${settings.rewardPerAd} coins` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Withdrawal Request
router.post("/withdraw", protectUser, walletController.withdraw);

// History Endpoint
router.get("/history", protectUser, walletController.getHistory);

export default router;
