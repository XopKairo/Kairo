import express from "express";
const router = express.Router();
import Host from "../models/Host.js";
import User from "../models/User.js";

// GET all hosts (Admin and App)
router.get("/", async (req, res) => {
  try {
    const hosts = await Host.find({ isVerified: true }).sort({ isBoosted: -1, rankingScore: -1, createdAt: -1 });
    res.json(hosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST to verify/unverify host (Admin)
router.post("/:id/verify", async (req, res) => {
  try {
    const { isVerified } = req.body;
    const hostId = req.params.id;

    const host = await Host.findById(hostId);
    if (!host) return res.status(404).json({ message: "Host record not found" });

    if (isVerified) {
      // Already handled during verification approval usually, but here for direct toggle
      await Host.findByIdAndUpdate(hostId, { isVerified: true });
      await User.findOneAndUpdate({ phone: host.phone }, { isHost: true, isVerified: true });
    } else {
      // UNVERIFY: Revert to normal user
      await User.findOneAndUpdate({ phone: host.phone }, { isHost: false, isVerified: false });
      await Host.findByIdAndDelete(hostId);
    }

    res.json({ success: true, message: isVerified ? "Host verified" : "Host unverified and reverted to normal user" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update host details
router.put("/:id", async (req, res) => {
  try {
    const host = await Host.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, host });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
