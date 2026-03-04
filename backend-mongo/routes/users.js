import express from 'express';
const router = express.Router();

router.get('/profile', (req, res) => res.json({ message: 'User Profile' }));
router.put('/update', (req, res) => res.json({ message: 'Profile Updated' }));

export default router;
