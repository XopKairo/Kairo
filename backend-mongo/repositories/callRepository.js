import Call from "../models/Call.js";
import redisClient from "../config/redis.js";

class CallRepository {
  async createCall(callData) {
    const call = await Call.create(callData);
    // Cache active call in Redis
    await redisClient.hSet("active_calls", call.callId, JSON.stringify(call));
    return call;
  }

  async findActiveCallByCallId(callId, session) {
    // Try Redis first
    const cached = await redisClient.hGet("active_calls", callId);
    if (cached && !session) return JSON.parse(cached);

    const query = Call.findOne({ callId, status: "Active" });
    if (session) query.session(session);
    return await query;
  }

  async updateCall(callId, updateData, session) {
    const call = await Call.findOneAndUpdate({ callId }, updateData, { new: true });
    if (call) {
       if (call.status !== "Active") {
          await redisClient.hDel("active_calls", callId);
       } else {
          await redisClient.hSet("active_calls", callId, JSON.stringify(call));
       }
    }
    return call;
  }

  async getActiveCalls() {
    // Try Redis first for a fast list
    const cached = await redisClient.hGetAll("active_calls");
    if (cached && Object.keys(cached).length > 0) {
       return Object.values(cached).map(c => JSON.parse(c));
    }

    return await Call.find({ status: "Active" })
      .populate("userId", "name phone")
      .populate("hostId", "name phone");
  }
}

export default new CallRepository();
