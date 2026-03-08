import express from "express";
const router = express.Router();
import Agency from "../models/Agency.js";

// GET all agencies
router.get("/", async (req, res) => {
  try {
    const agencies = await Agency.find({}).sort("-createdAt");
    res.json(agencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new agency
router.post("/", async (req, res) => {
  try {
    const agency = await Agency.create(req.body);
    res.status(201).json(agency);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE an agency
router.delete("/:id", async (req, res) => {
  try {
    await Agency.findByIdAndDelete(req.params.id);
    res.json({ message: "Agency removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
