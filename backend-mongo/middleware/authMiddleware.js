import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import User from '../models/User.js';

// Protect Admin Middleware
export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin || admin.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized as an admin' });
      }
      
      req.admin = admin;
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// Alias for clarity in server.js
export const protectAdmin = protect;

// Protect User Middleware (Live Ban Sync)
export const protectUser = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Query the database to check current status on EVERY request
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
         return res.status(401).json({ success: false, message: 'User not found' });
      }

      if (user.isBanned) {
         return res.status(403).json({ success: false, message: 'Account is banned by admin' });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};
