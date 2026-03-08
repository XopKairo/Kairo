import mongoose from "mongoose";
const { Schema, model } = mongoose;

const giftSchema = new Schema(
  {
    name: { type: String, required: true },
    coinCost: { type: Number, required: true },
    iconUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default model("Gift", giftSchema);
