import express from "express";
const router = express.Router();
import Host from "../models/Host.js";
import User from "../models/User.js";
import { protectUser } from "../middleware/authMiddleware.js";

// GET all hosts with real filtering (Nearby, Gender, Tab-based)
router.get("/", async (req, res) => {
  try {
    const { targetGender, tabFilter, userId } = req.query;
    let query = { isVerified: true };

    if (targetGender) query.gender = targetGender;

    // 1. Real Nearby Logic: Filter by User District
    if (tabFilter === "Nearby" && userId) {
      const user = await User.findById(userId);
      if (user && user.district) {
        query.district = user.district; 
      }
    }

    // 2. Tab Specific Sorting
    let sort = { isBoosted: -1, rankingScore: -1, createdAt: -1 };
    if (tabFilter === "New") sort = { createdAt: -1 };

    const hosts = await Host.find(query).sort(sort).limit(50);
    res.json(hosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST Interaction (Like/Pass) to update Ranking Score
router.post("/interaction", protectUser, async (req, res) => {
  try {
    const { hostId, action } = req.body; // action: "like" or "pass"
    const increment = action === "like" ? 5 : -1;

    await Host.findByIdAndUpdate(hostId, { $inc: { rankingScore: increment } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
