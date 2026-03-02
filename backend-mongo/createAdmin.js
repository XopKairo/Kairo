const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'securepassword123';
    const phone = process.env.ADMIN_PHONE || '+910000000000';
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existingAdmin) {
      console.log('Admin already exists. Deleting it to recreate with environment credentials...');
      await Admin.deleteOne({ _id: existingAdmin._id });
    }

    const admin = new Admin({ username, email, password, phone });
    await admin.save();
    
    console.log('Admin user created successfully using environment variables!');
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin:', error);
    mongoose.disconnect();
  }
};

createAdmin();
