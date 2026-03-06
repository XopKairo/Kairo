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
    const user = await User.findById(req.params.id).populate('followers', 'name profilePicture').populate('following', 'name profilePicture');
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

// Follow/Unfollow User
router.post('/follow/:id', async (req, res) => {
  const { currentUserId } = req.body;
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) return res.status(404).json({ message: 'User not found' });

    const isFollowing = currentUser.following.includes(req.params.id);

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
      userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== currentUserId);
    } else {
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(currentUserId);
    }

    await currentUser.save();
    await userToFollow.save();

    res.json({ success: true, following: !isFollowing });
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
