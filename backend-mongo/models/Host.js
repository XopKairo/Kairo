const mongoose = require('mongoose');

const hostSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Online', 'Busy', 'Offline'], default: 'Offline' },
  earnings: { type: Number, default: 0 }, // Host's earnings from calls
  rating: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Host', hostSchema);
