import mongoose from "mongoose";
const { Schema, model } = mongoose;

const reviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hostId: { type: Schema.Types.ObjectId, ref: "Host", required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

const Review = model("Review", reviewSchema);
export default Review;
