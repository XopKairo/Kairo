import mongoose from "mongoose";
const { Schema, model } = mongoose;

const bannerSchema = new Schema(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    startDate: { type: Date },
    endDate: { type: Date },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default model("Banner", bannerSchema);
