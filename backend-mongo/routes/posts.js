const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// GET feed (Mobile App) - Returns active posts, featured first
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    // Get featured posts
    const featuredPosts = await Post.find({ isFeatured: true, expiresAt: { $gt: now } })
      .populate('userId', 'name nickname profilePicture isVerified')
      .sort('-createdAt');
      
    // Get regular posts
    const regularPosts = await Post.find({ isFeatured: false, expiresAt: { $gt: now } })
      .populate('userId', 'name nickname profilePicture isVerified')
      .sort('-createdAt');

    res.json([...featuredPosts, ...regularPosts]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new story/post (Mobile App)
router.post('/', async (req, res) => {
  try {
    const { userId, mediaUrl, caption } = req.body;
    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const post = new Post({ userId, mediaUrl, caption, expiresAt });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all active posts (Admin)
router.get('/admin', async (req, res) => {
  try {
    const now = new Date();
    const posts = await Post.find({ expiresAt: { $gt: now } })
      .populate('userId', 'name email')
      .sort('-createdAt');
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT toggle featured status (Admin)
router.put('/:id/feature', async (req, res) => {
  try {
    const { isFeatured } = req.body;
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
