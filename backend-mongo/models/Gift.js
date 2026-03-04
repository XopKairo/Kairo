const mongoose = import('mongoose');

const giftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  coinCost: { type: Number, required: true },
  iconUrl: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Gift', giftSchema);
