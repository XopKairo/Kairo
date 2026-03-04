import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const coinPackageSchema = new Schema({
  coins: { type: Number, required: true },
  priceINR: { type: Number, required: true },
  icon: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default model('CoinPackage', coinPackageSchema);
