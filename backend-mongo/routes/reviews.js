import express from "express";
const router = express.Router();
import { protectUser } from "../middleware/authMiddleware.js";
import Review from "../models/Review.js";
import Host from "../models/Host.js";

// @desc    Get reviews for a host
router.get("/:hostId", async (req, res) => {
  try {
    const reviews = await Review.find({ hostId: req.params.hostId })
      .populate("userId", "name profilePicture")
      .sort("-createdAt");
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Submit a review
router.post("/", protectUser, async (req, res) => {
  try {
    const { hostId, stars, comment } = req.body;
    const review = await Review.create({
      userId: req.user._id,
      hostId,
      stars,
      comment
    });

    // Update Host average rating
    const reviews = await Review.find({ hostId });
    const avgRating = reviews.reduce((acc, item) => item.stars + acc, 0) / reviews.length;
    
    await Host.findByIdAndUpdate(hostId, {
      avgRating: avgRating.toFixed(1),
      totalReviews: reviews.length
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
