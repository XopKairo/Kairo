const { Server } = require("socket.io");
const Message = require('../models/Message');
const User = require('../models/User');
const Call = require('../models/Call');
const Host = require('../models/Host');
const Admin = require('../models/Admin');

const setupSockets = (server) => {
  const allowedOrigins = [
    process.env.ADMIN_URL,
    process.env.MOBILE_APP_URL,
    'https://kairo-sooty.vercel.app'
  ].filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
          return callback(new Error('CORS not allowed'), false);
        }
        return callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  const onlineUsers = new Map(); // userId -> Set of socketIds
  const liveCalls = new Map(); // callId -> { userId, hostId, interval }

  io.on("connection", (socket) => {
    let currentUserId = null;

    // Register user when they connect
    socket.on('registerUser', async (userId) => {
      currentUserId = userId;
      
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);
      
      socket.join(userId);
      console.log(`User ${userId} connected with socket ${socket.id}`);
      
      // Update status only if this is the first connection for this user
      if (onlineUsers.get(userId).size === 1) {
        io.emit('userStatusChanged', { userId, status: 'online' });
        await User.findByIdAndUpdate(userId, { status: 'online' }).catch(() => {});
      }
    });

    // Handle private messages
    socket.on('sendMessage', async (data) => {
      const { senderId, receiverId, content } = data;
      try {
        const newMessage = new Message({ senderId, receiverId, content });
        await newMessage.save();

        const messageData = {
          _id: newMessage._id,
          senderId,
          receiverId,
          content,
          createdAt: newMessage.createdAt
        };

        io.to(receiverId).emit('receiveMessage', messageData);
        io.to(senderId).emit('receiveMessage', messageData);
      } catch (error) {
        console.error('Socket Message Error:', error);
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { senderId, receiverId, isTyping } = data;
      io.to(receiverId).emit('userTyping', { senderId, isTyping });
    });

    // Handle Live Call Coin Deduction
    socket.on('callStarted', async (data) => {
      const { callId, userId, hostId } = data;
      
      if (liveCalls.has(callId)) return;

      const interval = setInterval(async () => {
        try {
          const user = await User.findById(userId);
          const host = await Host.findById(hostId);
          
          if (!user || user.coins < 30) {
            io.to(userId).emit('callTerminated', { reason: 'Insufficient coins' });
            io.to(hostId).emit('callTerminated', { reason: 'User ran out of coins' });
            clearInterval(interval);
            liveCalls.delete(callId);
            return;
          }

          user.coins -= 30;
          await user.save();

          const hostShare = 30 * 0.7;
          const adminShare = 30 * 0.3;
          const adminShareINR = adminShare * 0.1;

          if (host && host.gender === 'Female' && host.isGenderVerified) {
            host.earnings += hostShare;
            await host.save();
            await Admin.findOneAndUpdate({}, { $inc: { totalRevenue: adminShareINR } });
          } else {
            await Admin.findOneAndUpdate({}, { $inc: { totalRevenue: 30 * 0.1 } });
          }

          await Call.findOneAndUpdate({ callId }, { $inc: { durationInMinutes: 1, coinsDeducted: 30 } });
          io.to(userId).emit('walletUpdate', { newBalance: user.coins });
        } catch (err) {
          console.error('Deduction Error:', err);
        }
      }, 60000);

      liveCalls.set(callId, { userId, hostId, interval });
    });

    socket.on('callEnded', (callId) => {
      if (liveCalls.has(callId)) {
        clearInterval(liveCalls.get(callId).interval);
        liveCalls.delete(callId);
      }
    });

    // Admin room participation
    socket.on('joinAdminRoom', () => {
      socket.join('admin-room');
    });

    socket.on("disconnect", async () => {
      if (currentUserId && onlineUsers.has(currentUserId)) {
        onlineUsers.get(currentUserId).delete(socket.id);
        
        if (onlineUsers.get(currentUserId).size === 0) {
          onlineUsers.delete(currentUserId);
          io.emit('userStatusChanged', { userId: currentUserId, status: 'offline' });
          await User.findByIdAndUpdate(currentUserId, { status: 'offline' }).catch(() => {});
          console.log(`User ${currentUserId} is now fully offline`);
        }
      }
      console.log("Client disconnected", socket.id);
    });
  });

  return io;
};

module.exports = setupSockets;
