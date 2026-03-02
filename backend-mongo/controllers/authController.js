const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');
const { sendOTP } = require('../utils/emailService');

// Admin Login - No OTP Required
const authAdmin = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const query = [];
    if (username) query.push({ username });
    if (email) query.push({ email });

    if (query.length === 0) return res.status(400).json({ success: false, message: 'Username or Email required' });

    const admin = await Admin.findOne({ $or: query });

    if (admin && (await admin.matchPassword(password))) {
      return res.status(200).json({
        success: true,
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        token: generateToken(admin._id),
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Verify OTP - Keep for other potential uses or backward compatibility
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
