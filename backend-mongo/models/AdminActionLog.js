import mongoose from "mongoose";
const { Schema, model } = mongoose;

const adminActionLogSchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "BAN_USER",
        "UNBAN_USER",
        "DELETE_USER",
        "PAYMENT_OVERRIDE",
        "SETTINGS_UPDATE",
      ],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    details: {
      type: String,
      required: false,
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true },
);

export default model("AdminActionLog", adminActionLogSchema);
