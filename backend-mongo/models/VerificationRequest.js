import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const verificationRequestSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  photoUrl: { type: String, required: true },
  idUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default model('VerificationRequest', verificationRequestSchema);
