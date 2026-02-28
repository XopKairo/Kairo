const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Helper to generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Nodemailer Transporter Configuration (Using Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'omalloorajil@gmail.com',
    pass: process.env.EMAIL_PASS
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (admin && (await admin.matchPassword(password))) {
      const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
      res.json({ success: true, token, email: admin.email, _id: admin._id });
    } else {
      res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found with this email' });
    }

    const otp = generateOTP();
    admin.resetPasswordOTP = otp;
    admin.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await admin.save();

    // Sending real email
    const mailOptions = {
      from: `"Kairo Admin" <${process.env.EMAIL_USER || 'omalloorajil@gmail.com'}>`,
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px; margin: auto;">
          <h2 style="color: #4A90E2; text-align: center;">Kairo Admin</h2>
          <p>Hi Admin,</p>
          <p>You requested to reset your password. Use the following OTP to continue:</p>
          <div style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 5px; text-align: center; padding: 20px; background: #f9f9f9; border: 1px dashed #4A90E2; border-radius: 5px;">
            ${otp}
          </div>
          <p style="margin-top: 20px; color: #666; font-size: 14px;">This OTP will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="text-align: center; color: #999; font-size: 12px;">© 2026 Kairo. All rights reserved.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`OTP sent to ${email}`);
      res.json({ success: true, message: 'OTP sent to your email successfully' }); 
    } catch (mailError) {
      console.error('Email Send Error:', mailError);
      res.status(500).json({ success: false, message: 'Failed to send email. Check SMTP credentials.' });
    }
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const admin = await Admin.findOne({ 
      email, 
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const admin = await Admin.findOne({ 
      email, 
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    admin.password = newPassword; 
    admin.resetPasswordOTP = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
