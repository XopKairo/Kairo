import express from 'express';
import User from '../models/User.js';
import redisClient from '../config/redis.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// Cloudinary Configuration (Assumption: ENV is set)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kairo_profiles',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, password, gender } = req.body;
    const user = await User.create({ name, email, phone, password, gender });
    res.status(201).json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Profile Update with Image Upload
router.put('/:id/profile', upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.profilePicture = req.file.path; // Cloudinary URL
      updateData.verificationSelfie = req.file.path; // Also update selfie if uploaded here
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    // Invalidate Cache
    await redisClient.del(`user_status:${req.params.id}`);
    
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Generic Admin Update
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await redisClient.del(`user_status:${req.params.id}`);
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/:id/ban', async (req, res) => {
  const { isBanned, reason, durationDays } = req.body;
  try {
    const update = { isBanned, banReason: reason || '' };
    if (isBanned && durationDays && durationDays !== 'permanent') {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(durationDays));
      update.banUntil = date;
    } else if (!isBanned) {
      update.banUntil = null;
    } else {
      update.banUntil = new Date('9999-12-31');
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    await redisClient.del(`user_status:${req.params.id}`);
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await redisClient.del(`user_status:${req.params.id}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
