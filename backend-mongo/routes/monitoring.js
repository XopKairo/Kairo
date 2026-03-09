import express from "express";
import LiveCall from "../models/LiveCall.js";
import CallScreenshot from "../models/CallScreenshot.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// @desc    Store a screenshot during call
router.post("/screenshots", async (req, res) => {
  try {
    const screenshot = await CallScreenshot.create(req.body);
    // Basic nudity check simulation
    if (screenshot.imageUrl.includes("flagged") || (screenshot.confidenceScore && screenshot.confidenceScore > 0.8)) {
       screenshot.isFlagged = true;
       await screenshot.save();
       // In a real app, trigger call cut socket here
    }
    res.status(201).json(screenshot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get flagged screenshots for admin
router.get("/flagged-screenshots", protectAdmin, async (req, res) => {
  try {
    const flagged = await CallScreenshot.find({ isFlagged: true })
      .populate("hostId", "name")
      .populate("userId", "name")
      .sort("-createdAt");
    res.json(flagged);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all active calls (Admin Monitoring)
router.get("/active", async (req, res) => {
  try {
    const activeCalls = await LiveCall.find({ status: "Active" });
    res.json(activeCalls);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST force end a call (Admin action)
router.post("/force-end/:callId", async (req, res) => {
  try {
    const call = await LiveCall.findOneAndUpdate(
      { callId: req.params.callId },
      { status: "Ended", endedAt: Date.now() },
      { new: true },
    );
    if (!call) return res.status(404).json({ message: "Call not found" });

    // In a real scenario, you'd also emit a socket event to terminate the call on the client side
    if (req.io) {
      req.io.to(call.userId).emit("callForceEnded", { callId: call.callId });
      req.io.to(call.hostId).emit("callForceEnded", { callId: call.callId });
    }

    res.json({ message: "Call ended by admin", call });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export const logCallStart = async (data) => {
  try {
    const call = new LiveCall({
      callId: data.callId,
      userId: data.userId,
      hostId: data.hostId,
      status: "Active",
    });
    await call.save();
    return call;
  } catch (err) {
    console.error("Error logging call start:", err);
  }
};

export const logCallEnd = async (callId) => {
  try {
    await LiveCall.findOneAndUpdate(
      { callId },
      { status: "Ended", endedAt: Date.now() },
    );
  } catch (err) {
    console.error("Error logging call end:", err);
  }
};

export default router;
