import express from "express";
import User from "../models/User.js";
import Host from "../models/Host.js";
import VerificationRequest from "../models/VerificationRequest.js";
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
    const { search, gender, minCoins, maxCoins, isHost, isVerified, sortBy } = req.query;
    let query = { isDeleted: { $ne: true } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    if (gender) query.gender = gender;
    if (isHost) query.isHost = isHost === "true";
    if (isVerified) query.isVerified = isVerified === "true";

    if (minCoins || maxCoins) {
      query.coins = {};
      if (minCoins) query.coins.$gte = parseInt(minCoins);
      if (maxCoins) query.coins.$lte = parseInt(maxCoins);
    }

    let sort = { createdAt: -1 };
    if (sortBy === "coins") sort = { coins: -1 };
    if (sortBy === "newest") sort = { createdAt: -1 };

    const users = await User.find(query).sort(sort).limit(100);
    res.json(users);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    let { name, phone, password, gender } = req.body;

    // Strict Sanitization: Remove all spaces and special chars except +
    const cleanPhone = phone ? phone.toString().trim().replace(/\s+/g, "") : "";
    if (!cleanPhone) return res.status(400).json({ success: false, message: "Phone number is required" });

    const existing = await User.findOne({ phone: cleanPhone });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "User with this phone already exists" });
    }

    const userData = {
      name: name.trim(),
      phone: cleanPhone,
      password,
      gender: gender || "Male",
      firebaseUid: `ADMIN_CREATED_${Date.now()}_${cleanPhone.slice(-4)}`, // Sync with App expectations
      lastLoginDate: new Date(),
      isVerified: true
    };

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
    
    await Host.findOneAndUpdate(
      { userId: user._id }, 
      { ...updateData, profilePicture: user.profilePicture, photos: user.photos }, 
      { new: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/upload-media", async (req, res) => {
  try {
    const { file, type } = req.body;
    if (!file) {
      return res.status(400).json({ success: false, message: "File data is required" });
    }

    const resourceType = type === "video" ? "video" : "image";
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file, {
      resource_type: resourceType,
      folder: "kairo_media",
    });

    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error("Media upload error:", error);
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

router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };
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
  const { isBanned, reason, durationDays, customDate } = req.body;
  try {
    const update = { isBanned, banReason: reason || "" };
    if (isBanned && durationDays === "custom" && customDate) {
      update.banUntil = new Date(customDate);
    } else if (isBanned && durationDays && durationDays !== "permanent") {
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
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    
    await Promise.all([
      VerificationRequest.deleteMany({ userId }),
      Host.deleteMany({ userId }),
      redisClient.del(`user_status:${userId}`)
    ]);

    res.json({ success: true, message: "User and related verification data deleted" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/follow/:id", protectUser, async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.user._id;

    if (targetId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: "Cannot follow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.following && currentUser.following.includes(targetId);

    if (isFollowing) {
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $pull: { followers: currentUserId } }).catch(() => {});
      return res.json({ success: true, following: false });
    } else {
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: currentUserId } }).catch(() => {});
      return res.json({ success: true, following: true });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
