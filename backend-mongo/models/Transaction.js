const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  razorpayOrderId: { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  coinPackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'CoinPackage' },
  coinsCredited: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
