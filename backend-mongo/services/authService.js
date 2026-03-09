import jwt from "jsonwebtoken";
import twilio from "twilio";
import nodemailer from "nodemailer";
import authRepository from "../repositories/authRepository.js";
import userRepository from "../repositories/userRepository.js";
import Post from "../models/Post.js";
import { getUserBadge } from "../utils/badgeSystem.js";

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

class AuthService {
  async sendOtp(contact) {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await authRepository.updateOtp(contact, otp, expiresAt);

    console.log(`[LIVE OTP] Sent to ${contact}: ${otp}`);

    if (twilioClient && contact.startsWith("+")) {
      try {
        await Promise.race([
          twilioClient.messages.create({
            body: `Your Zora verification code is: ${otp}. Valid for 10 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: contact,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Twilio Timeout")), 10000),
          ),
        ]);
        return { success: true, message: "OTP sent via SMS" };
      } catch (error) {
        throw new Error(`SMS Error: ${error.message}`);
      }
    }

    return { success: true, message: "OTP generated (Dev Mode)" };
  }

  async verifyOtp(contact, otp) {
    const storedOtpData = await authRepository.findOtpByContact(contact);

    if (!storedOtpData) throw new Error("OTP not requested or expired");

    if (Date.now() > new Date(storedOtpData.expiresAt).getTime()) {
      throw new Error("OTP expired");
    }

    if (storedOtpData.otp !== otp) throw new Error("Invalid OTP");

    const otpVerifiedToken = jwt.sign(
      { contact, verified: true },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    return {
      success: true,
      message: "OTP Verified",
      otp_verified_token: otpVerifiedToken,
    };
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

    if (!otp_verified_token) throw new Error("OTP token missing");

    const decoded = jwt.verify(otp_verified_token, process.env.JWT_SECRET);
    const registeredContact = phone.toString().trim();
    const decodedContact = decoded.contact.toString().trim();

    if (decodedContact !== registeredContact || !decoded.verified) {
      throw new Error("OTP verification mismatch");
    }

    const userExists = await userRepository.findByContact(phone);
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

    await authRepository.deleteOtp(decodedContact);

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
    if (!otp_verified_token) throw new Error("OTP token missing");

    const decoded = jwt.verify(otp_verified_token, process.env.JWT_SECRET);
    if (decoded.contact.toString().trim() !== contact.toString().trim() || !decoded.verified) {
      throw new Error("OTP verification mismatch");
    }

    const user = await userRepository.findByContact(contact);

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

      await authRepository.deleteOtp(contact);

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

  async resetPassword(data) {
    const { contact, password, otp_verified_token } = data;
    if (!otp_verified_token) throw new Error("OTP token missing");

    const decoded = jwt.verify(otp_verified_token, process.env.JWT_SECRET);
    if (decoded.contact !== contact || !decoded.verified) {
      throw new Error("OTP verification mismatch");
    }

    const user = await userRepository.findByContact(contact);
    if (!user) throw new Error("User not found");

    user.password = password;
    await user.save();

    await authRepository.deleteOtp(contact);
    return { success: true, message: "Password reset successful" };
  }

  async deleteAccount(userId) {
    const user = await userRepository.deleteById(userId);
    if (!user) throw new Error("User not found");

    await Post.deleteMany({ userId });
    return { success: true, message: "Account deleted successfully" };
  }
}

export default new AuthService();
