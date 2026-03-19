import mongoose from "mongoose";
const { Schema, model } = mongoose;

const momentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    thumbnailUrl: { type: String },
    title: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false }, // For top profile highlights
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

momentSchema.index({ userId: 1, isFeatured: -1, order: 1 });

const Moment = model("Moment", momentSchema);
export default Moment;