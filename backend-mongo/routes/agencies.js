import express from "express";
const router = express.Router();
import { protectAdmin } from "../middleware/authMiddleware.js";
import Agency from "../models/Agency.js";
import Host from "../models/Host.js";

// @desc    Get all agencies
router.get("/", protectAdmin, async (req, res) => {
  try {
    const agencies = await Agency.find({}).sort({ createdAt: -1 });
    res.json(agencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new agency
router.post("/", protectAdmin, async (req, res) => {
  try {
    const { name, ownerName, phone, password, commissionPercentage } = req.body;
    const agency = await Agency.create({ name, ownerName, phone, password, commissionPercentage });
    res.status(201).json(agency);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Assign Host to Agency
router.post("/assign-host", protectAdmin, async (req, res) => {
  try {
    const { hostId, agencyId } = req.body;
    const host = await Host.findByIdAndUpdate(hostId, { agencyId }, { new: true });
    await Agency.findByIdAndUpdate(agencyId, { $inc: { totalHosts: 1 } });
    res.json({ success: true, host });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update agency details (e.g., Commission %)
router.put("/:id", protectAdmin, async (req, res) => {
  try {
    const { name, ownerName, phone, commissionPercentage, isActive } = req.body;
    const agency = await Agency.findByIdAndUpdate(
      req.params.id,
      { name, ownerName, phone, commissionPercentage, isActive },
      { new: true }
    );
    if (!agency) return res.status(404).json({ message: "Agency not found" });
    res.json(agency);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete agency (Deactivate hosts before delete)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency) return res.status(404).json({ message: "Agency not found" });
    
    // Remove agency reference from hosts
    await Host.updateMany({ agencyId: req.params.id }, { agencyId: null });
    
    await Agency.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Agency deleted and hosts unassigned." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
