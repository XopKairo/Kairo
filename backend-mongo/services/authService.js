import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import authRepository from "../repositories/authRepository.js";
import userRepository from "../repositories/userRepository.js";
import Post from "../models/Post.js";
import { getUserBadge } from "../utils/badgeSystem.js";

// Firebase Admin is already initialized in pushService.js, 
// but we ensure it's accessible here.

class AuthService {
  async sendOtp(contact) {
    // With Firebase Phone Auth, the client handles SMS sending.
    // This backend route is now a placeholder or for custom logging.
    console.log(`[FIREBASE OTP] Client will request OTP for ${contact}`);
    return { success: true, message: "Please use Firebase Client SDK to send OTP" };
  }

  async verifyOtp(contact, firebaseToken) {
    try {
      // Verify the ID Token from Firebase
      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      const phone = decodedToken.phone_number;

      if (!phone || phone.replace(/\s+/g, '') !== contact.replace(/\s+/g, '')) {
        throw new Error("Phone number mismatch with Firebase token");
      }

      // Generate a short-lived internal token to proceed with Zora login/register
      const otpVerifiedToken = jwt.sign(
        { contact: phone, verified: true, firebaseUid: decodedToken.uid },
        process.env.JWT_SECRET,
        { expiresIn: "15m" },
      );

      return {
        success: true,
        message: "Firebase Token Verified",
        otp_verified_token: otpVerifiedToken,
      };
    } catch (error) {
      console.error("Firebase Verify Error:", error);
      throw new Error("Invalid or expired Firebase token");
    }
  }

  async register(data) {
    const { name, phone, otp_verified_token, gender, dob, state, district, profilePicture, languages } = data;

    // Beta Check
    if (process.env.APP_MODE === "beta") {
      const whitelist = (process.env.BETA_WHITELIST || "")
        .split(",")
        .map((i) => i.trim());
      const isWhitelisted = whitelist.includes(phone);
      if (!isWhitelisted) throw new Error("BETA_ONLY");
    }

    if (!otp_verified_token) throw new Error("Verification token missing");

    const decoded = jwt.verify(otp_verified_token, process.env.JWT_SECRET);
    const registeredContact = phone.toString().trim();
    const decodedContact = decoded.contact.toString().trim();

    if (decodedContact !== registeredContact || !decoded.verified) {
      throw new Error("Verification mismatch");
    }

    const userExists = await userRepository.findByPhone(phone);
    if (userExists) throw new Error("User already exists");
    
    // Calculate Age from DOB
    let age = null;
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    const locationString = (district && state) ? `${district}, ${state}` : state || district || "";

    const user = await userRepository.createUser({
      name: name.trim(),
      phone: phone ? phone.trim() : undefined,
      firebaseUid: decoded.firebaseUid,
      gender,
      dob,
      age,
      state,
      district,
      location: locationString,
      profilePicture,
      languages,
      lastLoginDate: new Date(),
      zoraPoints: 5,
      coins: 0,
    });

    const expiry = process.env.USER_JWT_EXPIRY || "30d";
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: expiry,
    });
    const badge = getUserBadge(user.zoraPoints);

    return {
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        coins: user.coins,
        zoraPoints: user.zoraPoints,
        badge,
      },
    };
  }

  async login(contact, otp_verified_token) {
    if (!otp_verified_token) throw new Error("Verification token missing");

    const decoded = jwt.verify(otp_verified_token, process.env.JWT_SECRET);
    if (decoded.contact.toString().trim() !== contact.toString().trim() || !decoded.verified) {
      throw new Error("Verification mismatch");
    }

    const user = await userRepository.findByPhone(contact);

    if (user) {
      if (user.isBanned) throw new Error("Account is banned");

      const today = new Date().setHours(0, 0, 0, 0);
      const lastLogin = user.lastLoginDate
        ? new Date(user.lastLoginDate).setHours(0, 0, 0, 0)
        : 0;

      let updatedUser = user;
      if (today > lastLogin || !user.lastLoginDate) {
        updatedUser = await userRepository.updateLoginPoints(user._id);
      }

      const badge = getUserBadge(updatedUser.zoraPoints);
      const expiry = process.env.USER_JWT_EXPIRY || "30d";
      const token = jwt.sign({ id: updatedUser._id }, process.env.JWT_SECRET, {
        expiresIn: expiry,
      });

      return {
        success: true,
        token,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          phone: updatedUser.phone,
          coins: updatedUser.coins,
          zoraPoints: updatedUser.zoraPoints,
          badge,
        },
      };
    }
    throw new Error("User not found. Please register.");
  }

  async deleteAccount(userId) {
    const user = await userRepository.deleteById(userId);
    if (!user) throw new Error("User not found");

    await Post.deleteMany({ userId });
    return { success: true, message: "Account deleted successfully" };
  }
}

export default new AuthService();
