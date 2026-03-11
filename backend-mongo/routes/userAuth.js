import express from "express";
import userAuthController from "../controllers/userAuthController.js";
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

// Delete Account
router.delete("/delete-account/:id", userAuthController.deleteAccount);

export default router;
