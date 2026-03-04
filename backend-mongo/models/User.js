import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  nickname: { type: String, default: '' },
  location: { type: String, default: '' },
  interests: [{ type: String }],
  coins: { type: Number, default: 0 },
  zoraPoints: { type: Number, default: 0 },
  lastLoginDate: { type: Date },
  isBanned: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  profilePicture: { type: String, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: false },
  verificationSelfie: { type: String, required: false, default: '' },
  isGenderVerified: { type: Boolean, default: false },
  status: { type: String, default: 'offline' },
  pushToken: { type: String, default: '' }
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
