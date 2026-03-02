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

      try {
        await sendOTP(admin.email, otp);
        return res.status(200).json({
          success: true,
          message: 'OTP sent to your registered email.',
          requireOTP: true
        });
      } catch (emailError) {
        return res.status(500).json({ success: false, message: emailError.message });
      }
    } else {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
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
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Clear OTP after successful use
    admin.loginOTP = undefined;
    admin.loginOTPExpires = undefined;
    await admin.save();

    return res.status(200).json({
      success: true,
      _id: admin._id,
      email: admin.email,
      token: generateToken(admin._id),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { authAdmin, verifyLoginOTP };
