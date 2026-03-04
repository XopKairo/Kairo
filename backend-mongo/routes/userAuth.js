import express from 'express';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import jwt from 'jsonwebtoken';
import { getUserBadge } from '../utils/badgeSystem.js';
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import Post from '../models/Post.js'; // Moved to top level
import { 
  registerSchema, 
  loginSchema, 
  verifyOTPSchema, 
  validateRequest 
} from '../utils/validation.js';

const router = express.Router();

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) 
  : null;

// Send OTP - Strict async/await, direct res.json
router.post('/send-otp', async (req, res) => {
  const { contact } = req.body; 
  if (!contact) return res.status(400).json({ success: false, message: 'Contact info required' });
  
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    await OTP.findOneAndUpdate(
      { contact },
      { otp, expiresAt },
      { upsert: true, new: true }
    );
    
    console.log(`[LIVE OTP] Sent to ${contact}: ${otp}`);

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
        return res.status(200).json({ success: true, message: 'OTP sent via SMS' });
      } catch (error) {
        console.error('[Twilio Error]', error.message);
        return res.status(500).json({ success: false, message: `SMS Error: ${error.message}` });
      }
    }

    if (contact.includes('@')) {
       const transporter = nodemailer.createTransport({
         service: 'gmail',
         auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
       });

       try {
         await Promise.race([
           transporter.sendMail({
             from: `"Zora Support" <${process.env.EMAIL_USER}>`,
             to: contact,
             subject: "Zora Verification Code",
             text: `Your Zora verification code is: ${otp}. Valid for 10 minutes.`
           }),
           new Promise((_, reject) => setTimeout(() => reject(new Error('Email Timeout')), 20000))
         ]);
         return res.status(200).json({ success: true, message: 'OTP sent to email' });
       } catch (error) {
         return res.status(500).json({ success: false, message: `Email Error: ${error.message}` });
       }
    }

    return res.status(200).json({ success: true, message: 'OTP generated (Dev Mode)', otp: process.env.NODE_ENV === 'development' ? otp : undefined });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Verify OTP - Direct res.json
router.post('/verify-otp', validateRequest(verifyOTPSchema), async (req, res) => {
  const { contact, otp } = req.body;

  try {
    const storedOtpData = await OTP.findOne({ contact });
    
    if (!storedOtpData) return res.status(400).json({ success: false, message: 'OTP not requested or expired' });
    
    if (Date.now() > new Date(storedOtpData.expiresAt).getTime()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    
    if (storedOtpData.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    
    const otpVerifiedToken = jwt.sign(
      { contact, verified: true }, 
      process.env.JWT_SECRET, 
      { expiresIn: '15m' }
    );

    return res.status(200).json({ success: true, message: 'OTP Verified', otp_verified_token: otpVerifiedToken });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// User Registration - OTP deletion only on success
router.post('/register', validateRequest(registerSchema), async (req, res) => {
  const { name, email, phone, password, otp_verified_token } = req.body;
  
  // Beta Mode Check
  if (process.env.APP_MODE === 'beta') {
    const whitelist = (process.env.BETA_WHITELIST || '').split(',').map(i => i.trim());
    const isWhitelisted = whitelist.includes(email) || whitelist.includes(phone);
    
    if (!isWhitelisted) {
      return res.status(403).json({ 
        success: false, 
        message: 'Registration is currently limited to beta testers. Please contact support.' 
      });
    }
  }

  if (!otp_verified_token) return res.status(403).json({ success: false, message: 'OTP verification token missing' });

  try {
    const decoded = jwt.verify(otp_verified_token, process.env.JWT_SECRET);
    const registeredContact = (email || phone).toString().trim();
    const decodedContact = decoded.contact.toString().trim();

    if (decodedContact !== registeredContact || !decoded.verified) {
        return res.status(403).json({ success: false, message: 'OTP verification mismatch' });
    }

    const query = [];
    if (email) query.push({ email: email.trim() });
    if (phone) query.push({ phone: phone.trim() });
    const userExists = await User.findOne({ $or: query });
    if (userExists) return res.status(400).json({ success: false, message: 'User already exists' });
    
    const user = await User.create({ 
      name: name.trim(), 
      password, 
      email: email ? email.trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      lastLoginDate: new Date(), 
      zoraPoints: 5,
      coins: 0
    });

    // Persistent OTP is only deleted AFTER successful registration
    await OTP.deleteOne({ contact: decodedContact });

    const expiry = process.env.USER_JWT_EXPIRY || '30d';
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: expiry });
    const badge = getUserBadge(user.zoraPoints);
    
    return res.status(201).json({ 
      success: true, 
      token, 
      otp_verified_token: otp_verified_token || undefined,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, coins: user.coins, zoraPoints: user.zoraPoints, badge } 
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
       return res.status(403).json({ success: false, message: 'OTP token invalid or expired' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
});

// User Login - Direct res.json
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  const { contact, password } = req.body;
  try {
    const user = await User.findOne({ $or: [{ email: contact }, { phone: contact }] });
    
    if (user && (await user.matchPassword(password))) {
      if (user.isBanned) return res.status(403).json({ success: false, message: 'Account is banned' });

      const today = new Date().setHours(0, 0, 0, 0);
      const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate).setHours(0, 0, 0, 0) : 0;
      
      if (today > lastLogin || !user.lastLoginDate) {
        user.zoraPoints += 5; 
        user.lastLoginDate = new Date();
        await user.save();
      }

      const badge = getUserBadge(user.zoraPoints);
      const expiry = process.env.USER_JWT_EXPIRY || '30d';
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: expiry });
      
      return res.status(200).json({ 
        success: true, 
        token, 
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, coins: user.coins, zoraPoints: user.zoraPoints, badge } 
      });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Account
router.delete('/delete-account/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Clean up related data if necessary (posts, etc.)
    await Post.deleteMany({ userId: req.params.id });

    return res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
