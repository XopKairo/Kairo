const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTP = require('../models/OTP');
const AdminActionLog = require('../models/AdminActionLog');
const { getUserBadge } = require('../utils/badgeSystem');
const { protectUser } = require('../middleware/authMiddleware');

// GET /otps - Fetch active OTPs for Admin verification and debugging
router.get('/otps', async (req, res) => {
  try {
    const otps = await OTP.find({}).sort({ createdAt: -1 });
    res.status(200).json(otps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /search - Search users by name, email, nickname, location, and interests
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    // Use $text search first
    let users = await User.find({
      $text: { $search: q }
    }).select('-password -__v').limit(20);

    // If no results, fallback to fuzzy search on other fields
    if (users.length === 0) {
      const regex = new RegExp(q, 'i');
      users = await User.find({
        $or: [
          { name: { $regex: regex } },
          { email: { $regex: regex } },
          { nickname: { $regex: regex } },
          { location: { $regex: regex } },
          { interests: { $regex: regex } }
        ]
      }).select('-password -__v').limit(20);
    }

    // Map badges
    users = users.map(u => {
       const uObj = u.toObject();
       uObj.badge = getUserBadge(u.zoraPoints || 0);
       return uObj;
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all users
router.get('/', async (req, res) => {
  try {
    let users = await User.find({}).select('-password');
    users = users.map(u => {
       const uObj = u.toObject();
       uObj.badge = getUserBadge(u.zoraPoints || 0);
       return uObj;
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT to update Zora Points (Admin)
router.put('/:id/points', async (req, res) => {
  try {
    const { points } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { zoraPoints: Number(points) },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const badge = getUserBadge(user.zoraPoints);
    res.json({ message: 'Points updated successfully', user, badge });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT to add/deduct coins
router.put('/:id/coins', async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.coins += Number(amount);
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT to update user interests
router.put('/:id/interests', async (req, res) => {
  try {
    const { interests } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { interests },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'Interests updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT to update user profile (gender, selfie, etc)
router.put('/:id/profile', protectUser, async (req, res) => {
  try {
    // Ensure user is updating their own profile
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
    }

    const { name, nickname, location, gender, verificationSelfie } = req.body;
    
    // Whitelist allowed fields to prevent restricted field updates
    const updateData = {};
    if (name) updateData.name = String(name).trim().substring(0, 50);
    if (nickname) updateData.nickname = String(nickname).trim().substring(0, 30);
    if (location) updateData.location = String(location).trim().substring(0, 100);
    if (gender && ['Male', 'Female', 'Other'].includes(gender)) {
      updateData.gender = gender;
    }
    if (verificationSelfie) {
      // Basic URL validation
      if (typeof verificationSelfie === 'string' && verificationSelfie.startsWith('http')) {
        updateData.verificationSelfie = verificationSelfie;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Handle female verification request
    if (gender === 'Female' && verificationSelfie && !user.isGenderVerified) {
      const VerificationRequest = require('../models/VerificationRequest');
      const existingRequest = await VerificationRequest.findOne({ userId: user._id, status: 'pending' });
      if (!existingRequest) {
        await VerificationRequest.create({
          userId: user._id,
          photoUrl: verificationSelfie,
          idUrl: 'Selfie Verification',
          status: 'pending'
        });
      }
    }

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST to update push token
router.post('/:id/push-token', async (req, res) => {
  try {
    const { pushToken } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { pushToken }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Push token updated successfully', pushToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST to verify/unverify users
router.post('/:id/verify', async (req, res) => {
  try {
    const { isVerified } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: `User ${isVerified ? 'verified' : 'unverified'} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST to ban/unban users
router.post('/:id/ban', async (req, res) => {
  try {
    const { isBanned } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Audit Log
    if (req.admin) {
      await AdminActionLog.create({
        adminId: req.admin._id,
        action: isBanned ? 'BAN_USER' : 'UNBAN_USER',
        targetId: user._id,
        details: `${isBanned ? 'Banned' : 'Unbanned'} user ${user.username || user.email}`,
        ipAddress: req.ip
      });
    }

    // Real-time Ban Enforcement via Socket
    if (isBanned && req.io) {
      req.io.to(req.params.id).emit('userBanned', {
        message: 'Your account has been banned by the administrator.'
      });
    }

    res.json({ message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE user (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Audit Log
    if (req.admin) {
      await AdminActionLog.create({
        adminId: req.admin._id,
        action: 'DELETE_USER',
        targetId: user._id,
        details: `Deleted user ${user.username || user.email}`,
        ipAddress: req.ip
      });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
