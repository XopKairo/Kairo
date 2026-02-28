const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// Get All Settings
router.get('/', async (req, res) => {
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

// Update All Settings
router.put('/', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET Ad Settings specifically
router.get('/ads', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({
      enableAds: settings.enableAds || false,
      rewardPerAd: settings.rewardPerAd || 0,
      dailyLimit: settings.dailyLimit || 0,
      adMobId: settings.adMobId || '',
      interstitialId: settings.interstitialId || ''
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST/Update Ad Settings
router.post('/ads', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
