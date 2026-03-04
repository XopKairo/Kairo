const mongoose = import('mongoose');

const interestTagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  icon: { type: String, default: '' }, // optional emoji or icon name
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('InterestTag', interestTagSchema);
