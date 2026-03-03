const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({ $or: [{ email: /testuser/i }, { phone: /testuser/i }] });
    if (users.length > 0) {
      console.log('Test Users found:');
      users.forEach(u => {
        console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Phone: ${u.phone}, Banned: ${u.isBanned}`);
      });
    } else {
      console.log('No test users found in DB');
    }
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
