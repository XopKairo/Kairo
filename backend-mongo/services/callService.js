import mongoose from 'mongoose';
import callRepository from '../repositories/callRepository.js';
import userRepository from '../repositories/userRepository.js';
import walletRepository from '../repositories/walletRepository.js';
import growthService from './growthService.js';
import Host from '../models/Host.js';
import Settings from '../models/Settings.js';
import Admin from '../models/Admin.js';

class CallService {
  async generateToken(userId, roomId) {
    const appId = parseInt(process.env.ZEGO_APP_ID);
    const serverSecret = process.env.ZEGO_SERVER_SECRET;
    
    if (!appId || !serverSecret) {
      throw new Error('ZEGO configuration missing');
    }

    // In production, we'd use zego-server-assistant or similar to generate a secure token
    // For now, returning appId and appSign as the current implementation does, but structure is ready.
    return {
      appId,
      appSign: serverSecret,
      token: "SECURE_TOKEN_PLACEHOLDER" // Would be generated here
    };
  }

  async startCall(userId, hostId, callId) {
    let settings = await Settings.findOne();
    if (!settings) settings = { callRate: 30 };
    
    const minRequired = settings.callRate;
    const user = await userRepository.findById(userId);
    
    if (!user || user.coins < minRequired) {
      throw new Error(`Minimum ${minRequired} coins required to start a call`);
    }

    const call = await callRepository.createCall({
      userId,
      hostId,
      callId,
      status: 'Active',
      startTime: new Date()
    });

    return { success: true, call, user };
  }

  async endCall(callId, durationInMinutes) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const call = await callRepository.findActiveCallByCallId(callId, session);
      if (!call) throw new Error('Active call not found');

      const host = await Host.findById(call.hostId).session(session);
      if (!host) throw new Error('Host not found');

      let settings = await Settings.findOne().session(session);
      if (!settings) settings = { callRate: 30, commission: 30 };

      const callRatePerMinute = settings.callRate;
      const totalCoinsDeducted = durationInMinutes * callRatePerMinute;
      const hostCommissionPercent = settings.commission;
      const hostShare = totalCoinsDeducted * ((100 - hostCommissionPercent) / 100);
      const adminShare = totalCoinsDeducted * (hostCommissionPercent / 100);

      const user = await userRepository.findById(call.userId, session);
      if (!user || user.coins < totalCoinsDeducted) {
        throw new Error('Insufficient coins to end call properly');
      }

      const balanceBefore = user.coins;
      const updatedUser = await userRepository.updateCoinsAtomics(call.userId, totalCoinsDeducted, session);
      
      if (!updatedUser) throw new Error('Failed to deduct coins');

      // LEDGER LOGGING
      await walletRepository.logLedgerEntry({
        userId: call.userId,
        type: 'DEBIT',
        amount: totalCoinsDeducted,
        balanceBefore,
        balanceAfter: updatedUser.coins,
        transactionType: 'CALL_CHARGE',
        description: `Call duration: ${durationInMinutes} mins`,
        referenceId: call._id
      }, session);

      // Host Earnings & Admin Revenue
      const isEarningEligible = host && host.gender === 'Female' && host.isGenderVerified;
      if (isEarningEligible) {
        host.earnings += hostShare;
        host.totalCalls += 1;
        host.totalMinutes += durationInMinutes;
        host.status = 'Online';
        await host.save({ session });
        
        const adminShareINR = Number((adminShare * 0.1).toFixed(2));
        await Admin.findOneAndUpdate({}, { $inc: { totalRevenue: adminShareINR } }).session(session);
      } else {
        host.status = 'Online';
        await host.save({ session });
        const totalAmountINR = Number((totalCoinsDeducted * 0.1).toFixed(2));
        await Admin.findOneAndUpdate({}, { $inc: { totalRevenue: totalAmountINR } }).session(session);
      }

      // Update Call
      call.status = 'Completed';
      call.durationInMinutes = durationInMinutes;
      call.coinsDeducted = totalCoinsDeducted;
      call.hostEarning = hostShare;
      call.adminEarning = adminShare;
      call.endTime = new Date();
      await call.save({ session });

      // Revenue Master Sync
      await mongoose.connection.db.collection('admin_revenues').insertOne({
        callId: call._id,
        adminEarning: adminShare,
        createdAt: new Date()
      }, { session });

      await session.commitTransaction();
      
      // GROWTH FEATURE: Update Spent coins and potentially Level up
      await growthService.updateSpentAndLevel(call.userId, totalCoinsDeducted);

      return { totalCoinsDeducted, hostShare, adminShare };
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
    const { event, room_id, user_id, stream_id, snapshot_url, moderation_result } = eventData;
    console.log(`[Zego Webhook] ${event} in room ${room_id}`);
    
    // 1. Connection Monitoring
    if (event === 'RoomClosed' || event === 'UserLeave') {
      const call = await callRepository.findActiveCallByCallId(room_id);
      if (call) {
        const duration = Math.ceil((new Date() - call.startTime) / 60000);
        await this.endCall(room_id, duration);
      }
    }

    // 2. AI Content Moderation (Host Abuse/Nudity Detection)
    if (event === 'ModerationAlert') {
      const settings = await Settings.findOne();
      if (!settings || !settings.isAiModerationEnabled) {
        console.log(`[Zego Webhook] Moderation Alert ignored: AI Moderation is OFF`);
        return;
      }

      console.warn(`[MODERATION ALERT] Room: ${room_id}, User: ${user_id}, Result: ${moderation_result}`);
      
      // Auto-terminate call if high-risk content detected
      if (moderation_result === 'Nudity' || moderation_result === 'Abuse') {
        const call = await callRepository.findActiveCallByCallId(room_id);
        if (call) {
          const duration = Math.ceil((new Date() - call.startTime) / 60000);
          await this.endCall(room_id, duration);
          
          // Log violation for Admin
          await mongoose.connection.db.collection('violations').insertOne({
            userId: user_id,
            roomId: room_id,
            type: moderation_result,
            snapshotUrl: snapshot_url,
            createdAt: new Date()
          });

          // Optional: Emit to Admin Socket
          // if (io) io.to('admin-room').emit('violationAlert', { room_id, user_id, moderation_result });
        }
      }
    }
  }
}

export default new CallService();
