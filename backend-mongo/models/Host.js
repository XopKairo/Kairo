import mongoose from "mongoose";
const { Schema, model } = mongoose;

const hostSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["Online", "Busy", "Offline"],
      default: "Offline",
    },
    earnings: { type: Number, default: 0 },
    totalCalls: { type: Number, default: 0 },
    totalMinutes: { type: Number, default: 0 },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Female",
    },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    agencyId: { type: Schema.Types.ObjectId, ref: "Agency" },
    hostId: { type: String, unique: true }, // Visual ID like 887766
    shortVideoUrl: { type: String },
    receivedGifts: [{
      giftId: { type: Schema.Types.ObjectId, ref: "Gift" },
      count: { type: Number, default: 1 }
    }],
    isVipOnly: { type: Boolean, default: false },
    avgRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    rankingScore: { type: Number, default: 0 },
    isBoosted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    callRatePerMinute: { type: Number, default: 30 },
  },
  { timestamps: true },
);

const Host = model("Host", hostSchema);
export default Host;
