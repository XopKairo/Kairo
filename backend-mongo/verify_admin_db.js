const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('./models/Admin');

const diagnostic = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is missing in .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL || 'omalloorajil@gmail.com';
    const username = process.env.ADMIN_USERNAME || 'admin';
    const testPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';

    console.log(`Searching for admin with username: "${username}" or email: "${email}"`);
    
    const admin = await Admin.findOne({ $or: [{ email }, { username }] });

    if (!admin) {
      console.log('CRITICAL: No admin user found in "admins" collection.');
    } else {
      console.log('Admin document found:');
      console.log({
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        password_hashed: admin.password ? `${admin.password.substring(0, 10)}...` : 'MISSING',
        collection: admin.constructor.collection.name
      });

      const isMatch = await bcrypt.compare(testPassword, admin.password);
      console.log(`Manual password comparison for "${testPassword}": ${isMatch ? 'PASSED' : 'FAILED'}`);
      
      if (!isMatch) {
        console.log('Attempting to re-hash and update password...');
        admin.password = testPassword; // Should trigger pre-save hook
        await admin.save();
        console.log('Password updated and hashed.');
        
        const secondCheck = await bcrypt.compare(testPassword, admin.password);
        console.log(`Second check after update: ${secondCheck ? 'PASSED' : 'FAILED'}`);
      }
    }

    mongoose.connection.close();
  } catch (err) {
    console.error('Diagnostic Error:', err);
    process.exit(1);
  }
};

diagnostic();
