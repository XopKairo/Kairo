import express from "express";
import Settings from "../models/Settings.js";

const router = express.Router();

// Get All Settings
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Alias for /app to satisfy Admin Panel
router.get("/app", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update All Settings
router.put("/", async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Alias POST for /app
router.post("/app", async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET Ad Settings specifically
router.get("/ads", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({
      enableAds: settings.enableAds || false,
      rewardPerAd: settings.rewardPerAd || 0,
      dailyLimit: settings.dailyLimit || 0,
      adMobId: settings.adMobId || "",
      interstitialId: settings.interstitialId || "",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST/Update Ad Settings
router.post("/ads", async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
