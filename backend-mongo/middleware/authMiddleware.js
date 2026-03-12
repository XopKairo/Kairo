import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Blacklist from "../models/Blacklist.js";
import redisClient from "../config/redis.js";

// Protect Admin Middleware
export const protectAdmin = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const admin = await Admin.findById(decoded.id).select("-password");
      if (!admin || admin.role !== "admin") {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized as an admin" });
      }

      req.admin = admin;
      return next();
    } catch {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, token failed" });
    }
  }
  return res
    .status(401)
    .json({ success: false, message: "Not authorized, no token" });
};

// Protect User Middleware with Redis Caching (Performance Optimized)
export const protectUser = async (req, res, next) => {
  let token;

  // 1. IP Blacklist Check (Surgical Security)
  const clientIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const isBlacklisted = await Blacklist.findOne({ value: clientIP });
  if (isBlacklisted) {
    return res
      .status(403)
      .json({
        success: false,
        message: "Your access is restricted due to security violations.",
      });
  }

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const cacheKey = `user_status:${decoded.id}`;

      // Attempt to get user status from Redis
      let userStatus = await redisClient.get(cacheKey);

      if (userStatus) {
        userStatus = JSON.parse(userStatus);

        if (userStatus.isBanned) {
          return res
            .status(403)
            .json({ success: false, message: "Account is banned by admin" });
        }

        req.user = { id: decoded.id, ...userStatus };
        return next();
      }

      // If not in cache, fallback to Database
      const user = await User.findById(decoded.id).select(
        "isBanned name phone coins zoraPoints gender profilePicture isHost",
      );

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }

      if (user.isBanned) {
        // Cache the banned status too
        await redisClient.setEx(
          cacheKey,
          3600,
          JSON.stringify({ isBanned: true }),
        );
        return res
          .status(403)
          .json({ success: false, message: "Account is banned by admin" });
      }

      // Cache active user data (Expires in 10 mins)
      const userData = {
        isBanned: false,
        name: user.name,
        phone: user.phone,
        coins: user.coins,
        zoraPoints: user.zoraPoints,
        gender: user.gender,
        profilePicture: user.profilePicture,
        isHost: user.isHost,
      };

      await redisClient.setEx(cacheKey, 600, JSON.stringify(userData));

      req.user = user;
      return next();
    } catch (error) {
      console.error("[Auth Middleware Error]", error);
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, token failed" });
    }
  }
  return res
    .status(401)
    .json({ success: false, message: "Not authorized, no token" });
};
