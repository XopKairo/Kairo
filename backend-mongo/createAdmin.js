const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const username = 'admin';
    const email = 'omalloorajil@gmail.com';
    const password = 'adminpassword123';
    const phone = '+917356704978';
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existingAdmin) {
      console.log('Admin already exists. Deleting it to recreate with the password you tried...');
      await Admin.deleteOne({ _id: existingAdmin._id });
    }

    const admin = new Admin({ username, email, password, phone });
    await admin.save();
    
    console.log('Admin user created successfully!');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone}`);
    console.log(`Password: ${password}`);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin:', error);
    mongoose.disconnect();
  }
};

createAdmin();
