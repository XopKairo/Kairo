import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const blacklistSchema = new Schema({
  type: {
    type: String,
    enum: ['IP', 'DEVICE'],
    default: 'IP'
  },
  value: {
    type: String,
    required: true,
    unique: true
  },
  reason: {
    type: String,
    required: false
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

export default model('Blacklist', blacklistSchema);
