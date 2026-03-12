import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import OTP from "../models/OTP.js";
import logger from "../utils/logger.js";
import nodemailer from "nodemailer";

// Token Generation Helpers
const generateAccessToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("FATAL: JWT_SECRET environment variable is missing.");
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (id, role) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    // Fallback to JWT_SECRET if refresh secret isn't explicitly set to prevent crash
    const secret = process.env.JWT_SECRET;
    if (!secret)
      throw new Error("FATAL: JWT_SECRET environment variable is missing.");
    return jwt.sign({ id, role }, secret, { expiresIn: "7d" });
  }
  return jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export const authAdmin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required" });
  }

  try {
    // 1. Find the admin
    const admin = await Admin.findOne({
      $or: [{ username: username }, { email: username }],
    });

    if (!admin) {
      logger.warn(`Failed login: Admin not found for: ${username}`);
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid credentials (User not found)",
        });
    }

    // 2. Verify password
    let isMatch = false;
    try {
      isMatch = await admin.matchPassword(password);
    } catch (bcryptErr) {
      logger.error(`Bcrypt compare error: ${bcryptErr.message}`);
      throw new Error("Password verification failed internally");
    }

    if (!isMatch) {
      logger.warn(`Failed login: Incorrect password for: ${username}`);
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid credentials (Incorrect password)",
        });
    }

    // 3. Generate Tokens
    const accessToken = generateAccessToken(admin._id, "admin");
    const refreshToken = generateRefreshToken(admin._id, "admin");

    logger.info(`✅ Admin logged in successfully: ${username}`);
    return res.status(200).json({
      success: true,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: "admin",
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error(
      `❌ Admin Auth 500 Crash: ${error.message}\nStack: ${error.stack}`,
    );
    return res.status(500).json({
      success: false,
      message: "Internal Server Error during login",
      errorDetails: error.message,
      stack: error.stack
    });
  }
};

export const refreshTokens = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = generateAccessToken(decoded.id, decoded.role);
    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

export const requestAdminUpdateOTP = async (req, res) => {
  try {
    const admin = req.admin;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.findOneAndUpdate(
      { contact: admin.email },
      { otp, expiresAt },
      { upsert: true, new: true },
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Zora Admin Security" <${process.env.EMAIL_USER}>`,
      to: admin.email,
      subject: "Admin Profile Update - Verification Code",
      text: `Your OTP to update admin credentials is: ${otp}. It is valid for 10 minutes.`,
    });

    res.json({ success: true, message: `OTP sent to ${admin.email}` });
  } catch (error) {
    logger.error(`Admin OTP Error: ${error.message}`);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to send OTP. Check email config.",
      });
  }
};

export const updateAdminProfile = async (req, res) => {
  const { otp, newUsername, newEmail, newPassword } = req.body;
  const admin = req.admin;

  try {
    const storedOtpData = await OTP.findOne({ contact: admin.email });

    if (!storedOtpData)
      return res
        .status(400)
        .json({ success: false, message: "OTP not requested or expired" });
    if (Date.now() > new Date(storedOtpData.expiresAt).getTime()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }
    if (storedOtpData.otp !== otp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    // Validate if new email/username is already taken by another admin
    if (newUsername && newUsername !== admin.username) {
      const usernameExists = await Admin.findOne({ username: newUsername });
      if (usernameExists)
        return res
          .status(400)
          .json({ success: false, message: "Username already taken" });
      admin.username = newUsername;
    }

    if (newEmail && newEmail !== admin.email) {
      const emailExists = await Admin.findOne({ email: newEmail });
      if (emailExists)
        return res
          .status(400)
          .json({ success: false, message: "Email already taken" });
      admin.email = newEmail;
    }

    if (newPassword && newPassword.trim() !== "") {
      admin.password = newPassword; // Will be hashed by pre-save hook
    }

    await admin.save();
    await OTP.deleteOne({ contact: admin.email }); // Cleanup OTP

    logger.info(`Admin profile updated for: ${admin.email}`);
    res.json({
      success: true,
      message: "Admin profile updated successfully",
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: "admin",
      },
    });
  } catch (error) {
    logger.error(`Admin Profile Update Error: ${error.message}`);
    res
      .status(500)
      .json({ success: false, message: "Server error during profile update" });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    res.json({
      success: true,
      user: {
        id: admin._id,
        name: admin.name || admin.username,
        username: admin.username,
        email: admin.email,
        role: "ADMIN",
      },
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Server error fetching profile" });
  }
};
