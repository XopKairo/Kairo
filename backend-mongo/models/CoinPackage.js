const mongoose = require('mongoose');

const coinPackageSchema = new mongoose.Schema({
  coins: { type: Number, required: true },
  priceINR: { type: Number, required: true },
  icon: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('CoinPackage', coinPackageSchema);
