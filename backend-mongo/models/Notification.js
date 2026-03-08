import mongoose from "mongoose";
const { Schema, model } = mongoose;

const notificationSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetAudience: {
      type: String,
      enum: ["All", "Hosts", "Users"],
      default: "All",
    },
    type: { type: String, default: "Info" }, // 'Info', 'Warning', 'Promo'
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default model("Notification", notificationSchema);
