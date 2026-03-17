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
  } catch (logErr) { console.error("Admin log error:", logErr?.message); }

  res.status(201).json(pkg);
});

router.put("/vip/:id", protectAdmin, async (req, res) => {
  try {
    const pkg = await VipPackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pkg) return res.status(404).json({ message: "VIP Package not found" });

    await AdminActionLog.create({
      adminId: req.admin?._id,
      action: "UPDATE_CONFIG",
      targetId: pkg._id,
      details: `Updated VIP Package: ${pkg.name}`,
    }).catch(() => {});

    res.json(pkg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
    } catch (logErr) { console.error("Admin log error:", logErr?.message); }
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
  } catch (logErr) { console.error("Admin log error:", logErr?.message); }

  res.json(coupon);
});

router.put("/coupons/:id", protectAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    await AdminActionLog.create({
      adminId: req.admin?._id,
      action: "UPDATE_CONFIG",
      targetId: coupon._id,
      details: `Updated Coupon: ${coupon.code}`,
    }).catch(() => {});

    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
    } catch (logErr) { console.error("Admin log error:", logErr?.message); }
    await Coupon.findByIdAndDelete(req.params.id);
  }
  res.json({ message: "Coupon deleted" });
});

// --- Coin Packages ---
router.get("/coins", async (req, res) => {
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
  } catch (logErr) { console.error("Admin log error:", logErr?.message); }

  res.status(201).json(pkg);
});

router.put("/coins/:id", protectAdmin, async (req, res) => {
  try {
    const pkg = await CoinPackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pkg) return res.status(404).json({ message: "Coin Package not found" });

    await AdminActionLog.create({
      adminId: req.admin?._id,
      action: "UPDATE_CONFIG",
      targetId: pkg._id,
      details: `Updated Coin Package: ${pkg.coins} Coins`,
    }).catch(() => {});

    res.json(pkg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
    } catch (logErr) { console.error("Admin log error:", logErr?.message); }
    await CoinPackage.findByIdAndDelete(req.params.id);
  }
  res.json({ message: "Package deleted" });
});

// --- Gifts ---
router.get("/gifts", async (req, res) => {
  res.json(await Gift.find({}));
});

router.post("/gifts", protectAdmin, upload.single("icon"), async (req, res) => {
  try {
    const { name, coinCost, isActive } = req.body;
    if (!req.file) return res.status(400).json({ message: "Gift icon is required" });

    const gift = await Gift.create({
      name,
      coinCost: parseInt(coinCost),
      isActive: isActive === "true" || isActive === true,
      iconUrl: `uploads/gifts/${req.file.filename}`
    });

    res.status(201).json(gift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/gifts/:id", protectAdmin, upload.single("icon"), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.iconUrl = `uploads/gifts/${req.file.filename}`;
    }
    
    const gift = await Gift.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!gift) return res.status(404).json({ message: "Gift not found" });

    res.json(gift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/gifts/:id", protectAdmin, async (req, res) => {
  await Gift.findByIdAndDelete(req.params.id);
  res.json({ message: "Gift deleted" });
});

export default router;
