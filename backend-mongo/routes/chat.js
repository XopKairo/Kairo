import express from 'express';
import { getConversations, getMessages, sendMessage } from '../controllers/chatController.js';
import { protectUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectUser);

router.get('/conversations', getConversations);
router.get('/messages/:conversationId', getMessages);
router.post('/send', sendMessage);

export default router;
