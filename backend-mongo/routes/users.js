import express from "express";
import User from "../models/User.js";
import Host from "../models/Host.js";
import { protectUser } from "../middleware/authMiddleware.js";
import redisClient from "../config/redis.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { getStorage } from "../config/cloudinaryConfig.js";

const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "kairo_profiles",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

router.get("/", async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, phone, password, gender } = req.body;

    // Build query to check duplicates only for provided values
    const query = [];
    if (phone && phone.trim() !== "") query.push({ phone: phone.trim() });

    if (query.length > 0) {
      const existing = await User.findOne({ $or: query });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Phone already exists" });
      }
    }

    const userData = {
      name: name.trim(),
      password,
      gender: gender || "Male",
    };

    if (phone && phone.trim() !== "") userData.phone = phone.trim();

    const user = await User.create(userData);
    res.status(201).json({ success: true, user });
  } catch (e) {
    console.error("Admin user creation error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Profile Update with Image Upload
router.put("/:id/profile", upload.single("image"), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.profilePicture = req.file.path;
      updateData.verificationSelfie = req.file.path;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    await redisClient.del(`user_status:${req.params.id}`);
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Configure Multer for multiple uploads
const profileUpload = multer({ 
  storage: getStorage("profiles"),
}).fields([
  { name: "image", maxCount: 1 },
  { name: "moments", maxCount: 6 },
  { name: "video", maxCount: 1 }
]);

router.put("/me/profile", protectUser, profileUpload, async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, bio, age, location, gender, languages, isVipOnly, callRatePerMinute } = req.body;

    const updateData = { 
      name, bio, age, location, gender, 
      languages: Array.isArray(languages) ? languages : languages ? languages.split(',') : [],
      isVipOnly: isVipOnly === "true",
      callRatePerMinute: parseInt(callRatePerMinute) || 30
    };

    if (req.files["image"]) updateData.profilePicture = req.files["image"][0].path;
    if (req.files["moments"]) updateData.photos = req.files["moments"].map(f => f.path);
    if (req.files["video"]) updateData.shortVideoUrl = req.files["video"][0].path;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    
    // Also update Host model if it exists
    await Host.findOneAndUpdate(
      { phone: user.phone }, 
      { ...updateData, profilePicture: user.profilePicture, photos: user.photos }, 
      { new: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/block/:targetId", protectUser, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: req.params.targetId } });
    res.json({ success: true, message: "User blocked" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generic Admin Update
router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };
    // Prevent empty strings from causing unique index issues
    if (updateData.phone === "") delete updateData.phone;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    await redisClient.del(`user_status:${req.params.id}`);
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/:id/ban", async (req, res) => {
  const { isBanned, reason, durationDays } = req.body;
  try {
    const update = { isBanned, banReason: reason || "" };
    if (isBanned && durationDays && durationDays !== "permanent") {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(durationDays));
      update.banUntil = date;
    } else if (!isBanned) {
      update.banUntil = null;
    } else {
      update.banUntil = new Date("9999-12-31");
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    // Notify user via Socket
    if (isBanned && req.io) {
      req.io
        .to(`user-${user._id}`)
        .emit("userBanned", { reason: user.banReason });
    }

    await redisClient.del(`user_status:${req.params.id}`);
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await redisClient.del(`user_status:${req.params.id}`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// User upgrades to Host
router.patch("/:id/upgrade-to-host", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update User model
    user.isHost = true;
    await user.save();

    // Check if Host record already exists, if not create one
    let host = await Host.findOne({ userId: user._id });
    if (!host) {
      host = new Host({
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        hostId: Math.floor(100000 + Math.random() * 900000).toString(), // Random 6 digit ID
        profilePicture: user.profilePicture,
        gender: user.gender,
        isVerified: false,
        status: "Offline"
      });
      await host.save();
    }

    res.json({ success: true, message: "Upgraded to host successfully", user, host });
  } catch (error) {
    console.error("Error upgrading host:", error);
    res.status(500).json({ success: false, message: "Failed to upgrade to host" });
  }
});

router.post("/follow/:id", async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.user._id;

    if (targetId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: "Cannot follow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.following && currentUser.following.includes(targetId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $pull: { followers: currentUserId } }).catch(() => {});
      return res.json({ success: true, following: false });
    } else {
      // Follow
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: currentUserId } }).catch(() => {});
      return res.json({ success: true, following: true });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
