import callService from '../services/callService.js';

class CallController {
  async generateToken(req, res) {
    try {
      const { userId, roomId } = req.body;
      const result = await callService.generateToken(userId, roomId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async startCall(req, res) {
    try {
      const { hostId, callId } = req.body;
      const result = await callService.startCall(req.user._id, hostId, callId);
      
      if (req.io) {
        req.io.to('admin-room').emit('callStartedAlert', {
          message: `New call started between User ${result.user.name} and Host ${hostId}`,
          callId,
          userId: req.user._id
        });
      }

      res.json(result);
    } catch (error) {
      res.status(403).json({ success: false, message: error.message });
    }
  }

  async endCall(req, res) {
    try {
      const { callId, durationInMinutes } = req.body;
      const result = await callService.endCall(callId, durationInMinutes);
      res.json({
        success: true,
        message: 'Call ended and transaction processed successfully',
        transaction: result
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getActiveCalls(req, res) {
    try {
      const activeCalls = await callService.getActiveCalls();
      res.json(activeCalls);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async zegoWebhook(req, res) {
    try {
      await callService.handleWebhook(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('[Zego Webhook Error]', error);
      res.status(500).send('Webhook Processing Error');
    }
  }
}

export default new CallController();
