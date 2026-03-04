import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js.js';
import User from '../models/User.js.js';
import logger from '../utils/logger.js';

// Token Generation Helpers
const generateAccessToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const authAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.matchPassword(password))) {
      logger.warn(`Failed login attempt for admin: ${username}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(admin._id, 'admin');
    const refreshToken = generateRefreshToken(admin._id, 'admin');

    logger.info(`Admin logged in: ${username}`);
    res.json({
      success: true,
      user: { id: admin._id, username: admin.username, role: 'admin' },
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error(`Admin Auth Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const refreshTokens = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = generateAccessToken(decoded.id, decoded.role);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};
