import express from "express";
import userAuthController from "../controllers/userAuthController.js";
import {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  validateRequest,
} from "../utils/validation.js";

const router = express.Router();

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
  validateRequest(registerSchema),
  userAuthController.register,
);

// User Login
router.post("/login", validateRequest(loginSchema), userAuthController.login);

// Delete Account
router.delete("/delete-account/:id", userAuthController.deleteAccount);

export default router;
