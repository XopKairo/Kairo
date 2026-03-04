import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const hostSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Online', 'Busy', 'Offline'], default: 'Offline' },
  earnings: { type: Number, default: 0 },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Female' },
  isVerified: { type: Boolean, default: false },
  callRatePerMinute: { type: Number, default: 30 }
}, { timestamps: true });

const Host = model('Host', hostSchema);
export default Host;
