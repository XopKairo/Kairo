import express from "express";
const router = express.Router();
import { protectUser } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Settings from "../models/Settings.js";
import walletController from "../controllers/walletController.js";

// Secure Ad Reward Sync
router.post("/ad-reward", protectUser, walletController.earnAd);

// Withdrawal Request
router.post("/withdraw", protectUser, walletController.withdraw);

// History Endpoint
router.get("/history", protectUser, walletController.getHistory);

export default router;
