import mongoose from 'mongoose';
import 'dotenv/config';
import Admin from './models/Admin.js';

const seedAdmin = async () => {
  console.log('🔄 Starting standalone admin seeding process...');

  const mongoUri = process.env.MONGO_URI;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!mongoUri) {
    console.error('❌ Error: MONGO_URI is missing from environment variables.');
    process.exit(1);
  }

  if (!adminEmail || !adminPassword) {
    console.error('❌ Error: ADMIN_EMAIL or ADMIN_PASSWORD is missing from environment variables.');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB successfully.');

    // Check if any admin exists
    const existingAdmin = await Admin.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log(`ℹ️ An admin account already exists (Email: ${existingAdmin.email}).`);
      console.log('⏭️ Skipping creation to prevent overwriting existing credentials.');
    } else {
      console.log(`⏳ Creating new admin account for ${adminEmail}...`);
      
      const newAdmin = new Admin({
        username: 'admin', // Default username
        email: adminEmail,
        password: adminPassword, // Will be automatically hashed by Admin.js pre-save hook
        role: 'admin'
      });

      await newAdmin.save();
      console.log('✅ SUCCESS: Initial admin account created and saved to MongoDB!');
    }

    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('👋 Process complete.');
    process.exit(0);

  } catch (error) {
    console.error('❌ CRITICAL ERROR during seeding:', error.message);
    process.exit(1);
  }
};

seedAdmin();