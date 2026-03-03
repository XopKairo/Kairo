const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  paymentMethods: {
    upiId: { type: String },
    bankDetails: {
      accountHolder: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String }
    }
  },
  status: { type: String, default: 'offline' },
  pushToken: { type: String, default: '' }
}, { timestamps: true });

// Add text index for search
userSchema.index({ name: 'text', email: 'text' });

// Ensure either email or phone is provided
userSchema.pre('validate', function() {
  if (!this.email && !this.phone) {
    throw new Error('Either email or phone must be provided.');
  }
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
