import express from "express";
const router = express.Router();
import Host from "../models/Host.js";
import User from "../models/User.js";

// GET all hosts
router.get("/", async (req, res) => {
  try {
    const { targetGender, userId } = req.query;
    let query = {};
    
    // Only show active hosts
    query.status = { $in: ["Online", "Busy"] };

    if (targetGender) {
      query.gender = targetGender;
    }

    // Exclude blocked users if userId is provided
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.blockedUsers && user.blockedUsers.length > 0) {
        query._id = { $nin: user.blockedUsers };
      }
    }

    // Additional tab filters can be added here if needed
    // e.g. if (tabFilter === 'New') query.createdAt = { $gte: ... }

    const hosts = await Host.find(query)
      .sort({ isBoosted: -1, rankingScore: -1, createdAt: -1 });
    res.json(hosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST to verify host
router.post("/:id/verify", async (req, res) => {
  try {
    const { isVerified } = req.body;
    const host = await Host.findByIdAndUpdate(
      req.params.id,
      { isVerified },
      { new: true },
    );
    if (!host) return res.status(404).json({ message: "Host not found" });
    res.json({ message: "Host verification status updated", host });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT to update host status (Online/Busy/Offline)
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const host = await Host.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    if (!host) return res.status(404).json({ message: "Host not found" });
    res.json({ message: "Host status updated", host });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT to update host details from admin panel
router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };
    const host = await Host.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!host) return res.status(404).json({ message: "Host not found" });
    
    // Sync with User model if needed
    if (host.userId) {
      const userUpdate = {};
      if (updateData.name) userUpdate.name = updateData.name;
      if (updateData.profilePicture) userUpdate.profilePicture = updateData.profilePicture;
      if (updateData.languages) userUpdate.languages = updateData.languages;
      if (updateData.gender) userUpdate.gender = updateData.gender;
      if (updateData.callRatePerMinute) userUpdate.callRatePerMinute = updateData.callRatePerMinute;
      
      if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(host.userId, userUpdate);
      }
    }
    
    res.json({ success: true, host });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE to remove host
router.delete("/:id", async (req, res) => {
  try {
    const host = await Host.findByIdAndDelete(req.params.id);
    if (!host) return res.status(404).json({ message: "Host not found" });
    res.json({ message: "Host rejected and removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
