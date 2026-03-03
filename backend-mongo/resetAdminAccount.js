const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define the schema locally to ensure absolute control over the collection and fields
const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' }
}, { collection: 'admins' });

const Admin = mongoose.model('AdminReset', AdminSchema);

const reset = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('ERROR: MONGO_URI not found in .env file');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('Clearing existing admin accounts...');
    await Admin.deleteMany({});

    console.log('Hashing new password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('adminpassword123', salt);

    console.log('Creating fresh admin document...');
    await Admin.create({
      username: 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@kairo.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('---------------------------');
    console.log('Admin reset successfully');
    console.log('Username: admin');
    console.log('Password: adminpassword123');
    console.log('Collection: admins');
    console.log('---------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Reset Failed:', err);
    process.exit(1);
  }
};

reset();
