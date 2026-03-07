import Call from '../models/Call.js';

class CallRepository {
  async createCall(callData) {
    return await Call.create(callData);
  }

  async findActiveCallByCallId(callId, session) {
    const query = Call.findOne({ callId, status: 'Active' });
    if (session) query.session(session);
    return await query;
  }

  async updateCall(callId, updateData, session) {
    const query = Call.findOneAndUpdate({ callId }, updateData, { new: true });
    if (session) query.session(session);
    return await query;
  }

  async getActiveCalls() {
    return await Call.find({ status: 'Active' })
      .populate('userId', 'name email')
      .populate('hostId', 'name email');
  }
}

export default new CallRepository();
