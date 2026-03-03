const mongoose = require('mongoose');
require('dotenv').config();
const Admin = require('./models/Admin');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admins = await Admin.find({});
    if (admins.length > 0) {
      console.log('Admins found:');
      admins.forEach(a => {
        console.log(`- ID: ${a._id}, Username: ${a.username}, Email: ${a.email}`);
      });
    } else {
      console.log('No admins found in DB');
    }
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
