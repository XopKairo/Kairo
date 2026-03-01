const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

// Protect Admin Middleware
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Protect User Middleware (Live Ban Sync)
const protectUser = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
      
      // Query the database to check current status on EVERY request
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
         return res.status(401).json({ success: false, message: 'User not found' });
      }

      if (user.isBanned) {
         return res.status(403).json({ success: false, message: 'Account is banned by admin' });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

module.exports = { protect, protectUser };
