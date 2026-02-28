const express = require('express');
const router = express.Router();
const InterestTag = require('../models/InterestTag');

// GET all active interest tags (for Mobile App)
router.get('/active', async (req, res) => {
  try {
    const tags = await InterestTag.find({ isActive: true }).sort('name');
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all interest tags (for Admin)
router.get('/', async (req, res) => {
  try {
    const tags = await InterestTag.find({}).sort('-createdAt');
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new interest tag (Admin)
router.post('/', async (req, res) => {
  try {
    const { name, icon, isActive } = req.body;
    const tag = new InterestTag({ name, icon, isActive });
    await tag.save();
    res.status(201).json(tag);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Interest tag already exists' });
    }
    res.status(500).json({ message: error.message });
  }
});

// PUT update interest tag (Admin)
router.put('/:id', async (req, res) => {
  try {
    const { name, icon, isActive } = req.body;
    const tag = await InterestTag.findByIdAndUpdate(
      req.params.id,
      { name, icon, isActive },
      { new: true }
    );
    if (!tag) return res.status(404).json({ message: 'Tag not found' });
    res.json(tag);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE interest tag (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const tag = await InterestTag.findByIdAndDelete(req.params.id);
    if (!tag) return res.status(404).json({ message: 'Tag not found' });
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
