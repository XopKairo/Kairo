import express from "express";
const router = express.Router();
import multer from "multer";
import path from "path";
import Banner from "../models/Banner.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.get("/", async (req, res) => {
  try {
    const banners = await Banner.find({}).sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", upload.single("banner"), async (req, res) => {
  try {
    const { title, linkUrl, order } = req.body;
    const banner = await Banner.create({
      title,
      imageUrl: req.file ? `uploads/${req.file.filename}` : "",
      linkUrl,
      order: Number(order) || 0,
    });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: "Banner deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
