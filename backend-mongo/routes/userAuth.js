const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getUserBadge } = require('../utils/badgeSystem');

// In-memory store for OTPs
const otpStore = new Map();

// Send OTP
router.post('/send-otp', async (req, res) => {
  const { contact } = req.body; 
  if (!contact) return res.status(400).json({ success: false, message: 'Contact info required' });
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(contact, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
  
  console.log(`[LIVE OTP] Sent to ${contact}: ${otp}`);
  res.json({ success: true, message: 'OTP sent successfully (Check server logs)', otp });
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

  // Generate a temporary OTP Verification Token (valid for 15 minutes)
  const otpVerifiedToken = jwt.sign(
    { contact, verified: true }, 
    process.env.JWT_SECRET || 'secret_key', 
    { expiresIn: '15m' }
  );

  res.json({ success: true, message: 'OTP verified', otp_verified_token: otpVerifiedToken });
});

// User Registration (Protected by OTP Token)
router.post('/register', async (req, res) => {
  const { name, email, phone, password, otp_verified_token } = req.body;
  
  if (!otp_verified_token) {
     return res.status(403).json({ success: false, message: 'Unauthorized: OTP verification token missing' });
  }

  try {
    // Verify the temporary token to prevent backdoor registration
    const decoded = jwt.verify(otp_verified_token, process.env.JWT_SECRET || 'secret_key');
    const registeredContact = email || phone;
    
    if (decoded.contact !== registeredContact || !decoded.verified) {
        return res.status(403).json({ success: false, message: 'Unauthorized: OTP verification mismatch' });
    }

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone required' });
    }
    
    const query = [];
    if (email) query.push({ email });
    if (phone) query.push({ phone });
    const userExists = await User.findOne({ $or: query });
    
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    const userData = { name, password, lastLoginDate: new Date(), zoraPoints: 5 };
    if (email) userData.email = email;
    if (phone) userData.phone = phone;

    const user = await User.create(userData);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });
    const badge = getUserBadge(user.zoraPoints);
    
    res.status(201).json({ 
      success: true, 
      token, 
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, coins: user.coins, zoraPoints: user.zoraPoints, badge } 
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
       return res.status(403).json({ success: false, message: 'OTP token invalid or expired. Please verify OTP again.' });
    }
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

      const today = new Date().setHours(0, 0, 0, 0);
      const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate).setHours(0, 0, 0, 0) : 0;
      
      let pointsAwarded = false;
      if (today > lastLogin || !user.lastLoginDate) {
        user.zoraPoints += 5; 
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

// Forgot Password
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
