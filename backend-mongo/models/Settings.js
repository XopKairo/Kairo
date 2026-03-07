import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const settingsSchema = new Schema({
  // Revenue Control
  callRate: { type: Number, default: 30 },
  commission: { type: Number, default: 30 },
  
  // System Control
  maintenance: { type: Boolean, default: false },
  isAiModerationEnabled: { type: Boolean, default: true },
  
  // Ad Settings
  enableAds: { type: Boolean, default: true },
  rewardPerAd: { type: Number, default: 5 },
  dailyLimit: { type: Number, default: 10 },
  adMobId: { type: String, default: '' },
  interstitialId: { type: String, default: '' }
}, { timestamps: true });

export default model('Settings', settingsSchema);
