import authService from "../services/authService.js";
import User from "../models/User.js";
import Host from "../models/Host.js";
import admin from "../config/firebaseAdmin.js";
import generateToken, { generateRefreshToken } from "../utils/generateToken.js";

class UserAuthController {
  async firebaseLogin(req, res) {
    try {
      const { idToken } = req.body;
      if (!idToken) return res.status(400).json({ success: false, message: "ID token is required" });

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const phone = decodedToken.phone_number;
      
      if (!phone) {
         return res.status(400).json({ success: false, message: "Phone number not found in token" });
      }

      let user = await User.findOne({ phone });
      let isNewUser = false;
      
      if (!user) {
        user = await User.create({ 
           phone, 
           isNewUser: true,
           firebaseUid: decodedToken.uid,
           lastLoginDate: new Date(), 
           zoraPoints: 5, 
           coins: 0,
           name: `User_${phone.slice(-4)}`,
           gender: "Male" // Default
        });
        isNewUser = true;
      }
      
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      res.json({ success: true, token, refreshToken, user, isNewUser });
    } catch (error) {
      console.error("Firebase Login Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async register(req, res) {
    try {
      let data = req.body;
      
      // If we have a file, add it to the data
      if (req.file) {
        data.profilePicture = req.file.path;
      }

      // Handle strings if data is sent as FormData (which sometimes sends strings instead of objects)
      if (typeof data.languages === 'string') {
        try {
          data.languages = JSON.parse(data.languages);
        } catch (e) {
          data.languages = data.languages.split(',');
        }
      }

      const result = await authService.register(data);
      res.status(201).json(result);
    } catch (error) {
      if (error.message === "BETA_ONLY") {
        return res.status(403).json({
          success: false,
          message:
            "Registration is currently limited to beta testers. Please contact support.",
        });
      }
      if (
        error.name === "TokenExpiredError" ||
        error.name === "JsonWebTokenError"
      ) {
        return res
          .status(403)
          .json({ success: false, message: "OTP token invalid or expired" });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async googleLogin(req, res) {
    try {
      const { idToken } = req.body;
      if (!idToken) return res.status(400).json({ success: false, message: "Google ID token required" });
      
      const result = await authService.googleLogin(idToken);
      res.status(200).json(result);
    } catch (error) {
      if (error.message.startsWith("Account is banned")) {
        return res.status(403).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async fastLogin(req, res) {
    try {
      const { contact } = req.body;
      if (!contact) return res.status(400).json({ success: false, message: "Contact required" });
      
      const result = await authService.fastLogin(contact);
      res.status(200).json(result);
    } catch (error) {
      console.error("Fast Login Controller Error:", error.message);
      if (error.message.startsWith("Account is banned")) {
        return res.status(403).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message || "Internal server error during fast login" });
    }
  }

  async sendOtp(req, res) {
    try {
      const { contact } = req.body;
      if (!contact) return res.status(400).json({ success: false, message: "Contact is required" });
      const result = await authService.sendOtp(contact);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async verifyOtp(req, res) {
    try {
      const { contact, otp } = req.body;
      if (!contact || !otp) return res.status(400).json({ success: false, message: "Contact and OTP are required" });
      const result = await authService.verifyOtp(contact, otp);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteAccount(req, res) {
    try {
      const userId = req.user?._id || req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const result = await authService.deleteAccount(userId);
      res.status(200).json(result);
    } catch (error) {
      if (error.message === "User not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user._id || req.user.id;
      console.log("Updating profile for user:", userId, "Data:", req.body);
      
      const updateData = {};
      const fields = ['name', 'bio', 'age', 'location', 'gender', 'isVipOnly', 'callRatePerMinute', 'interests', 'languages'];
      
      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          if (field === 'languages' || field === 'interests') {
            updateData[field] = Array.isArray(req.body[field]) ? req.body[field] : 
                               (typeof req.body[field] === 'string' ? req.body[field].split(',') : req.body[field]);
          } else if (field === 'isVipOnly') {
            updateData[field] = req.body[field] === "true" || req.body[field] === true;
          } else if (field === 'callRatePerMinute' || field === 'age') {
            updateData[field] = parseInt(req.body[field]);
          } else {
            updateData[field] = req.body[field];
          }
        }
      });

      if (req.files) {
        if (req.files["image"]) updateData.profilePicture = req.files["image"][0].path;
        if (req.files["moments"]) updateData.photos = req.files["moments"].map(f => f.path);
        if (req.files["video"]) updateData.shortVideoUrl = req.files["video"][0].path;
      }

      // Fallback for single upload (image)
      if (req.file) updateData.profilePicture = req.file.path;

      const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });

      // Also update Host model if it exists
      await Host.findOneAndUpdate(
        { userId: user._id }, 
        { ...updateData, profilePicture: user.profilePicture, photos: user.photos }, 
        { new: true }
      );

      res.json({ success: true, user });
    } catch (error) {
      console.error("Update Profile Error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user._id || req.user.id;
      const user = await User.findById(userId).lean();
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (user.isHost) {
        user.earnings = user.cashBalance || 0;
      }

      res.json(user);
    } catch (error) {
      console.error("Get Profile Error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async upgradeToHost(req, res) {
    try {
      const userId = req.user._id || req.user.id;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      // --- Smart Phone Validation (Anti-Fake Guard) ---
      const phone = user.phone ? user.phone.replace("+91", "").trim() : "";
      
      const isRepeated = /^(\d)\1{9}$/.test(phone);
      const isSequence = ["1234567890", "0123456789", "9876543210", "0987654321"].includes(phone);
      const isInvalidStart = !/^[6-9]/.test(phone);

      if (phone && (isRepeated || isSequence || isInvalidStart)) {
        return res.status(400).json({ 
          success: false, 
          message: "Host registration denied: Please update your profile with a valid personal mobile number first." 
        });
      }

      // Update User model
      user.isHost = true;
      await user.save();

      // Check if Host record already exists, if not create one
      let host = await Host.findOne({ userId: user._id });
      if (!host) {
        host = new Host({
          userId: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          hostId: Math.floor(100000 + Math.random() * 900000).toString(),
          profilePicture: user.profilePicture,
          gender: user.gender,
          isVerified: false,
          status: "Offline"
        });
        await host.save();
      }

      res.json({ success: true, message: "Upgraded to host successfully", user, host });
    } catch (error) {
      console.error("Error upgrading host:", error);
      res.status(500).json({ success: false, message: "Failed to upgrade to host" });
    }
  }
}

export default new UserAuthController();
