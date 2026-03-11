import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import userRepository from "../repositories/userRepository.js";
import Post from "../models/Post.js";
import { getUserBadge } from "../utils/badgeSystem.js";

class AuthService {
  async sendOtp(contact) {
    return { success: true, message: "Use Firebase Client SDK to send OTP" };
  }

  async verifyOtp(contact, firebaseToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      const phone = decodedToken.phone_number.replace(/\s+/g, "");
      const cleanContact = contact.toString().trim().replace(/\s+/g, "");

      if (!phone || phone !== cleanContact) {
        throw new Error("Phone number mismatch with Firebase token");
      }

      const otpVerifiedToken = jwt.sign(
        { contact: phone, verified: true, firebaseUid: decodedToken.uid },
        process.env.JWT_SECRET,
        { expiresIn: "15m" },
      );
      return { success: true, message: "Token Verified", otp_verified_token: otpVerifiedToken };
    } catch (error) {
      console.error("Verify Error:", error.message);
      throw new Error("Invalid or expired Firebase token");
    }
  }

  async register(data) {
    const { name, phone, otp_verified_token, gender, dob, state, district, profilePicture, languages } = data;
    const cleanPhone = phone.toString().trim().replace(/\s+/g, "");
    
    if (!otp_verified_token) throw new Error("Verification token missing");
    const decoded = jwt.verify(otp_verified_token, process.env.JWT_SECRET);

    if (decoded.contact.replace(/\s+/g, "") !== cleanPhone || !decoded.verified) {
      throw new Error("Verification mismatch");
    }

    const userExists = await userRepository.findByPhone(cleanPhone);
    if (userExists) throw new Error("User already exists");

    const locationString = (district && state) ? `${district}, ${state}` : state || district || "";
    const user = await userRepository.createUser({
      name: name.trim(), phone: cleanPhone, firebaseUid: decoded.firebaseUid,
      gender, dob, location: locationString, profilePicture, languages,
      lastLoginDate: new Date(), zoraPoints: 5, coins: 0,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    return { success: true, token, user };
  }

  async login(contact, otp_verified_token) {
    const cleanPhone = contact.toString().trim().replace(/\s+/g, "");
    if (!otp_verified_token) throw new Error("Verification token missing");
    const decoded = jwt.verify(otp_verified_token, process.env.JWT_SECRET);

    if (decoded.contact.replace(/\s+/g, "") !== cleanPhone || !decoded.verified) {
      throw new Error("Verification mismatch");
    }

    const user = await userRepository.findByPhone(cleanPhone);
    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
      return { success: true, token, user };
    }
    throw new Error("User not found. Please register.");
  }

  async deleteAccount(userId) {
    await userRepository.deleteById(userId);
    return { success: true, message: "Account deleted successfully" };
  }
}

export default new AuthService();
