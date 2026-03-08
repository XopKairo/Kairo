import express from "express";
import growthController from "../controllers/growthController.js";
import { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protectUser);

// Claim Daily Reward
router.post("/daily-claim", growthController.claimDailyReward);

// Get Leaderboards
router.get("/leaderboard", growthController.getLeaderboards);

// Get Growth Stats
router.get("/stats", growthController.getReferralStats);

export default router;
