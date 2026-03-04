import { logCallStart, logCallEnd } from '../routes/monitoring.js';
import LiveCall from '../models/LiveCall.js';

const setupSockets = (io) => {
  // Store active timeouts to clear them if call is accepted
  const ringingTimeouts = new Map();

  io.on('connection', (socket) => {
    console.log('🔗 Socket Connected:', socket.id);

    socket.on('registerUser', (userId) => {
      if (userId) {
        socket.join(userId);
        socket.userId = userId; // Store on socket for cleanup
        console.log(`👤 User registered: ${userId}`);
      }
    });

    socket.on('joinAdminRoom', () => {
      socket.join('admin-room');
    });

    socket.on('callStarted', async (data) => {
      const { callId, userId, hostId, receiverId } = data;
      const targetId = receiverId || hostId;
      
      if (targetId) {
        io.to(targetId).emit('incomingCall', data);
        console.log(`📞 Call RINGING: ${callId}`);
        
        // Initial DB log as RINGING
        await logCallStart({ ...data, status: 'RINGING' });

        // Phase 3: 45s Timeout
        const timeout = setTimeout(async () => {
          const call = await LiveCall.findOne({ callId, status: 'RINGING' });
          if (call) {
            call.status = 'MISSED';
            await call.save();
            io.to(userId).emit('callTimeout', { callId });
            io.to(targetId).emit('callTimeout', { callId });
            console.log(`⏰ Call TIMEOUT: ${callId}`);
          }
          ringingTimeouts.delete(callId);
        }, 45000);

        ringingTimeouts.set(callId, timeout);
      }
    });

    socket.on('callAccepted', async (callId) => {
      // Clear ringing timeout
      if (ringingTimeouts.has(callId)) {
        clearTimeout(ringingTimeouts.get(callId));
        ringingTimeouts.delete(callId);
      }
      
      await LiveCall.findOneAndUpdate({ callId }, { status: 'ACTIVE', startedAt: new Date() });
      console.log(`✅ Call ACTIVE: ${callId}`);
    });

    socket.on('callEnded', async (callId) => {
      if (ringingTimeouts.has(callId)) {
        clearTimeout(ringingTimeouts.get(callId));
        ringingTimeouts.delete(callId);
      }
      await logCallEnd(callId);
    });

    socket.on('disconnect', async () => {
      console.log('🔌 Socket Disconnected:', socket.id);
      
      // Cleanup any active calls this user was part of
      if (socket.userId) {
        const activeCalls = await LiveCall.find({
          $or: [{ userId: socket.userId }, { hostId: socket.userId }],
          status: { $in: ['RINGING', 'ACTIVE'] }
        });

        for (const call of activeCalls) {
          if (ringingTimeouts.has(call.callId)) {
            clearTimeout(ringingTimeouts.get(call.callId));
            ringingTimeouts.delete(call.callId);
          }
          call.status = 'ENDED';
          call.endedAt = new Date();
          await call.save();
          console.log(`🧹 Cleanup: Call ${call.callId} ended on disconnect`);
        }
      }
    });
  });
};

export default setupSockets;
