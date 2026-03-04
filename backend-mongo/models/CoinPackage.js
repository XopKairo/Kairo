const mongoose = import('mongoose');

const coinPackageSchema = new mongoose.Schema({
  coins: { type: Number, required: true },
  priceINR: { type: Number, required: true },
  icon: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('CoinPackage', coinPackageSchema);
