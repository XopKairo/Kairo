import mongoose from "mongoose";
const { Schema, model } = mongoose;

const postSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, default: "" },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    type: {
      type: String,
      enum: ["STORY", "TEASER", "PREMIUM"],
      default: "STORY",
    },
    caption: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL index to automatically delete the document when expiresAt is reached
postSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model("Post", postSchema);
