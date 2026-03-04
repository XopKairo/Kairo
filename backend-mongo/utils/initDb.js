import mongoose from 'mongoose';
import 'dotenv/config';
import Admin from './models/Admin.js';
import logger from './utils/logger.js';

export const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      logger.warn('⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables. Skipping auto-seed.');
      return;
    }

    const adminExists = await Admin.findOne({ email: adminEmail });

    if (!adminExists) {
      const admin = new Admin({
        username: 'admin',
        email: adminEmail,
        password: adminPassword, // Password will be hashed automatically by the pre-save hook in Admin.js
        role: 'admin'
      });
      await admin.save();
      logger.info(`✅ Initial admin user created successfully for: ${adminEmail}`);
    } else {
      logger.info(`ℹ️ Admin user already exists for: ${adminEmail}`);
    }
  } catch (error) {
    logger.error(`❌ Admin seeding failed: ${error.message}`);
  }
};
