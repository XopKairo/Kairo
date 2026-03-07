import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const followSchema = new Schema({
  followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  followeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Compound index for fast lookup and to prevent duplicate follows
followSchema.index({ followerId: 1, followeeId: 1 }, { unique: true });
followSchema.index({ followeeId: 1 }); // For finding all followers of a user

const Follow = model('Follow', followSchema);
export default Follow;
