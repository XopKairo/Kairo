const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  targetAudience: { type: String, enum: ['All', 'Hosts', 'Users'], default: 'All' },
  type: { type: String, default: 'Info' }, // 'Info', 'Warning', 'Promo'
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);