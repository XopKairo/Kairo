import express from "express";
const router = express.Router();
import Host from "../models/Host.js";

// GET all hosts
router.get("/", async (req, res) => {
  try {
    const hosts = await Host.find({});
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
