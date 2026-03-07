import express from 'express';
import interactionController from '../controllers/interactionController.js';
import { protectUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protectUser);

// Gifting
router.get('/gifts', interactionController.getGifts);
router.post('/gifts/send', interactionController.sendGift);

// Following
router.post('/follow', interactionController.followUser);
router.delete('/follow/:followeeId', interactionController.unfollowUser);
router.get('/follow/status/:userId', interactionController.getFollowStatus);

// Rating
router.post('/rate', interactionController.submitRating);

export default router;
