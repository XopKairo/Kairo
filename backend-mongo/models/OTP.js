const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  contact: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Auto-delete document 120 seconds after it expires to allow for server grace period
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 120 });

module.exports = mongoose.model('OTP', otpSchema);
