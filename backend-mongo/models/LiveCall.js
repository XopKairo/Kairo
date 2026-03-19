import mongoose from "mongoose";
const { Schema, model } = mongoose;

const liveCallSchema = new Schema(
  {
    callId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hostId: { type: Schema.Types.ObjectId, ref: "Host", required: true },
    status: {
      type: String,
      enum: ["RINGING", "ACTIVE", "MISSED", "ENDED"],
      default: "RINGING",
    },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 45 * 1000) }, // 45s Ringing limit
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true },
);

// TTL Index to clean up old MISSED/ENDED calls if needed, but not critical for 100 users.
export default model("LiveCall", liveCallSchema);
