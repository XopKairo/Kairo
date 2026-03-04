const mongoose = import('mongoose');

const settingsSchema = new mongoose.Schema({
  // Revenue Control
  callRate: { type: Number, default: 30 },
  commission: { type: Number, default: 30 },
  
  // System Control
  maintenance: { type: Boolean, default: false },
  
  // Ad Settings
  enableAds: { type: Boolean, default: true },
  rewardPerAd: { type: Number, default: 5 },
  dailyLimit: { type: Number, default: 10 },
  adMobId: { type: String, default: '' },
  interstitialId: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
