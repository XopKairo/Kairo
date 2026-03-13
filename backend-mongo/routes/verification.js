import express from "express";
const router = express.Router();
import multer from "multer";
import { getStorage } from "../config/cloudinaryConfig.js";
import VerificationRequest from "../models/VerificationRequest.js";
import User from "../models/User.js";
import Host from "../models/Host.js";
import { protectAdmin, protectUser } from "../middleware/authMiddleware.js";

// Configure Multer for Cloudinary
const upload = multer({ storage: getStorage("verification") });

// GET all verification requests (Admin)
router.get("/", protectAdmin, async (req, res) => {
  try {
    let requests = await VerificationRequest.find({})
      .populate("userId", "name phone nickname isVerified gender profilePicture")
      .sort({ createdAt: -1 });
    
    // Filter out requests where user was deleted (orphaned records)
    const validRequests = requests.filter(r => r.userId && r.userId._id);
    
    res.json(validRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new verification request (App)
router.post(
  "/submit",
  protectUser,
  upload.fields([
    { name: "selfie", maxCount: 1 },
    { name: "idProof", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user._id;

      // Check if user already has a pending request
      const existingRequest = await VerificationRequest.findOne({
        userId,
        status: "pending",
      });
      if (existingRequest) {
        return res
          .status(400)
          .json({ message: "You already have a pending verification request" });
      }

      // Get Cloudinary URLs
      const photoUrl = req.files["selfie"] ? req.files["selfie"][0].path : null;
      const idUrl = req.files["idProof"] ? req.files["idProof"][0].path : null;

      if (!photoUrl) {
        return res
          .status(400)
          .json({ message: "Selfie is required for verification." });
      }

      const request = new VerificationRequest({ userId, photoUrl, idUrl });
      await request.save();

      res
        .status(201)
        .json({
          message: "Verification request submitted successfully",
          request,
        });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// POST to approve/reject verification request (Admin)
router.post("/:id/status", protectAdmin, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await VerificationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = status;
    await request.save();

    // If approved, update user model and host model
    if (status === "approved") {
      const user = await User.findById(request.userId);
      if (!user) {
        return res.status(404).json({ message: "User associated with this request no longer exists" });
      }

      await User.findByIdAndUpdate(request.userId, {
        isVerified: true,
        isGenderVerified: true,
        isHost: true
      });

      // Check if host already exists
      let host = await Host.findOne({ userId: user._id });
      
      if (!host) {
        // Generate unique 6-digit hostId
        let hostId;
        let isUnique = false;
        while (!isUnique) {
          hostId = Math.floor(100000 + Math.random() * 900000).toString();
          const existingHostId = await Host.findOne({ hostId });
          if (!existingHostId) isUnique = true;
        }

        host = new Host({
          userId: user._id,
          name: user.name,
          phone: user.phone,
          gender: user.gender || "Female",
          isVerified: true,
          hostId: hostId,
          status: "Offline"
        });
        await host.save();
      } else {
        host.isVerified = true;
        await host.save();
      }
    } else {
      // If rejected, just set isGenderVerified to false (optional policy)
      await User.findByIdAndUpdate(request.userId, { isGenderVerified: false });
    }

    res.json({ message: `Request ${status} successfully`, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
