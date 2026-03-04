import { logCallStart, logCallEnd } from '../routes/monitoring.js';
import LiveCall from '../models/LiveCall.js.js';
import Message from '../models/Message.js.js';
import Conversation from '../models/Conversation.js.js';

const setupSockets = (io) => {
  const ringingTimeouts = new Map();

  io.on('connection', (socket) => {
    console.log('🔗 Socket Connected:', socket.id);

    socket.on('registerUser', (userId) => {
      if (userId) {
        socket.join(userId);
        socket.userId = userId;
        console.log(`👤 User registered: ${userId}`);
      }
    });

    // --- Private Messaging Events ---
    
    socket.on('privateMessage', async (data) => {
      const { recipientId, text, conversationId, type = 'text' } = data;
      
      try {
        // Emit to recipient if online
        io.to(recipientId).emit('newMessage', {
          ...data,
          sender: socket.userId,
          createdAt: new Date(),
          status: 'sent'
        });

        // Backend logic for persistence is handled via REST, 
        // but we emit for instant UI feedback.
      } catch (err) {
        console.error('Socket Message Error:', err);
      }
    });

    socket.on('typing', (data) => {
      const { recipientId, conversationId } = data;
      io.to(recipientId).emit('userTyping', { conversationId, userId: socket.userId });
    });

    socket.on('stopTyping', (data) => {
      const { recipientId, conversationId } = data;
      io.to(recipientId).emit('userStoppedTyping', { conversationId, userId: socket.userId });
    });

    // --- Call Signaling ---
    
    socket.on('callStarted', async (data) => {
      const { callId, userId, hostId, receiverId } = data;
      const targetId = receiverId || hostId;
      
      if (targetId) {
        io.to(targetId).emit('incomingCall', data);
        await logCallStart({ ...data, status: 'RINGING' });

        const timeout = setTimeout(async () => {
          const call = await LiveCall.findOne({ callId, status: 'RINGING' });
          if (call) {
            call.status = 'MISSED';
            await call.save();
            io.to(userId).emit('callTimeout', { callId });
            io.to(targetId).emit('callTimeout', { callId });
          }
          ringingTimeouts.delete(callId);
        }, 45000);

        ringingTimeouts.set(callId, timeout);
      }
    });

    socket.on('callAccepted', async (callId) => {
      if (ringingTimeouts.has(callId)) {
        clearTimeout(ringingTimeouts.get(callId));
        ringingTimeouts.delete(callId);
      }
      await LiveCall.findOneAndUpdate({ callId }, { status: 'ACTIVE', startedAt: new Date() });
    });

    socket.on('callEnded', async (callId) => {
      if (ringingTimeouts.has(callId)) {
        clearTimeout(ringingTimeouts.get(callId));
        ringingTimeouts.delete(callId);
      }
      await logCallEnd(callId);
    });

    socket.on('disconnect', async () => {
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
        }
      }
    });
  });
};

export default setupSockets;
