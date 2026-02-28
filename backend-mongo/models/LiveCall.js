const mongoose = require('mongoose');

const liveCallSchema = new mongoose.Schema({
  callId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  hostId: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Ended'], default: 'Active' },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('LiveCall', liveCallSchema);
