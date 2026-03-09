import express from "express";
import CoinPackage from "../models/CoinPackage.js";
import Gift from "../models/Gift.js";
import VipPackage from "../models/VipPackage.js";
import Coupon from "../models/Coupon.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// ... existing code ...

// --- VIP Packages ---
router.get("/vip", async (req, res) => {
  res.json(await VipPackage.find({}));
});

router.post("/vip", async (req, res) => {
  const pkg = await VipPackage.create(req.body);
  res.json(pkg);
});

router.put("/vip/:id", async (req, res) => {
  const pkg = await VipPackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(pkg);
});

router.delete("/vip/:id", async (req, res) => {
  await VipPackage.findByIdAndDelete(req.params.id);
  res.json({ message: "VIP Package deleted" });
});

// --- Coupons ---
router.get("/coupons", async (req, res) => {
  res.json(await Coupon.find({}).sort({ createdAt: -1 }));
});

router.post("/coupons", async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.json(coupon);
});

router.put("/coupons/:id", async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(coupon);
});

router.delete("/coupons/:id", async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ message: "Coupon deleted" });
});

// --- Coin Packages ---
router.get("/coins", async (req, res) => {
  res.json(await CoinPackage.find({}));
});

router.post("/coins", async (req, res) => {
  const { coins, priceINR, bonus, icon, isActive } = req.body;
  const pkg = await CoinPackage.create({
    coins,
    priceINR,
    bonus,
    icon,
    isActive,
  });
  res.json(pkg);
});

router.put("/coins/:id", async (req, res) => {
  const pkg = await CoinPackage.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(pkg);
});

router.delete("/coins/:id", async (req, res) => {
  await CoinPackage.findByIdAndDelete(req.params.id);
  res.json({ message: "Package deleted" });
});

// --- Gifts ---
router.get("/gifts", async (req, res) => {
  res.json(await Gift.find({}));
});

// Upload custom icon support
router.post("/gifts", upload.single("icon"), async (req, res) => {
  const { name, coinCost, isActive } = req.body;
  const iconUrl = req.file ? `/uploads/gifts/${req.file.filename}` : "";
  const gift = await Gift.create({ name, coinCost, iconUrl, isActive });
  res.json(gift);
});

router.put("/gifts/:id", upload.single("icon"), async (req, res) => {
  const updateData = { ...req.body };
  if (req.file) updateData.iconUrl = `/uploads/gifts/${req.file.filename}`;
  const gift = await Gift.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
  });
  res.json(gift);
});

export default router;
