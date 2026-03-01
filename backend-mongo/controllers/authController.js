const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');
const { sendOTP } = require('../utils/emailService');

// Phase 1: Verify Credentials & Send OTP
const authAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (admin && (await admin.matchPassword(password))) {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      admin.loginOTP = otp;
      admin.loginOTPExpires = Date.now() + 10 * 60 * 1000; // 10 mins expiry
      await admin.save();

      const emailSent = await sendOTP(admin.email, otp);

      if (emailSent) {
        res.json({
          success: true,
          message: 'OTP sent to your registered email.',
          requireOTP: true
        });
      } else {
        res.status(500).json({ message: 'Failed to send OTP. Please check email config.' });
      }
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Phase 2: Verify OTP & Complete Login
const verifyLoginOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const admin = await Admin.findOne({
      email,
      loginOTP: otp,
      loginOTPExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP after successful use
    admin.loginOTP = undefined;
    admin.loginOTPExpires = undefined;
    await admin.save();

    res.json({
      success: true,
      _id: admin._id,
      email: admin.email,
      token: generateToken(admin._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { authAdmin, verifyLoginOTP };
