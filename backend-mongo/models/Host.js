const mongoose = require('mongoose');

const hostSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Online', 'Busy', 'Offline'], default: 'Offline' },
  earnings: { type: Number, default: 0 }, // Host's earnings from calls
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Female' },
  verificationSelfie: { type: String, default: '' },
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
  rating: { type: Number, default: 0 },
  callRatePerMinute: { type: Number, default: 30 },
  isVerified: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Host', hostSchema);
