import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const reportedMessageSchema = new Schema({
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed', 'dismissed'], default: 'pending' }
}, { timestamps: true });

export default model('ReportedMessage', reportedMessageSchema);
