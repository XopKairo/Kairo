const express = require('express');
const router = express.Router();
const CoinPackage = require('../models/CoinPackage');
const Gift = require('../models/Gift');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads (Gifts)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/gifts/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// --- Coin Packages ---
router.get('/coins', async (req, res) => {
  res.json(await CoinPackage.find({}));
});

router.post('/coins', async (req, res) => {
  const { coins, priceINR, icon, isActive } = req.body;
  const pkg = await CoinPackage.create({ coins, priceINR, icon, isActive });
  res.json(pkg);
});

router.put('/coins/:id', async (req, res) => {
  const pkg = await CoinPackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(pkg);
});

// --- Gifts ---
router.get('/gifts', async (req, res) => {
  res.json(await Gift.find({}));
});

// Upload custom icon support
router.post('/gifts', upload.single('icon'), async (req, res) => {
  const { name, coinCost, isActive } = req.body;
  const iconUrl = req.file ? `/uploads/gifts/${req.file.filename}` : '';
  const gift = await Gift.create({ name, coinCost, iconUrl, isActive });
  res.json(gift);
});

router.put('/gifts/:id', upload.single('icon'), async (req, res) => {
  const updateData = { ...req.body };
  if (req.file) updateData.iconUrl = `/uploads/gifts/${req.file.filename}`;
  const gift = await Gift.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(gift);
});

module.exports = router;
