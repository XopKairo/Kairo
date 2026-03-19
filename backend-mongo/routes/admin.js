import express from "express";
import adminController from "../controllers/adminController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes here are protected by Admin Middleware
router.use(protectAdmin);

// 1. Wallet Adjustment (Add/Remove Coins)
router.post("/wallet/adjust", adminController.adjustWallet);
router.post("/users/toggle-shadow-ban", adminController.toggleShadowBan);

// 2. Call Control (Force End)
router.post("/calls/force-end", adminController.forceEndCall);

// 3. Report Action (Ban/Warn/Dismiss)
router.post("/reports/action", adminController.handleReportAction);

// 4. System Overview
router.get("/overview", adminController.getOverview);

// 5. Audit Logs
router.get("/audit-logs", adminController.getAuditLogs);

// 6. Blacklist Management
router.get("/blacklist", adminController.getBlacklist);
router.post("/blacklist", adminController.addToBlacklist);
router.delete("/blacklist/:id", adminController.removeFromBlacklist);

// Deletion Management
router.get("/deletion-requests", adminController.getDeletionRequests);
router.post("/restore-user/:id", adminController.restoreUser);

// 7. Permanent Delete Host/User
router.delete("/delete-permanent/:id", adminController.deleteHostPermanently);

// 8. Story Moderation
router.get("/stories", adminController.getAllStories);
router.delete("/stories/:id", adminController.deleteStory);

export default router;
