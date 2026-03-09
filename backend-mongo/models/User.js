import mongoose from "mongoose";
const { Schema, model } = mongoose;
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    nickname: { type: String, default: "" },
    bio: { type: String, default: "" },
    age: { type: Number },
    languages: [{ type: String }],
    photos: [{ type: String }],
    location: { type: String, default: "" },
    interests: [{ type: String }],
    coins: { type: Number, default: 0 },
    zoraPoints: { type: Number, default: 0 },
    lastLoginDate: { type: Date },
    isBanned: { type: Boolean, default: false, index: true },
    isVerified: { type: Boolean, default: false },
    isHost: { type: Boolean, default: false },
    profilePicture: { type: String, default: "" },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: false,
      index: true,
    },
    verificationSelfie: { type: String, required: false, default: "" },
    isGenderVerified: { type: Boolean, default: false },
    banUntil: { type: Date, default: null },
    banReason: { type: String, default: "" },
    cashBalance: { type: Number, default: 0 },
    dailyAdsWatched: { type: Number, default: 0 },
    lastAdWatchedAt: { type: Date, default: null },
    status: { type: String, default: "offline", index: true },
    pushToken: { type: String, default: "" },

    // Privacy & Stealth Features
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isStealthModeEnabled: { type: Boolean, default: false },
    isDrmEnabled: { type: Boolean, default: true },

    // Growth Features
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User" },
    currentStreak: { type: Number, default: 0 },
    lastStreakClaimedAt: { type: Date },
    totalSpent: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    vipLevel: {
      type: String,
      enum: ["None", "Bronze", "Silver", "Gold", "Platinum"],
      default: "None",
    },
  },
  { timestamps: true },
);

// Compound indexes for common queries
userSchema.index({ status: 1, gender: 1 });
userSchema.index({ isBanned: 1, lastLoginDate: -1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = model("User", userSchema);
export default User;
