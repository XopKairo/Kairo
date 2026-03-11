import "dotenv/config";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import InterestTag from "../models/InterestTag.js";
import CoinPackage from "../models/CoinPackage.js";
import logger from "../utils/logger.js";

export const seedAdmin = async () => {
  try {
    // Drop legacy user indexes
    try {
      const User = mongoose.model("User");
      await User.collection.dropIndex("email_1");
      logger.info("✅ Legacy user email index dropped");
    } catch (e) {}

    // Drop legacy transaction indexes
    try {
      const Transaction = mongoose.model("Transaction");
      await Transaction.collection.dropIndex("razorpayOrderId_1");
      await Transaction.collection.dropIndex("cashfreeOrderId_1");
      logger.info("✅ Legacy transaction indexes dropped");
    } catch (e) {}

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) return;

    const anyAdminExists = await Admin.findOne({ role: "admin" });
    if (!anyAdminExists) {
      const admin = new Admin({ username: "admin", email: adminEmail, password: adminPassword, role: "admin" });
      await admin.save();
      logger.info(`✅ Initial admin created: ${adminEmail}`);
    }
  } catch (error) {
    logger.error(`❌ Admin seeding failed: ${error.message}`);
  }
};

export const seedInterests = async () => {
  try {
    const count = await InterestTag.countDocuments();
    if (count === 0) {
      const defaultInterests = [
        { name: "Gaming", isActive: true }, { name: "Music", isActive: true },
        { name: "Movies", isActive: true }, { name: "Dance", isActive: true },
        { name: "Cooking", isActive: true }, { name: "Travel", isActive: true },
        { name: "Fitness", isActive: true }, { name: "Art", isActive: true },
        { name: "Technology", isActive: true }, { name: "Fashion", isActive: true }
      ];
      await InterestTag.insertMany(defaultInterests);
      logger.info("✅ Default interests seeded");
    }
  } catch (error) {
    logger.error(`❌ Interests seeding failed: ${error.message}`);
  }
};

export const seedPackages = async () => {
  try {
    const count = await CoinPackage.countDocuments();
    if (count === 0) {
      const defaultPackages = [
        { coins: 100, priceINR: 9, bonus: 0, isActive: true },
        { coins: 500, priceINR: 49, bonus: 20, isActive: true },
        { coins: 1000, priceINR: 99, bonus: 50, isActive: true },
        { coins: 2000, priceINR: 189, bonus: 150, isActive: true },
        { coins: 5000, priceINR: 449, bonus: 500, isActive: true },
        { coins: 10000, priceINR: 849, bonus: 1200, isActive: true }
      ];
      await CoinPackage.insertMany(defaultPackages);
      logger.info("✅ Default coin packages seeded");
    }
  } catch (error) {
    logger.error(`❌ Packages seeding failed: ${error.message}`);
  }
};
