import express from "express";
import callController from "../controllers/callController.js";
import { protectUser, protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. Generate ZegoCloud Token
router.post("/generate-token", protectUser, callController.generateToken);

// 2. Start Call (Live Monitoring & Coin Enforcement)
router.post("/start", protectUser, callController.startCall);

// 3. End Call & Transaction Logic
router.post("/end", callController.endCall);

// 4. Get Active Calls for Admin
router.get("/active", protectAdmin, callController.getActiveCalls);

// 5. ZegoCloud Webhook
router.post("/webhook", callController.zegoWebhook);

// 6. TURN Server Credentials (Short-lived 5-minute expiry)
router.get("/turn-credentials", protectUser, callController.getTurnCredentials);

export default router;
