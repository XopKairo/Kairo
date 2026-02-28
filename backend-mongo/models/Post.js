const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaUrl: { type: String, default: '' },
  caption: { type: String, default: '' },
  isFeatured: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// TTL index to automatically delete the document when expiresAt is reached
postSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Post', postSchema);
