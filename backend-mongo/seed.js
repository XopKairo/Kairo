import mongoose from 'mongoose';
import 'dotenv/config';
import User from './models/User.js';
import Host from './models/Host.js';
import Admin from './models/Admin.js';

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🌱 Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Host.deleteMany({});
    await Admin.deleteMany({});

    // Create Admin
    const admin = new Admin({
      username: 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@kairo.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin'
    });
    await admin.save();
    console.log('✅ Admin user created');

    // Create Sample User
    const user = new User({
      name: 'John Doe',
      phone: '9876543210',
      email: 'john@example.com',
      password: 'password123',
      coins: 1000,
      zoraPoints: 50
    });
    await user.save();
    console.log('✅ Sample user created');

    // Create Sample Host
    const host = new Host({
      name: 'Alice Host',
      email: 'alice@kairo.com',
      status: 'Online',
      callRatePerMinute: 30,
      isVerified: true
    });
    await host.save();
    console.log('✅ Sample host created');

    console.log('🚀 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
