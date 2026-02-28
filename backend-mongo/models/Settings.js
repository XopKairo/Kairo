const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  revenueControl: { type: Number, default: 0 },
  commissionPercent: { type: Number, default: 10 },
  maintenanceMode: { type: Boolean, default: false },
  admobConfig: {
    appId: { type: String, default: '' },
    rewardRules: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
