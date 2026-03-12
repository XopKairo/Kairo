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

// ADMIN ROUTES
router.put("/:id", async (req, res) => {
  try {
    const host = await Host.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!host) return res.status(404).json({ message: "Host not found" });
    res.json(host);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/verify", async (req, res) => {
  try {
    const { isVerified } = req.body;
    const host = await Host.findByIdAndUpdate(req.params.id, { isVerified }, { new: true });
    if (!host) return res.status(404).json({ message: "Host not found" });
    res.json({ success: true, host });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/ban", async (req, res) => {
  const { isBanned, reason, durationDays, customDate } = req.body;
  try {
    const host = await Host.findById(req.params.id);
    if (!host) return res.status(404).json({ message: "Host not found" });
    
    // Update the Host model
    host.isBanned = isBanned;
    await host.save();

    // Update the underlying User model
    const update = { isBanned, banReason: reason || "" };
    if (isBanned && durationDays === "custom" && customDate) {
      update.banUntil = new Date(customDate);
    } else if (isBanned && durationDays && durationDays !== "permanent") {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(durationDays));
      update.banUntil = date;
    } else if (!isBanned) {
      update.banUntil = null;
    } else {
      update.banUntil = new Date("9999-12-31");
    }
    
    const user = await User.findByIdAndUpdate(host.userId, update, { new: true });

    // Notify user via Socket
    if (isBanned && req.io && user) {
      req.io.to(`user-${user._id}`).emit("userBanned", { reason: user.banReason });
    }

    res.json({ success: true, host, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const host = await Host.findByIdAndDelete(req.params.id);
    if (!host) return res.status(404).json({ message: "Host not found" });
    // Note: We are not deleting the underlying User account here, just the Host profile.
    // To delete the user completely, the Admin must use the Users tab.
    await User.findByIdAndUpdate(host.userId, { isHost: false });
    res.json({ success: true, message: "Host deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
