import mongoose from "mongoose";
const { Schema, model } = mongoose;

const storySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    caption: { type: String, default: "" },
    viewers: [{
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      viewedAt: { type: Date, default: Date.now }
    }],
    reactions: [{
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      emoji: { type: String }
    }],
    expiresAt: { 
      type: Date, 
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 Hours
      index: { expires: 0 } // Auto-delete from DB
    }
  },
  { timestamps: true }
);

// High-performance index for active stories
storySchema.index({ userId: 1, expiresAt: 1 });

const Story = model("Story", storySchema);
export default Story;