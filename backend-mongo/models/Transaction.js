const mongoose = require('mongoose');

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

module.exports = mongoose.model('Transaction', transactionSchema);
