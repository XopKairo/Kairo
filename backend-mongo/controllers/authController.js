const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Admin Login - No OTP Required, strict async/await, direct res.json
const authAdmin = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    console.log(`[AUTH] Admin login attempt. Body:`, JSON.stringify({ 
      username: username || 'not provided', 
      email: email || 'not provided', 
      password: password ? '********' : 'missing' 
    }));

    const query = [];
    if (username) query.push({ username });
    if (email) query.push({ email });

    if (query.length === 0) {
      console.log(`[AUTH] Login failed: No username or email provided.`);
      return res.status(400).json({ success: false, message: 'Username or Email required' });
    }

    console.log(`[AUTH] Executing Admin.findOne with query:`, JSON.stringify({ $or: query }));
    const admin = await Admin.findOne({ $or: query });

    if (!admin) {
      console.log(`[AUTH] Admin not found for query:`, JSON.stringify(query));
      return res.status(401).json({ success: false, message: 'Invalid Username or Password' });
    }

    console.log(`[AUTH] Admin user found: ${admin.username}. Comparing password...`);

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      console.log(`[AUTH] Password mismatch for admin: ${admin.username}`);
      return res.status(401).json({ success: false, message: 'Invalid Username or Password' });
    }

    if (admin.role !== 'admin') {
      console.log(`[AUTH] Invalid role for user: ${admin.username}, role: ${admin.role}`);
      return res.status(403).json({ success: false, message: 'Access Denied: Admin role required' });
    }

    const expiry = process.env.ADMIN_JWT_EXPIRY || '8h';
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: expiry });
    return res.status(200).json({
      success: true,
      _id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      token: token,
    });
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

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

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
