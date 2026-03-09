import mongoose from "mongoose";
const { Schema, model } = mongoose;

const scratchCardSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rewardCoins: { type: Number, required: true },
    isScratched: { type: Boolean, default: false },
    expiryDate: { type: Date, required: true },
  },
  { timestamps: true }
);

const ScratchCard = model("ScratchCard", scratchCardSchema);
export default ScratchCard;
