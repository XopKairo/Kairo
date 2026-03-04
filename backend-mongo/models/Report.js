import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const reportSchema = new Schema({
  reporterId: { type: Schema.Types.ObjectId, required: true },
  reportedId: { type: Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Open', 'Resolved', 'Dismissed'], default: 'Open' }
}, { timestamps: true });

export default model('Report', reportSchema);
