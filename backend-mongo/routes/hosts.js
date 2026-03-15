import express from "express";
const router = express.Router();
import Host from "../models/Host.js";
import User from "../models/User.js";
import { protectUser, protectAdmin } from "../middleware/authMiddleware.js";

// GET all hosts with real filtering (Nearby, Gender, Tab-based)
router.get("/", async (req, res) => {
  try {
    const { targetGender, tabFilter, userId } = req.query;
    
    // Default query: exclude deleted and unverified for public
    let query = { isDeleted: false, isVerified: true };

    if (targetGender) query.gender = targetGender;

    // 1. Follow Logic: Only show hosts user follows
    if (tabFilter === "Follow" && userId) {
      const user = await User.findById(userId);
      if (user && user.favoriteHosts && user.favoriteHosts.length > 0) {
        query.userId = { $in: user.favoriteHosts };
      } else {
        return res.json([]); // Return empty if following no one
      }
    }

    // 2. Real Nearby Logic: Filter by User District
    if (tabFilter === "Nearby" && userId) {
      const user = await User.findById(userId);
      if (user && user.district) {
        query.district = user.district; 
      } else {
        // Fallback: Show all if user has no district set
      }
    }

    // 3. Tab Specific Sorting
    let sort = { isBoosted: -1, rankingScore: -1, createdAt: -1 };
    if (tabFilter === "New") sort = { createdAt: -1 };

    const hosts = await Host.find(query).sort(sort).limit(50).populate("userId", "phone name profilePicture");
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

// GET single host by ID
router.get("/:id", async (req, res) => {
  try {
    // Attempt to find by Host ID first
    let host = await Host.findById(req.params.id).populate("userId", "phone name profilePicture");
    
    // If not found, attempt to find by User ID (in case frontend passed userId by mistake)
    if (!host) {
      host = await Host.findOne({ userId: req.params.id }).populate("userId", "phone name profilePicture");
    }

    if (!host) return res.status(404).json({ message: "Host not found" });
    res.json(host);
  } catch (error) {
    // If the ID is completely invalid format, catch it here and try fallback or return 404
    try {
      const hostByUser = await Host.findOne({ userId: req.params.id }).populate("userId", "phone name profilePicture");
      if (hostByUser) return res.json(hostByUser);
    } catch(e) {}
    res.status(404).json({ message: "Host not found" });
  }
});

// ADMIN ROUTES (Supreme Control)
router.put("/:id", protectAdmin, async (req, res) => {
  try {
    const { name, callRatePerMinute, isBoosted, rankingScore, gender, agencyId } = req.body;
    
    const host = await Host.findByIdAndUpdate(
      req.params.id, 
      { name, callRatePerMinute, isBoosted, rankingScore, gender, agencyId }, 
      { new: true }
    );
    
    if (!host) return res.status(404).json({ message: "Host not found" });
    res.json(host);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/verify", protectAdmin, async (req, res) => {
  try {
    const { isVerified } = req.body;
    const host = await Host.findByIdAndUpdate(req.params.id, { isVerified }, { new: true });
    if (!host) return res.status(404).json({ message: "Host not found" });
    
    // Sync verification status to User model
    await User.findByIdAndUpdate(host.userId, { isVerified, isHost: true });
    
    res.json({ success: true, host });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/ban", protectAdmin, async (req, res) => {
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

    res.json({ success: true, host, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const host = await Host.findByIdAndDelete(req.params.id);
    if (!host) return res.status(404).json({ message: "Host not found" });
    // Note: We are not deleting the underlying User account here, just the Host profile.
    await User.findByIdAndUpdate(host.userId, { isHost: false });
    res.json({ success: true, message: "Host deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
