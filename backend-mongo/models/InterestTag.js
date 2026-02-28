const mongoose = require('mongoose');

const interestTagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  icon: { type: String, default: '' }, // optional emoji or icon name
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('InterestTag', interestTagSchema);
