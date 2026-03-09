import mongoose from "mongoose";
const { Schema, model } = mongoose;

const agencySchema = new Schema(
  {
    name: { type: String, required: true },
    ownerName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    commissionPercentage: { type: Number, default: 10 }, // Percentage agency gets from host earnings
    parentAgencyId: { type: Schema.Types.ObjectId, ref: "Agency" }, // For multi-level system
    totalHosts: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }, // Total commission earned
    balance: { type: Number, default: 0 }, // Current withdrawable balance
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Agency = model("Agency", agencySchema);
export default Agency;
