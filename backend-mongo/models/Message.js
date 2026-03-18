import mongoose from "mongoose";
const { Schema, model } = mongoose;

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    image: { type: String },
    video: { type: String },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "system", "gift"],
      default: "text",
    },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export default model("Message", messageSchema);
