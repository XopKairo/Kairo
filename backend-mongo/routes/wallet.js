import express from "express";
import walletController from "../controllers/walletController.js";

const router = express.Router();

// Route to request withdrawal (User/Host)
router.post("/withdraw", walletController.withdraw);

// Route to earn coins via Ads
router.post("/earn-ad", walletController.earnAd);

// GET active coin packages for store
router.get("/coin-packages", walletController.getCoinPackages);

export default router;
