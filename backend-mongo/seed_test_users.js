const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedTestUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const testUsers = [
      {
        name: 'Test User 1',
        email: 'testuser1',
        password: '123456test1',
        gender: 'Male',
        coins: 1000,
        zoraPoints: 10,
        status: 'offline'
      },
      {
        name: 'Test User 2',
        email: 'testuser2',
        password: '123456test2',
        gender: 'Female',
        coins: 1000,
        zoraPoints: 10,
        status: 'offline',
        isGenderVerified: true // Female test user verified for payouts
      }
    ];

    for (const u of testUsers) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log(`User ${u.email} already exists. Updating password...`);
        existing.password = u.password;
        existing.gender = u.gender;
        await existing.save();
      } else {
        await User.create(u);
        console.log(`Created user: ${u.email}`);
      }
    }

    console.log('Test users seeded successfully!');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding test users:', error.message);
    mongoose.disconnect();
  }
};

seedTestUsers();
