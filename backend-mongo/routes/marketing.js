const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const multer = require('multer');
const path = require('path');

// Configure multer for banners
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/banners/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Get Banners
router.get('/banners', async (req, res) => {
  res.json(await Banner.find({}));
});

// Upload Banner
router.post('/banners', upload.single('image'), async (req, res) => {
  const { linkUrl, isActive } = req.body;
  const imageUrl = req.file ? `/uploads/banners/${req.file.filename}` : '';
  const banner = await Banner.create({ imageUrl, linkUrl, isActive });
  res.json(banner);
});

// Update/Toggle Banner
router.put('/banners/:id', async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(banner);
});

module.exports = router;
