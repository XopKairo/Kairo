const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getUserBadge } = require('../utils/badgeSystem');
const twilio = require('twilio');

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) 
  : null;

// In-memory store for OTPs
const otpStore = new Map();

// Send OTP
router.post('/send-otp', async (req, res) => {
  const { contact } = req.body; 
  if (!contact) return res.status(400).json({ success: false, message: 'Contact info required' });
  
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(contact, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    
    console.log(`[LIVE OTP] Sent to ${contact}: ${otp}`);

    // Try to send real SMS via Twilio if configured
    if (twilioClient && contact.startsWith('+')) {
      try {
        await Promise.race([
          twilioClient.messages.create({
            body: `Your Zora verification code is: ${otp}. Valid for 10 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: contact
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Twilio Timeout')), 10000))
        ]);
        console.log(`[Twilio] SMS sent successfully to ${contact}`);
        return res.json({ success: true, message: 'OTP sent to your phone via SMS' });
      } catch (error) {
        console.error('[Twilio Error]', error.message);
        return res.status(500).json({ success: false, message: `SMS Error: ${error.message}` });
      }
    }

    // If email
    if (contact && contact.includes('@')) {
       if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
          return res.status(500).json({ success: false, message: 'Email configuration missing on server' });
       }

       const nodemailer = require('nodemailer');
       const transporter = nodemailer.createTransport({
         service: 'gmail',
         auth: {
           user: process.env.EMAIL_USER,
           pass: process.env.EMAIL_PASS
         }
       });

       try {
         await Promise.race([
           transporter.sendMail({
             from: `"Zora Support" <${process.env.EMAIL_USER}>`,
             to: contact,
             subject: "Zora Verification Code",
             text: `Your Zora verification code is: ${otp}. Valid for 10 minutes.`
           }),
           new Promise((_, reject) => setTimeout(() => reject(new Error('Email Timeout (20s)')), 20000))
         ]);
         console.log(`[Email] OTP sent successfully to ${contact}`);
         return res.json({ success: true, message: 'OTP sent to your email' });
       } catch (error) {
         console.error('[Email Error]', error.message);
         return res.status(500).json({ success: false, message: `Email Error: ${error.message}` });
       }
    }

    res.json({ success: true, message: 'OTP generated (SMS/Email gateway not fully configured)', otp: process.env.NODE_ENV === 'development' ? otp : undefined });
  } catch (error) {
    console.error('Send OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Verify OTP - Standard Route Handler (No next parameter)
router.post('/verify-otp', async (req, res) => {
  const { contact, otp } = req.body;

  try {
    const storedOtpData = otpStore.get(contact);
    
    if (!storedOtpData) return res.status(400).json({ success: false, message: 'OTP not requested or expired' });
    if (Date.now() > storedOtpData.expiresAt) {
      otpStore.delete(contact);
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    if (storedOtpData.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    
    otpStore.delete(contact);

    const otpVerifiedToken = jwt.sign(
      { contact, verified: true }, 
      process.env.JWT_SECRET || 'secret_key', 
      { expiresIn: '15m' }
    );

    return res.status(200).json({ success: true, message: 'OTP Verified', otp_verified_token: otpVerifiedToken });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// User Registration - Standard Route Handler (No next parameter)
router.post('/register', async (req, res) => {
  const { name, email, phone, password, otp_verified_token } = req.body;
  
  if (!otp_verified_token) {
     return res.status(403).json({ success: false, message: 'Unauthorized: OTP verification token missing' });
  }

  try {
    const decoded = jwt.verify(otp_verified_token, process.env.JWT_SECRET || 'secret_key');
    const registeredContact = (email || phone).toString().trim();
    const decodedContact = decoded.contact.toString().trim();

    if (decodedContact !== registeredContact || !decoded.verified) {
        return res.status(403).json({ success: false, message: 'Unauthorized: OTP verification mismatch' });
    }

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone required' });
    }
    
    const query = [];
    if (email) query.push({ email: email.trim() });
    if (phone) query.push({ phone: phone.trim() });
    const userExists = await User.findOne({ $or: query });
    
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    const userData = { 
      name: name.trim(), 
      password, 
      gender: req.body.gender || 'Male',
      verificationSelfie: req.body.verificationSelfie || '',
      lastLoginDate: new Date(), 
      zoraPoints: 5,
      coins: 0
    };
    if (email) userData.email = email.trim();
    if (phone) userData.phone = phone.trim();

    const user = await User.create(userData);

    if (userData.gender === 'Female' && userData.verificationSelfie) {
      const VerificationRequest = require('../models/VerificationRequest');
      await VerificationRequest.create({
        userId: user._id,
        photoUrl: userData.verificationSelfie,
        idUrl: 'Selfie Verification',
        status: 'pending'
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });
    const badge = getUserBadge(user.zoraPoints);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Registration successful',
      token, 
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, coins: user.coins, zoraPoints: user.zoraPoints, badge } 
    });
  } catch (error) {
    console.error('Registration Error:', error);
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
       return res.status(403).json({ success: false, message: 'OTP token invalid or expired. Please verify OTP again.' });
    }
    return res.status(500).json({ success: false, message: error.message });
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
      
      return res.status(200).json({ 
        success: true, 
        token, 
        pointsAwarded,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, coins: user.coins, zoraPoints: user.zoraPoints, badge } 
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
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
    
    return res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
