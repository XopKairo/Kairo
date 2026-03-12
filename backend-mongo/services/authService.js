import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import userRepository from "../repositories/userRepository.js";
import Post from "../models/Post.js";
import { getUserBadge } from "../utils/badgeSystem.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "343792605839-1siolslgaeo03t4a3he0tq3nbi7cfns0.apps.googleusercontent.com");

class AuthService {
  async sendOtp(contact) {
    return { success: true, message: "Use Firebase Client SDK to send OTP" };
  }

  async googleLogin(idToken) {
    const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: [
            "343792605839-1siolslgaeo03t4a3he0tq3nbi7cfns0.apps.googleusercontent.com", // Web client ID (often used for backend validation)
            "343792605839-h0babf10635vnohvmv1hi2m7ulgdsft4.apps.googleusercontent.com", // Android Client ID
        ],
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) throw new Error("Invalid Google Token");

    // Check if user exists by email (or a custom googleId field)
    // For now we will use email as the unique identifier for google users
    let user = await userRepository.findByPhone(payload.email); // using findByPhone to find by unique identifier since email isn't in schema. Let's update that.
    
    if (!user) {
        // Auto register if user doesn't exist
        user = await userRepository.createUser({
            name: payload.name || "Google User", 
            phone: payload.email, // using email in phone field for now to bypass schema limits, or you need to add email.
            firebaseUid: payload.sub,
            profilePicture: payload.picture || "",
            lastLoginDate: new Date(), 
            zoraPoints: 5, 
            coins: 0,
        });
    }

    if (user.isBanned) {
      if (user.banUntil && new Date() > user.banUntil) {
          user.isBanned = false;
          user.banUntil = null;
          user.banReason = "";
          await user.save();
      } else {
          throw new Error(`Account is banned: ${user.banReason || 'No reason provided'}`);
      }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    return { success: true, token, user, isNewUser: user.createdAt.getTime() === user.updatedAt.getTime() };
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
      if (user.isBanned) {
        // Check if ban has expired
        if (user.banUntil && new Date() > user.banUntil) {
           user.isBanned = false;
           user.banUntil = null;
           user.banReason = "";
           await user.save();
        } else {
           throw new Error(`Account is banned: ${user.banReason || 'No reason provided'}`);
        }
      }
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
      return { success: true, token, user };
    }
    throw new Error("User not found. Please register.");
  }

  async fastLogin(contact) {
    try {
      const cleanPhone = contact.toString().trim().replace(/\s+/g, "");
      if (!cleanPhone) throw new Error("Invalid contact info");

      let user = await userRepository.findByPhone(cleanPhone);
      
      if (!user) {
          // Auto register if user doesn't exist (Fast Login)
          // We must ensure firebaseUid is unique
          user = await userRepository.createUser({
              name: `User_${cleanPhone.slice(-4)}`, 
              phone: cleanPhone,
              firebaseUid: `FAST_${Date.now()}_${cleanPhone}`,
              lastLoginDate: new Date(), 
              zoraPoints: 5, 
              coins: 0,
              gender: "Female", // Default for Fast Login or can be asked later
              isVerified: false,
              isHost: false
          });
      }

      if (user.isBanned) {
        if (user.banUntil && new Date() > user.banUntil) {
            user.isBanned = false;
            user.banUntil = null;
            user.banReason = "";
            await user.save();
        } else {
            throw new Error(`Account is banned: ${user.banReason || 'No reason provided'}`);
        }
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
      return { success: true, token, user, isNewUser: user.createdAt.getTime() === user.updatedAt.getTime() };
    } catch (error) {
      console.error("Fast Login Error Service:", error.message);
      throw error;
    }
  }

  async deleteAccount(userId) {
    await userRepository.deleteById(userId);
    return { success: true, message: "Account deleted successfully" };
  }
}

export default new AuthService();
