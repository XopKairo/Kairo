const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Admin Login - No OTP Required, strict async/await, direct res.json
const authAdmin = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const query = [];
    if (username) query.push({ username });
    if (email) query.push({ email });

    if (query.length === 0) {
      return res.status(400).json({ success: false, message: 'Username or Email required' });
    }

    const admin = await Admin.findOne({ $or: query });

    if (admin && (await admin.matchPassword(password))) {
      const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
      return res.status(200).json({
        success: true,
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        token: token,
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP - Backward compatibility or specific admin flows
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

    admin.loginOTP = undefined;
    admin.loginOTPExpires = undefined;
    await admin.save();

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });

    return res.status(200).json({
      success: true,
      _id: admin._id,
      email: admin.email,
      token: token,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { authAdmin, verifyLoginOTP };
