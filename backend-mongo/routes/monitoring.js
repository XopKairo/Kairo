const express = require('express');
const router = express.Router();
const Call = require('../models/Call');

// Get all active calls for the Live Monitoring Wall
router.get('/active', async (req, res) => {
  try {
    const activeCalls = await Call.find({ status: 'Active' })
      .populate('userId', 'name email')
      .populate('hostId', 'name email')
      .sort({ startTime: -1 });
      
    res.json(activeCalls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to force end a call from the admin panel
router.post('/force-end/:callId', async (req, res) => {
  try {
    const { callId } = req.params;
    const call = await Call.findOneAndUpdate(
      { callId, status: 'Active' },
      { status: 'Completed', endTime: new Date() },
      { new: true }
    );
    
    if (!call) return res.status(404).json({ message: 'Active call not found' });

    // Emit event to socket to notify clients/admin
    if (req.io) {
      req.io.emit('callForceEnded', { callId });
    }

    res.json({ message: 'Call force ended by Admin', call });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
