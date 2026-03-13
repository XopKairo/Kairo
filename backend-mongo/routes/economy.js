import express from "express";
import CoinPackage from "../models/CoinPackage.js";
import Gift from "../models/Gift.js";
import VipPackage from "../models/VipPackage.js";
import Coupon from "../models/Coupon.js";
import AdminActionLog from "../models/AdminActionLog.js";
import { protectAdmin } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/gifts"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// --- VIP Packages ---
router.get("/vip", protectAdmin, async (req, res) => {
  res.json(await VipPackage.find({}));
});

router.post("/vip", protectAdmin, async (req, res) => {
  const pkg = await VipPackage.create(req.body);
  
  try {
    await AdminActionLog.create({
      adminId: req.admin?._id,
      action: "UPDATE_CONFIG",
      targetId: pkg._id,
      details: `Created VIP Package: ${pkg.name}`,
    });
  } catch (logErr) {}

  res.status(201).json(pkg);
});

router.delete("/vip/:id", protectAdmin, async (req, res) => {
  const pkg = await VipPackage.findById(req.params.id);
  if (pkg) {
    try {
      await AdminActionLog.create({
        adminId: req.admin?._id,
        action: "UPDATE_CONFIG",
        targetId: pkg._id,
        details: `Deleted VIP Package: ${pkg.name}`,
      });
    } catch (logErr) {}
    await VipPackage.findByIdAndDelete(req.params.id);
  }
  res.json({ message: "VIP Package deleted" });
});

// --- Coupons ---
router.get("/coupons", protectAdmin, async (req, res) => {
  res.json(await Coupon.find({}).sort({ createdAt: -1 }));
});

router.post("/coupons", protectAdmin, async (req, res) => {
  const coupon = await Coupon.create(req.body);
  
  try {
    await AdminActionLog.create({
      adminId: req.admin?._id,
      action: "UPDATE_CONFIG",
      targetId: coupon._id,
      details: `Created Coupon: ${coupon.code}. Discount: ${coupon.discountPercentage}%`,
    });
  } catch (logErr) {}

  res.json(coupon);
});

router.delete("/coupons/:id", protectAdmin, async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (coupon) {
    try {
      await AdminActionLog.create({
        adminId: req.admin?._id,
        action: "UPDATE_CONFIG",
        targetId: coupon._id,
        details: `Deleted Coupon: ${coupon.code}`,
      });
    } catch (logErr) {}
    await Coupon.findByIdAndDelete(req.params.id);
  }
  res.json({ message: "Coupon deleted" });
});

// --- Coin Packages ---
router.get("/coins", protectAdmin, async (req, res) => {
  res.json(await CoinPackage.find({}));
});

router.post("/coins", protectAdmin, async (req, res) => {
  const pkg = await CoinPackage.create(req.body);
  
  try {
    await AdminActionLog.create({
      adminId: req.admin?._id,
      action: "UPDATE_CONFIG",
      targetId: pkg._id,
      details: `Created Coin Package: ${pkg.coins} Coins for ₹${pkg.priceINR}`,
    });
  } catch (logErr) {}

  res.status(201).json(pkg);
});

router.delete("/coins/:id", protectAdmin, async (req, res) => {
  const pkg = await CoinPackage.findById(req.params.id);
  if (pkg) {
    try {
      await AdminActionLog.create({
        adminId: req.admin?._id,
        action: "UPDATE_CONFIG",
        targetId: pkg._id,
        details: `Deleted Coin Package: ${pkg.coins} Coins`,
      });
    } catch (logErr) {}
    await CoinPackage.findByIdAndDelete(req.params.id);
  }
  res.json({ message: "Package deleted" });
});

export default router;
