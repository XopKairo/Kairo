import express from "express";
import userAuthController from "../controllers/userAuthController.js";
import { protectUser } from "../middleware/authMiddleware.js";
import {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  validateRequest,
} from "../utils/validation.js";

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { getStorage } from "../config/cloudinaryConfig.js";

const router = express.Router();
const upload = multer({ storage: getStorage("user_profiles") });

// Send OTP
router.post("/send-otp", userAuthController.sendOtp);

// Verify OTP
router.post(
  "/verify-otp",
  validateRequest(verifyOTPSchema),
  userAuthController.verifyOtp,
);

// User Registration
router.post(
  "/register",
  upload.single("profilePicture"),
  userAuthController.register,
);

// User Login
router.post("/login", validateRequest(loginSchema), userAuthController.login);

// Google Login
router.post("/google-login", userAuthController.googleLogin);

// Fast Login
router.post("/fast-login", userAuthController.fastLogin);

// Get Profile
router.get("/me", protectUser, userAuthController.getProfile);

// Delete Account
router.delete("/delete-account/:id", userAuthController.deleteAccount);

// Profile Update
const profileUpload = multer({ 
  storage: getStorage("profiles"),
}).fields([
  { name: "image", maxCount: 1 },
  { name: "moments", maxCount: 6 },
  { name: "video", maxCount: 1 }
]);

router.put("/profile-update", protectUser, profileUpload, userAuthController.updateProfile);

export default router;
