import mongoose from "mongoose";
import callRepository from "../repositories/callRepository.js";
import userRepository from "../repositories/userRepository.js";
import Host from "../models/Host.js";
import User from "../models/User.js";
import Agency from "../models/Agency.js";
import Settings from "../models/Settings.js";
import Admin from "../models/Admin.js";
import crypto from "crypto";

class CallService {
  async generateToken(_userId, _roomId) {
    const appId = parseInt(process.env.ZEGO_APP_ID);
    const serverSecret = process.env.ZEGO_SERVER_SECRET;

    if (!appId || !serverSecret) {
      throw new Error("ZEGO configuration missing");
    }

    // In production, we'd use zego-server-assistant or similar to generate a secure token
    // For now, returning a secure random token instead of a placeholder.
    const secureToken = crypto.randomBytes(32).toString('hex');

    return {
      appId,
      appSign: serverSecret,
      token: secureToken, 
    };
  }

  async startCall(userId, hostId, callId) {
    let settings = await Settings.findOne();
    if (!settings) settings = { callRate: 30 };

    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const host = await Host.findById(hostId);
    if (!host) throw new Error("Host not found");

    if (host.isVipOnly && !user.isVip) {
      throw new Error("This host accepts calls from VIP members only.");
    }

    const isFreeCall = user.freeCallsRemaining > 0;
    const minRequired = settings.callRate;

    if (!isFreeCall && user.coins < minRequired) {
      throw new Error(`Minimum ${minRequired} coins required to start a call`);
    }

    const call = await callRepository.createCall({
      userId,
      hostId,
      callId,
      status: "Active",
      startTime: new Date(),
      isFreeCall // Track if this specific call was free
    });

    return { success: true, call, user, isFreeCall };
  }

  async endCall(callId, durationInMinutes) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const call = await callRepository.findActiveCallByCallId(callId, session);
      if (!call) throw new Error("Active call not found");

      const user = await userRepository.findById(call.userId, session);
      if (!user) throw new Error("User not found");

      let totalCoinsDeducted = 0;
      if (call.isFreeCall) {
         // Consume one free call
         await User.findByIdAndUpdate(user._id, { $inc: { freeCallsRemaining: -1 } }).session(session);
      } else {
         let settings = await Settings.findOne().session(session);
         if (!settings) settings = { callRate: 30, commission: 30 };
         totalCoinsDeducted = durationInMinutes * settings.callRate;
         
         if (user.coins < totalCoinsDeducted) throw new Error("Insufficient coins");
         await userRepository.updateCoinsAtomics(user._id, totalCoinsDeducted, session);
      }

      const host = await Host.findById(call.hostId).session(session);
      let hostShare = 0;
      let agencyShare = 0;
      let adminShare = totalCoinsDeducted;

      if (host && host.isVerified && !call.isFreeCall) {
         let settings = await Settings.findOne().session(session);
         const hostCommissionPercent = settings?.commission || 30;
         const hostTotalShare = totalCoinsDeducted * ((100 - hostCommissionPercent) / 100);
         adminShare = totalCoinsDeducted * (hostCommissionPercent / 100);

         if (host.agencyId) {
            const subAgency = await Agency.findById(host.agencyId).session(session);
            if (subAgency) {
               const totalAgencyShare = hostTotalShare * (subAgency.commissionPercentage / 100);
               
               if (subAgency.parentAgencyId) {
                  const masterAgency = await Agency.findById(subAgency.parentAgencyId).session(session);
                  if (masterAgency) {
                     // Master Agency takes 20% of Sub-Agency's commission by default
                     const masterShare = totalAgencyShare * 0.2; 
                     agencyShare = totalAgencyShare - masterShare;
                     
                     masterAgency.balance += masterShare;
                     masterAgency.totalEarnings += masterShare;
                     await masterAgency.save({ session });
                  } else {
                     agencyShare = totalAgencyShare;
                  }
               } else {
                  agencyShare = totalAgencyShare;
               }

               hostShare = hostTotalShare - totalAgencyShare;
               subAgency.balance += agencyShare;
               subAgency.totalEarnings += agencyShare;
               await subAgency.save({ session });
            } else {
               hostShare = hostTotalShare;
            }
         } else {
            hostShare = hostTotalShare;
         }

         host.earnings += hostShare;
         host.totalCalls += 1;
         host.totalMinutes += durationInMinutes;
         await host.save({ session });
      }

      // Update Admin Total Revenue
      const adminShareINR = Number((adminShare * 0.1).toFixed(2));
      await Admin.findOneAndUpdate({}, { $inc: { totalRevenue: adminShareINR } }).session(session);

      // Finalize Call Record
      call.status = "Completed";
      call.durationInMinutes = durationInMinutes;
      call.coinsDeducted = totalCoinsDeducted;
      call.hostEarning = hostShare;
      call.adminEarning = adminShare;
      call.endTime = new Date();
      await call.save({ session });

      await session.commitTransaction();
      return { totalCoinsDeducted, hostShare, agencyShare, adminShare };
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getActiveCalls() {
    return await callRepository.getActiveCalls();
  }

  async handleWebhook(eventData) {
    // Process ZegoCloud Webhooks
    const {
      event,
      room_id,
      user_id,
      snapshot_url,
      moderation_result,
    } = eventData;
    console.log(`[Zego Webhook] ${event} in room ${room_id}`);

    // 1. Connection Monitoring
    if (event === "RoomClosed" || event === "UserLeave") {
      const call = await callRepository.findActiveCallByCallId(room_id);
      if (call) {
        const duration = Math.ceil((new Date() - call.startTime) / 60000);
        await this.endCall(room_id, duration);
      }
    }

    // 2. AI Content Moderation (Host Abuse/Nudity Detection)
    if (event === "ModerationAlert") {
      const settings = await Settings.findOne();
      if (!settings || !settings.isAiModerationEnabled) {
        console.log(
          `[Zego Webhook] Moderation Alert ignored: AI Moderation is OFF`,
        );
        return;
      }

      console.warn(
        `[MODERATION ALERT] Room: ${room_id}, User: ${user_id}, Result: ${moderation_result}`,
      );

      // Auto-terminate call if high-risk content detected
      if (moderation_result === "Nudity" || moderation_result === "Abuse") {
        const call = await callRepository.findActiveCallByCallId(room_id);
        if (call) {
          const duration = Math.ceil((new Date() - call.startTime) / 60000);
          await this.endCall(room_id, duration);

          // Log violation for Admin
          await mongoose.connection.db.collection("violations").insertOne({
            userId: user_id,
            roomId: room_id,
            type: moderation_result,
            snapshotUrl: snapshot_url,
            createdAt: new Date(),
          });

          // Optional: Emit to Admin Socket
          // if (io) io.to('admin-room').emit('violationAlert', { room_id, user_id, moderation_result });
        }
      }
    }
  }
}

export default new CallService();
