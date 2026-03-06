import express from 'express';
import User from '../models/User.js';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id/profile', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id/status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ success: true, message: 'Status updated', user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
