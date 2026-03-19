import express from "express";
import multer from "multer";
import { getStorage } from "../config/cloudinaryConfig.js";
import { 
  uploadStory, 
  getFeedStories, 
  markStoryViewed 
} from "../controllers/storyController.js";
import { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure Multer for Cloudinary
const imageStorage = getStorage("stories", "image");
const videoStorage = getStorage("stories", "video");

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and videos are allowed."), false);
  }
};

const limits = { fileSize: 10 * 1024 * 1024 }; // 10MB limit

const upload = multer({ 
  storage: imageStorage, // Default to image, logic below handles switch
  limits,
  fileFilter 
});

router.use(protectUser);

router.post("/upload", (req, res, next) => {
  const mediaType = req.body.mediaType || "image";
  if (mediaType === "video") {
    multer({ storage: videoStorage, limits, fileFilter }).single("media")(req, res, next);
  } else {
    multer({ storage: imageStorage, limits, fileFilter }).single("media")(req, res, next);
  }
}, uploadStory);

router.get("/feed", getFeedStories);
router.post("/view/:storyId", markStoryViewed);

export default router;