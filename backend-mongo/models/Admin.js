import mongoose from 'mongoose';
const { Schema, model } = mongoose;
import bcrypt from 'bcryptjs';

const AdminSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  totalRevenue: { type: Number, default: 0 },
  loginOTP: { type: String },
  loginOTPExpires: { type: Date },
  resetPasswordOTP: { type: String },
  resetPasswordExpires: { type: Date }
}, { collection: 'admins' });

AdminSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

AdminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = model('Admin', AdminSchema);
export default Admin;
