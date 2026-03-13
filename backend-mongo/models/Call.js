import mongoose from "mongoose";
const { Schema, model } = mongoose;

const callSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hostId: { type: Schema.Types.ObjectId, ref: "Host", required: true },
    callId: { type: String, required: true },
    status: { type: String, enum: ["Active", "Completed"], default: "Active" },
    durationInMinutes: { type: Number, default: 0 },
    coinsDeducted: { type: Number, default: 0 },
    hostEarning: { type: Number, default: 0 },
    adminEarning: { type: Number, default: 0 },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
  },
  { timestamps: true },
);

callSchema.index({ status: 1, createdAt: -1 });
callSchema.index({ userId: 1, createdAt: -1 });
callSchema.index({ hostId: 1, createdAt: -1 });
callSchema.index({ callId: 1 }, { unique: true });

export default model("Call", callSchema);
