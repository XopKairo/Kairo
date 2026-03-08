import mongoose from "mongoose";
const { Schema, model } = mongoose;

const agencySchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    ownerName: { type: String, required: true },
    phone: { type: String },
    hostCount: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 10 }, // Agency commission percentage
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default model("Agency", agencySchema);
