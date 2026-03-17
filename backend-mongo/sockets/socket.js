import redisClient from "../config/redis.js";
import LiveCall from "../models/LiveCall.js";
import User from "../models/User.js";
import Host from "../models/Host.js";
import Settings from "../models/Settings.js";
import WalletLedger from "../models/WalletLedger.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import callService from "../services/callService.js";

const setupSockets = (io) => {
  const ringingTimeouts = new Map();
  const activeCallTimeouts = new Map();

  // Simple Rate Limiting for Socket Events
  const socketRateLimit = new Map();

  // Socket JWT Authentication Middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("🔗 Socket Connected:", socket.id, "User:", socket.userId);

    // Auto-join user room based on verified token
    if (socket.userId) {
      socket.join(socket.userId);
      // God-Mode Sync: Mark Host as Online and notify all
      Host.findOneAndUpdate({ userId: socket.userId }, { status: "Online" }, { new: true })
        .then(h => {
          if (h) io.emit("statusUpdate", { hostId: h._id, status: "Online" });
        })
        .catch(() => {});
    }

    socket.on("registerUser", () => {
      // Legacy support, room is already joined
      console.log(`👤 User registered via token: ${socket.userId}`);
    });

    // Rate Limiter Middleware for events
    socket.use(([_event, ..._args], next) => {
      const now = Date.now();
      const limit = 20; // 20 events per 10 seconds
      const window = 10000;

      let userLimit = socketRateLimit.get(socket.id) || {
        count: 0,
        startTime: now,
      };

      if (now - userLimit.startTime > window) {
        userLimit = { count: 1, startTime: now };
      } else {
        userLimit.count++;
      }

      socketRateLimit.set(socket.id, userLimit);

      if (userLimit.count > limit) {
        return next(new Error("Rate limit exceeded"));
      }
      next();
    });

    socket.on("callStarted", async (data) => {
      const { callId, userId, hostId, receiverId } = data;
      let targetRoomId = receiverId || hostId;

      try {
        // Fetch caller to check balance BEFORE ringing
        const caller = await User.findById(userId);
        let settings = await Settings.findOne();
        const ratePerMinute = settings ? settings.callRate : 30;

        if (!caller || caller.coins <= 0 || (caller.coins < ratePerMinute && caller.freeCallsRemaining <= 0)) {
          console.log(`🚫 Ringing Blocked: User ${userId} has insufficient balance (${caller?.coins || 0} coins).`);
          socket.emit("callError", { 
            message: "Insufficient coins to start a call. Please recharge your wallet." 
          });
          return;
        }

        // If targetRoomId is a Host ID, we need the actual User ID for the socket room
        const hostDoc = await Host.findById(targetRoomId);
        if (hostDoc) {
          targetRoomId = hostDoc.userId.toString();
        }

        if (targetRoomId) {
          io.to(targetRoomId).emit("incomingCall", { ...data, hostUserId: targetRoomId });

          // Initial LiveCall entry
          await LiveCall.create({
            callId,
            userId,
            hostId: targetRoomId,
            status: "RINGING",
          });

          const timeout = setTimeout(async () => {
            const call = await LiveCall.findOne({ callId, status: "RINGING" });
            if (call) {
              call.status = "MISSED";
              await call.save();
              io.to(userId).emit("callTimeout", { callId });
              io.to(targetRoomId).emit("callTimeout", { callId });
            }
            ringingTimeouts.delete(callId);
          }, 45000);

          ringingTimeouts.set(callId, timeout);
        }
      } catch (err) {
        console.error("Call Started Error:", err);
      }
    });

    socket.on("callAccepted", async (callId) => {
      try {
        if (ringingTimeouts.has(callId)) {
          clearTimeout(ringingTimeouts.get(callId));
          ringingTimeouts.delete(callId);
        }

        const call = await LiveCall.findOne({ callId });
        if (!call) return;

        // Fetch caller to check balance
        const caller = await User.findById(call.userId);
        let settings = await Settings.findOne();
        const ratePerMinute = settings ? settings.callRate : 30;

        if (!caller || caller.coins <= 0 || (caller.coins < ratePerMinute && caller.freeCallsRemaining <= 0)) {
          console.log(`❌ Call Rejected: User ${call.userId} has ${caller?.coins || 0} coins.`);
          io.to(call.userId).emit("callError", {
            message: "Insufficient coins to start the call",
          });
          io.to(call.hostId).emit("callEnded", { callId });
          return;
        }

        // Supreme Sync: Mark Host as Busy
        await Host.findOneAndUpdate({ userId: call.hostId }, { status: "Busy" });
        io.emit("statusUpdate", { hostId: call.hostId, status: "Busy" });

        const maxMinutes = caller.freeCallsRemaining > 0 ? 10 : Math.floor(caller.coins / ratePerMinute);
        const maxDurationMs = maxMinutes * 60 * 1000;
        const startTime = Date.now();

        // Store call state in Redis for authoritative tracking
        await redisClient.hSet(`activeCall:${callId}`, {
          callerId: call.userId.toString(),
          hostId: call.hostId.toString(),
          startTime: startTime.toString(),
          ratePerMinute: ratePerMinute.toString(),
        });
        await redisClient.expire(`activeCall:${callId}`, 3600); // 1 hour safety expiry

        call.status = "ACTIVE";
        call.startedAt = new Date(startTime);
        await call.save();

        // Mark Host as Busy
        const h = await Host.findOneAndUpdate({ userId: call.hostId }, { status: "Busy" }, { new: true });
        if (h) io.emit("statusUpdate", { hostId: h._id, status: "Busy" });

        io.to(call.userId)
          .to(call.hostId)
          .emit("callActive", { callId, startTime });

        // Server-side auto-disconnect timer
        const timeoutId = setTimeout(() => {
          console.log(
            `⏰ Force disconnecting call ${callId} due to zero balance`,
          );
          io.to(call.userId)
            .to(call.hostId)
            .emit("forceDisconnect", { reason: "insufficient-balance" });
          endCallAndDeductBalance(callId);
        }, maxDurationMs);

        activeCallTimeouts.set(callId, timeoutId);
      } catch (err) {
        console.error("Call Accepted Error:", err);
      }
    });

    socket.on("callEnded", async (callId) => {
      await endCallAndDeductBalance(callId);
    });

    socket.on("privateMessage", (data) => {
      const { recipientId, text, image, type, conversationId, _id } = data;
      // Emit the message to the recipient's personal room
      io.to(recipientId).emit("newMessage", {
        _id: _id || Date.now().toString(),
        conversationId,
        sender: socket.userId,
        recipient: recipientId,
        text,
        image,
        type,
        status: "delivered",
        createdAt: new Date(),
      });
      // Optionally notify sender that message is delivered
      socket.emit("messageStatusUpdate", { messageId: _id, status: "delivered" });
    });

    socket.on("disconnect", async () => {
      socketRateLimit.delete(socket.id);
      if (socket.userId) {
        // God-Mode Sync: Mark Host as Offline and notify all
        Host.findOneAndUpdate({ userId: socket.userId }, { status: "Offline" }, { new: true })
          .then(h => {
            if (h) io.emit("statusUpdate", { hostId: h._id, status: "Offline" });
          })
          .catch(() => {});

        // Find if user was in an active call
        const activeCalls = await LiveCall.find({
          $or: [{ userId: socket.userId }, { hostId: socket.userId }],
          status: "ACTIVE",
        });

        for (const call of activeCalls) {
          await endCallAndDeductBalance(call.callId);
        }

        // Handle ringing calls
        const ringingCalls = await LiveCall.find({
          $or: [{ userId: socket.userId }, { hostId: socket.userId }],
          status: "RINGING",
        });
        for (const call of ringingCalls) {
          if (ringingTimeouts.has(call.callId)) {
            clearTimeout(ringingTimeouts.get(call.callId));
            ringingTimeouts.delete(call.callId);
          }
          call.status = "MISSED";
          await call.save();
        }
      }
    });
  });

  async function endCallAndDeductBalance(callId) {
    try {
      // 1. Try Redis first
      let callData = await redisClient.hGetAll(`activeCall:${callId}`);
      
      // Fallback to LiveCall DB if Redis fails or data is missing
      if (!callData || Object.keys(callData).length === 0) {
        const liveCall = await LiveCall.findOne({ callId });
        if (!liveCall || liveCall.status === "ENDED" || liveCall.status === "MISSED") return;
        
        callData = {
          callerId: liveCall.userId.toString(),
          hostId: liveCall.hostId.toString(),
          startTime: (new Date(liveCall.startedAt || Date.now()).getTime()).toString(),
          ratePerMinute: "30" 
        };
      }

      // Remove from Redis immediately to prevent double processing
      await redisClient.del(`activeCall:${callId}`);

      // 2. Clear server-side timeout
      if (activeCallTimeouts.has(callId)) {
        clearTimeout(activeCallTimeouts.get(callId));
        activeCallTimeouts.delete(callId);
      }

      const endTime = Date.now();
      const durationMs = endTime - parseInt(callData.startTime);
      const durationMinutes = Math.max(1, Math.ceil(durationMs / 60000)); 

      // 3. Mark Host as Online again
      const h = await Host.findOneAndUpdate({ userId: callData.hostId }, { status: "Online" }, { new: true });
      if (h) io.emit("statusUpdate", { hostId: h._id, status: "Online" });

      // 4. Update LiveCall and global Call models
      await Promise.all([
        LiveCall.findOneAndUpdate({ callId }, { status: "ENDED", endedAt: new Date(endTime) }),
        redisClient.hDel("active_calls", callId) // Consistent with CallRepository
      ]);

      // 5. Use CallService for robust billing (Host/Agency commissions)
      try {
        const billingResult = await callService.endCall(callId, durationMinutes);
        console.log(`✅ Call ${callId} ended via CallService.`, billingResult);

        io.to(callData.callerId)
          .to(callData.hostId)
          .emit("callEnded", { 
            callId, 
            durationMinutes, 
            totalCost: billingResult.totalCoinsDeducted,
            hostShare: billingResult.hostShare 
          });
      } catch (billingErr) {
        console.error("❌ CallService endCall failed:", billingErr.message);
        // Fallback or emit error
        io.to(callData.callerId)
          .to(callData.hostId)
          .emit("callEnded", { callId, error: billingErr.message });
      }
    } catch (err) {
      console.error("End Call Error:", err);
    }
  }
};

export default setupSockets;
