const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getUserBadge } = require('../utils/badgeSystem');
const bcrypt = require('bcryptjs');

// In-memory store for OTPs (For dev/demo purposes)
const otpStore = new Map();

// Send OTP
router.post('/send-otp', async (req, res) => {
  const { contact } = req.body; // contact can be email or phone
  if (!contact) return res.status(400).json({ success: false, message: 'Contact info required' });
  
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(contact, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 minutes expiry
  
  // In a real app, send this OTP via SMS (Twilio) or Email (Nodemailer)
  console.log(`[LIVE OTP] Sent to ${contact}: ${otp}`);
  
  res.json({ success: true, message: 'OTP sent successfully (Check server logs for now)', otp }); // Sending OTP in response just for easy testing on mobile without real SMS
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { contact, otp } = req.body;
  const storedOtpData = otpStore.get(contact);
  
  if (!storedOtpData) return res.status(400).json({ success: false, message: 'OTP not requested or expired' });
  if (Date.now() > storedOtpData.expiresAt) {
    otpStore.delete(contact);
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }
  if (storedOtpData.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
  
  otpStore.delete(contact);
  res.json({ success: true, message: 'OTP verified' });
});

// User Registration
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone required' });
    }
    
    // Check if user exists
    const query = [];
    if (email) query.push({ email });
    if (phone) query.push({ phone });
    const userExists = await User.findOne({ $or: query });
    
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email or phone' });
    }
    
    const userData = { name, password, lastLoginDate: new Date(), zoraPoints: 5 };
    if (email) userData.email = email;
    if (phone) userData.phone = phone;

    const user = await User.create(userData); // 5 points for sign up
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });
    const badge = getUserBadge(user.zoraPoints);
    res.status(201).json({ 
      success: true, 
      token, 
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, coins: user.coins, zoraPoints: user.zoraPoints, badge } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// User Login
router.post('/login', async (req, res) => {
  const { contact, password } = req.body;
  try {
    const user = await User.findOne({ 
      $or: [{ email: contact }, { phone: contact }] 
    });
    
    if (user && (await user.matchPassword(password))) {
      if (user.isBanned) {
         return res.status(403).json({ success: false, message: 'Account is banned by admin' });
      }

      // Check daily login points
      const today = new Date().setHours(0, 0, 0, 0);
      const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate).setHours(0, 0, 0, 0) : 0;
      
      let pointsAwarded = false;
      if (today > lastLogin || !user.lastLoginDate) {
        user.zoraPoints += 5; // 5 points for daily login
        user.lastLoginDate = new Date();
        await user.save();
        pointsAwarded = true;
      }

      const badge = getUserBadge(user.zoraPoints);
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });
      
      res.json({ 
        success: true, 
        token, 
        pointsAwarded,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, coins: user.coins, zoraPoints: user.zoraPoints, badge } 
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Forgot Password -> Reset Password directly for now (via OTP verified previously)
router.post('/reset-password', async (req, res) => {
  const { contact, newPassword } = req.body;
  try {
    const user = await User.findOne({ $or: [{ email: contact }, { phone: contact }] });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
