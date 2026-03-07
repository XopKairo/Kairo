import express from 'express';
import User from '../models/User.js';
import redisClient from '../config/redis.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// Cloudinary Configuration
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

    // Build query to check duplicates only for provided values
    const query = [];
    if (email && email.trim() !== '') query.push({ email: email.trim() });
    if (phone && phone.trim() !== '') query.push({ phone: phone.trim() });

    if (query.length > 0) {
      const existing = await User.findOne({ $or: query });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email or Phone already exists' });
      }
    }

    const userData = { 
      name: name.trim(), 
      password, 
      gender: gender || 'Male' 
    };
    
    if (email && email.trim() !== '') userData.email = email.trim();
    if (phone && phone.trim() !== '') userData.phone = phone.trim();

    const user = await User.create(userData);
    res.status(201).json({ success: true, user });
  } catch (e) {
    console.error('Admin user creation error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
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
      updateData.profilePicture = req.file.path;
      updateData.verificationSelfie = req.file.path;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    await redisClient.del(`user_status:${req.params.id}`);
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Generic Admin Update
router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    // Prevent empty strings from causing unique index issues
    if (updateData.email === '') delete updateData.email;
    if (updateData.phone === '') delete updateData.phone;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
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
