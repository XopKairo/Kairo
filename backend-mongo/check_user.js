const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ name: /Ajil/i });
  if (user) {
    console.log('User found:', user.name, user.email || user.phone);
  } else {
    console.log('User Ajil not found in DB');
  }
  process.exit();
}
check();
