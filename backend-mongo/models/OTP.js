import mongoose from "mongoose";
const { Schema, model } = mongoose;

const otpSchema = new Schema(
  {
    contact: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Auto-delete document after 600 seconds (10 minutes)
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

export default model("OTP", otpSchema);
