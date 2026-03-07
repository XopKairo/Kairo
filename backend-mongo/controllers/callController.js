import callService from '../services/callService.js';
import crypto from 'crypto';

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

  async getTurnCredentials(req, res) {
    try {
      const username = req.user._id.toString();
      const secret = process.env.TURN_SECRET || 'your-secure-turn-secret';
      
      // 5 minutes expiry
      const unixTimeStamp = Math.floor(Date.now() / 1000) + 300; 
      const turnUsername = `${unixTimeStamp}:${username}`;
      
      const hmac = crypto.createHmac('sha1', secret);
      hmac.setEncoding('base64');
      hmac.write(turnUsername);
      hmac.end();
      const password = hmac.read();
      
      res.json({
        success: true,
        iceServers: [
          {
            urls: 'turn:turn.yourdomain.com:3478',
            username: turnUsername,
            credential: password
          }
        ]
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new CallController();
