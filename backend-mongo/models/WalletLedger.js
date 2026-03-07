import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const walletLedgerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['DEBIT', 'CREDIT'], required: true },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  transactionType: { 
    type: String, 
    enum: ['GIFT_SENT', 'GIFT_RECEIVED', 'CALL_CHARGE', 'CALL_EARNING', 'AD_REWARD', 'RECHARGE', 'WITHDRAWAL', 'ADMIN_ADJUSTMENT'], 
    required: true 
  },
  referenceId: { type: Schema.Types.ObjectId, required: false }, // ID of Gift, Call, Payout, etc.
  description: { type: String },
  metadata: { type: Object }
}, { timestamps: true });

// Index for auditing
walletLedgerSchema.index({ userId: 1, createdAt: -1 });

const WalletLedger = model('WalletLedger', walletLedgerSchema);
export default WalletLedger;
