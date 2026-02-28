const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reportedId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Open', 'Resolved', 'Dismissed'], default: 'Open' }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
