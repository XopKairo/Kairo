import express from "express";
import Report from "../models/Report.js";
import { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all reports
router.get("/", async (req, res) => {
  try {
    const reports = await Report.find({});
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Report Action (BAN/DISMISS)
router.post("/action", async (req, res) => {
  try {
    const { reportId, action, reason } = req.body;
    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (action === "BAN") {
      const User = mongoose.model("User");
      await User.findByIdAndUpdate(report.reportedId, { 
        isBanned: true, 
        banReason: reason || "Reported by multiple users",
        banUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
      });
      report.status = "Action Taken";
    } else {
      report.status = "Resolved";
    }

    await report.save();
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE a new report (User only)
router.post("/", protectUser, async (req, res) => {
  try {
    const { reportedId, reason } = req.body;
    const report = await Report.create({
      reporterId: req.user._id,
      reportedId,
      reason,
      status: "Pending",
    });
    res.status(201).json({ success: true, report });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update report status
router.put("/:id", async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );
    res.json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
