import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const conversationSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }
}, { timestamps: true });

// Ensure participants are unique and sorted to prevent duplicate conversations
conversationSchema.index({ participants: 1 });

export default model('Conversation', conversationSchema);
