import express from "express";
import {
  authAdmin,
  refreshTokens,
  requestAdminUpdateOTP,
  updateAdminProfile,
  getAdminProfile,
} from "../controllers/authController.js";
import {
  validateRequest,
  schemas,
} from "../middleware/validationMiddleware.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", validateRequest(schemas.adminLogin), authAdmin);
router.post("/refresh", refreshTokens);

// Profile Routes
router.get("/me", protectAdmin, getAdminProfile);
router.post("/request-update-otp", protectAdmin, requestAdminUpdateOTP);
router.put("/update-profile", protectAdmin, updateAdminProfile);

export default router;
