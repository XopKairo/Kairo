const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getStorage } = require('../config/cloudinaryConfig');
const Post = require('../models/Post');
const { postUploadSchema, validateRequest } = require('../utils/validation');

// Configure Multer for Cloudinary
const imageStorage = getStorage('posts', 'image');
const videoStorage = getStorage('posts', 'video');
const uploadImage = multer({ storage: imageStorage });
const uploadVideo = multer({ storage: videoStorage });

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

// POST a new story/post
router.post('/', (req, res, next) => {
  const mediaType = req.body.mediaType || 'image';
  if (mediaType === 'video') {
    uploadVideo.single('video')(req, res, next);
  } else {
    uploadImage.single('image')(req, res, next);
  }
}, validateRequest(postUploadSchema), async (req, res) => {
  try {
    const { userId, caption, mediaType } = req.body;
    
    // Check if file was uploaded to Cloudinary
    const mediaUrl = req.file ? req.file.path : null;
    
    if (!mediaUrl) {
      return res.status(400).json({ message: 'Media (Image or Video) is required.' });
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const post = new Post({ 
      userId, 
      mediaUrl, 
      caption, 
      expiresAt, 
      mediaType: mediaType || 'image' 
    });
    
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
