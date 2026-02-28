const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const ReportedMessage = require('../models/ReportedMessage');
const User = require('../models/User');

// GET chat history between two users with pagination
router.get('/:user1Id/:user2Id', async (req, res) => {
  try {
    const { user1Id, user2Id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const messages = await Message.find({
      $or: [
        { senderId: user1Id, receiverId: user2Id },
        { senderId: user2Id, receiverId: user1Id }
      ]
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST to report a message (from App)
router.post('/report', async (req, res) => {
  try {
    const { reporterId, reportedUserId, messageId, reason } = req.body;
    const report = new ReportedMessage({ reporterId, reportedUserId, messageId, reason });
    await report.save();
    res.status(201).json({ message: 'Message reported successfully', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all reported messages (for Admin)
router.get('/reports', async (req, res) => {
  try {
    const reports = await ReportedMessage.find({})
      .populate('reporterId', 'name email')
      .populate('reportedUserId', 'name email')
      .populate('messageId', 'content createdAt')
      .sort('-createdAt');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT to update report status (for Admin)
router.put('/reports/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const report = await ReportedMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
