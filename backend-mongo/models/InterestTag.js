import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const interestTagSchema = new Schema({
  name: { type: String, required: true, unique: true },
  icon: { type: String, default: '' }, // optional emoji or icon name
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default model('InterestTag', interestTagSchema);
