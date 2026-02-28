const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const verifyAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admins = await Admin.find({});
    console.log('Admins in DB:', admins.map(a => a.email));
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
    mongoose.disconnect();
  }
};

verifyAdmin();
