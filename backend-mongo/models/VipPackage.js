import mongoose from "mongoose";
const { Schema, model } = mongoose;

const vipPackageSchema = new Schema(
  {
    name: { type: String, required: true },
    priceINR: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    features: [{ type: String }], // e.g., "Priority Profile", "Free 10 Coins Daily"
    badgeIcon: { type: String, default: "👑" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const VipPackage = model("VipPackage", vipPackageSchema);
export default VipPackage;
