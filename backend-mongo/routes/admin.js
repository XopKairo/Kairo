import express from 'express';
const router = express.Router();

router.get('/dashboard', (req, res) => res.json({ message: 'Admin Dashboard' }));
router.get('/stats', (req, res) => res.json({ message: 'System Stats' }));

export default router;
