import Story from "../models/Story.js";
import User from "../models/User.js";
import Follow from "../models/Follow.js";

export const uploadStory = async (req, res) => {
  try {
    const { mediaType, caption } = req.body;
    const mediaUrl = req.file ? req.file.path : req.body.mediaUrl;

    if (!mediaUrl) {
      return res.status(400).json({ message: "Media (Image or Video) is required." });
    }

    const story = await Story.create({
      userId: req.user._id,
      mediaUrl,
      mediaType: mediaType || "image",
      caption
    });
    res.status(201).json({ success: true, story });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeedStories = async (req, res) => {
  try {
    // 1. Get IDs of users I follow
    const following = await Follow.find({ followerId: req.user._id }).select("followeeId");
    const followingIds = following.map(f => f.followeeId);
    
    // 2. Add my own ID to see my stories too
    const targetIds = [...followingIds, req.user._id];

    // 3. Fetch active stories from these users
    const stories = await Story.find({
      userId: { $in: targetIds },
      expiresAt: { $gt: new Date() }
    })
    .populate("userId", "name profilePicture nickname")
    .sort("-createdAt");

    // 4. Group stories by User (Insta style)
    const groupedStories = stories.reduce((acc, story) => {
      const uId = story.userId._id.toString();
      if (!acc[uId]) {
        acc[uId] = {
          user: story.userId,
          stories: []
        };
      }
      acc[uId].stories.push(story);
      return acc;
    }, {});

    res.json(Object.values(groupedStories));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markStoryViewed = async (req, res) => {
  try {
    const { storyId } = req.params;
    await Story.findByIdAndUpdate(storyId, {
      $addToSet: { viewers: { userId: req.user._id } }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};