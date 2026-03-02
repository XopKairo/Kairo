const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Helper to generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Nodemailer Transporter Configuration (Using Project Specific Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'noobjocker8@gmail.com',
    pass: process.env.EMAIL_PASS
  }
});

// Login via Username
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password required' });

    const admin = await Admin.findOne({ username });
    if (admin && (await admin.matchPassword(password))) {
      const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
      res.json({ success: true, token, username: admin.username, email: admin.email, phone: admin.phone, _id: admin._id });
    } else {
      res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Forgot Password - Send OTP to Email or Phone
router.post('/forgot-password', async (req, res) => {
  const { identifier } = req.body; // Can be email or phone
  try {
    if (!identifier) return res.status(400).json({ success: false, message: 'Email or phone required' });

    const admin = await Admin.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    const otp = generateOTP();
    admin.resetPasswordOTP = otp;
    admin.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await admin.save();

    console.log(`[ADMIN OTP] Sent to ${identifier}: ${otp}`);

    if (identifier.includes('@')) {
      const mailOptions = {
        from: `"Zora Admin" <${process.env.EMAIL_USER || 'omalloorajil@gmail.com'}>`,
        to: identifier,
        subject: 'Zora Admin - Password Reset OTP',
        html: `<h3>OTP: ${otp}</h3><p>Valid for 10 minutes.</p>`
      };
      await transporter.sendMail(mailOptions);
      return res.json({ success: true, message: 'OTP sent to email' });
    }

    return res.json({ success: true, message: 'OTP generated for phone (check logs)', otp: process.env.NODE_ENV === 'development' ? otp : undefined });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify OTP & Update Email/Phone/Password
router.post('/verify-and-update', async (req, res) => {
  const { identifier, otp, newEmail, newPhone, newPassword } = req.body;
  try {
    const admin = await Admin.findOne({ 
      $or: [{ email: identifier }, { phone: identifier }],
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!admin) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    if (newEmail) admin.email = newEmail;
    if (newPhone) admin.phone = newPhone;
    if (newPassword) admin.password = newPassword;

    admin.resetPasswordOTP = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET Admin Profile
router.get('/profile', async (req, res) => {
  try {
    const admin = await Admin.findOne({}).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Update Admin Profile Settings (DND, Notifications)
router.post('/profile/settings', async (req, res) => {
  try {
    const admin = await Admin.findOneAndUpdate({}, req.body, { new: true });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Update Admin Account (Username, Email, etc)
router.post('/account/update', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    const updateData = { username, email, phone };
    if (password) {
       // Manual hashing or let the pre-save hook handle it if it's an instance
       const admin = await Admin.findOne({});
       admin.username = username || admin.username;
       admin.email = email || admin.email;
       admin.phone = phone || admin.phone;
       if (password) admin.password = password;
       await admin.save();
       return res.json({ success: true, message: 'Account updated' });
    }
    const admin = await Admin.findOneAndUpdate({}, updateData, { new: true });
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
