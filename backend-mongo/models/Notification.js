import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  targetAudience: { type: String, enum: ['All', 'Hosts', 'Users'], default: 'All' },
  type: { type: String, default: 'Info' }, // 'Info', 'Warning', 'Promo'
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);