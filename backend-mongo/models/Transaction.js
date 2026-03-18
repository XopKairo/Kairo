import mongoose from "mongoose";
const { Schema, model } = mongoose;

const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      index: true,
    },
    coinPackageId: { type: Schema.Types.ObjectId, ref: "CoinPackage" },
    coinsCredited: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default model("Transaction", transactionSchema);
