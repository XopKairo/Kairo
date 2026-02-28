const express = require('express');
const router = express.Router();
const LiveCall = require('../models/LiveCall');

// GET all active calls (Admin Monitoring)
router.get('/active', async (req, res) => {
  try {
    const activeCalls = await LiveCall.find({ status: 'Active' });
    res.json(activeCalls);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST force end a call (Admin action)
router.post('/force-end/:callId', async (req, res) => {
  try {
    const call = await LiveCall.findOneAndUpdate(
      { callId: req.params.callId },
      { status: 'Ended', endedAt: Date.now() },
      { new: true }
    );
    if (!call) return res.status(404).json({ message: 'Call not found' });
    
    // In a real scenario, you'd also emit a socket event to terminate the call on the client side
    if (req.io) {
      req.io.to(call.userId).emit('callForceEnded', { callId: call.callId });
      req.io.to(call.hostId).emit('callForceEnded', { callId: call.callId });
    }

    res.json({ message: 'Call ended by admin', call });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Internal helper for Socket logic (to be used when a call starts/ends naturally)
router.logCallStart = async (data) => {
  try {
    const call = new LiveCall({
      callId: data.callId,
      userId: data.userId,
      hostId: data.hostId,
      status: 'Active'
    });
    await call.save();
    return call;
  } catch (err) {
    console.error('Error logging call start:', err);
  }
};

router.logCallEnd = async (callId) => {
  try {
    await LiveCall.findOneAndUpdate({ callId }, { status: 'Ended', endedAt: Date.now() });
  } catch (err) {
    console.error('Error logging call end:', err);
  }
};

module.exports = router;
