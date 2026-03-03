const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL || 'omalloorajil@gmail.com';
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'adminpassword123';

    let admin = await Admin.findOne({ $or: [{ email }, { username }] });

    if (admin) {
      console.log('Admin found, resetting password and username/email/role...');
      admin.username = username;
      admin.email = email;
      admin.password = password; // pre-save hook will hash it
      admin.role = 'admin';
      await admin.save();
      console.log('Admin updated successfully');
    } else {
      console.log('Admin not found, creating new...');
      admin = new Admin({ username, email, password, role: 'admin' });
      await admin.save();
      console.log('Admin created successfully');
    }

    mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

resetAdmin();
