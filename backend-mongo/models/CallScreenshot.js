import mongoose from "mongoose";
const { Schema, model } = mongoose;

const callScreenshotSchema = new Schema(
  {
    callId: { type: Schema.Types.ObjectId, ref: "Call", required: true },
    hostId: { type: Schema.Types.ObjectId, ref: "Host", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, required: true },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String }, // e.g., "Nudity Detected"
    confidenceScore: { type: Number }, // AI confidence
  },
  { timestamps: true }
);

const CallScreenshot = model("CallScreenshot", callScreenshotSchema);
export default CallScreenshot;
