import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  coinPackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'CoinPackage' },
  coinsCredited: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
