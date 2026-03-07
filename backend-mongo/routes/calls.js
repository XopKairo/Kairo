import express from 'express';
import callController from '../controllers/callController.js';
import { protectUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Generate ZegoCloud Token
router.post('/generate-token', protectUser, callController.generateToken);

// 2. Start Call (Live Monitoring & Coin Enforcement)
router.post('/start', protectUser, callController.startCall);

// 3. End Call & Transaction Logic
router.post('/end', callController.endCall);

// 4. Get Active Calls for Admin
router.get('/active', callController.getActiveCalls);

// 5. ZegoCloud Webhook
router.post('/webhook', callController.zegoWebhook);

export default router;
