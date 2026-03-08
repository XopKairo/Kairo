import mongoose from "mongoose";
const { Schema, model } = mongoose;

const ratingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    callId: { type: String, required: true },
  },
  { timestamps: true },
);

export default model("Rating", ratingSchema);
