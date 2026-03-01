const mongoose = require('mongoose');

const agencySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  ownerName: { type: String, required: true },
  phone: { type: String },
  hostCount: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 10 }, // Agency commission percentage
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Agency', agencySchema);
