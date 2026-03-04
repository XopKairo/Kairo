import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'Host' },
  amountINR: { type: Number, required: true },
  coinsDeducted: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  paymentDetails: { type: String, required: true },
  clientRequestId: { type: String, required: true, unique: true }
}, { timestamps: true });

export default mongoose.model('Payout', payoutSchema);
