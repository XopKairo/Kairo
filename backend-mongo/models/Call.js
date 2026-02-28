const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Host', required: true },
  callId: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
  durationInMinutes: { type: Number, default: 0 },
  coinsDeducted: { type: Number, default: 0 },
  hostEarning: { type: Number, default: 0 },
  adminEarning: { type: Number, default: 0 },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Call', callSchema);
