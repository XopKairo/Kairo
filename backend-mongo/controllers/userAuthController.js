import authService from "../services/authService.js";
import User from "../models/User.js";
import Host from "../models/Host.js";

class UserAuthController {
  async sendOtp(req, res) {
    try {
      const { contact } = req.body;
      if (!contact)
        return res
          .status(400)
          .json({ success: false, message: "Contact info required" });
      const result = await authService.sendOtp(contact);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async verifyOtp(req, res) {
    try {
      const { contact, otp } = req.body;
      const result = await authService.verifyOtp(contact, otp);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
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

  async login(req, res) {
    try {
      const { contact, otp_verified_token } = req.body;
      const result = await authService.login(contact, otp_verified_token);
      res.status(200).json(result);
    } catch (error) {
      if (error.message === "User not found. Please register." || error.message === "OTP verification mismatch" || error.message === "OTP token missing") {
        return res.status(401).json({ success: false, message: error.message });
      }
      if (error.message.startsWith("Account is banned")) {
        return res.status(403).json({ success: false, message: error.message });
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

  async deleteAccount(req, res) {
    try {
      const result = await authService.deleteAccount(req.params.id);
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
      const userId = req.user._id;
      console.log("Updating profile for user:", userId, "Data:", req.body);
      const { name, bio, age, location, gender, languages, isVipOnly, callRatePerMinute } = req.body;

      const updateData = { 
        name, bio, age, location, gender, 
        languages: Array.isArray(languages) ? languages : languages ? languages.split(',') : [],
        isVipOnly: isVipOnly === "true",
        callRatePerMinute: parseInt(callRatePerMinute) || 30
      };

      if (req.files && req.files["image"]) updateData.profilePicture = req.files["image"][0].path;
      if (req.files && req.files["moments"]) updateData.photos = req.files["moments"].map(f => f.path);
      if (req.files && req.files["video"]) updateData.shortVideoUrl = req.files["video"][0].path;

      // Fallback for single upload (image)
      if (req.file) updateData.profilePicture = req.file.path;

      const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

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
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get Profile Error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new UserAuthController();
