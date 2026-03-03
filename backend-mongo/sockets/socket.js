const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
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

  // JWT Verification Middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error("Authentication error: Invalid token"));
      socket.decoded = decoded;
      next();
    });
  });

  const onlineUsers = new Map(); // userId -> Set of socketIds
  const liveCalls = new Map(); // callId -> { userId, hostId, interval }

  io.on("connection", (socket) => {
    const currentUserId = socket.decoded.id;
    console.log(`User ${currentUserId} connected with socket ${socket.id}`);

    // Join user-specific room
    socket.join(currentUserId);

    // Register user status
    const registerUser = async (userId) => {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);
      
      if (onlineUsers.get(userId).size === 1) {
        io.emit('userStatusChanged', { userId, status: 'online' });
        await User.findByIdAndUpdate(userId, { status: 'online' }).catch(() => {});
      }
    };

    registerUser(currentUserId);

    // Handle private messages
    socket.on('sendMessage', async (data) => {
      const { receiverId, content } = data;
      const senderId = currentUserId; // Security: use verified ID from token
      
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
      const { receiverId, isTyping } = data;
      io.to(receiverId).emit('userTyping', { senderId: currentUserId, isTyping });
    });

    // Handle Live Call Coin Deduction
    socket.on('callStarted', async (data) => {
      const { callId, hostId } = data;
      const userId = currentUserId; // Security: use verified ID
      
      if (liveCalls.has(callId)) return;

      const performDeduction = async () => {
        try {
          const user = await User.findById(userId);
          const host = await Host.findById(hostId);
          
          if (!user || user.coins < 30) {
            io.to(userId).emit('callTerminated', { reason: 'Insufficient coins' });
            io.to(hostId).emit('callTerminated', { reason: 'User ran out of coins' });
            if (liveCalls.has(callId)) {
                clearInterval(liveCalls.get(callId).interval);
                liveCalls.delete(callId);
            }
            return false;
          }

          // Deduct 30 coins per minute
          user.coins -= 30;
          await user.save();

          // EARNINGS SPLIT LOGIC: 70/30 for verified female hosts, 100% admin otherwise
          const isVerifiedFemale = host && host.gender === 'Female' && host.isGenderVerified;
          
          if (isVerifiedFemale) {
            const hostShare = 30 * 0.7;
            const adminShare = 30 * 0.3;
            // Admin share in INR (Conversion 1:0.1 for reporting)
            const adminShareINR = Number((adminShare * 0.1).toFixed(2));
            
            host.earnings += hostShare;
            await host.save();
            await Admin.findOneAndUpdate({}, { $inc: { totalRevenue: adminShareINR } });
          } else {
            // 100% to Admin
            const totalINR = Number((30 * 0.1).toFixed(2));
            await Admin.findOneAndUpdate({}, { $inc: { totalRevenue: totalINR } });
          }

          await Call.findOneAndUpdate({ callId }, { $inc: { durationInMinutes: 1, coinsDeducted: 30 } });
          io.to(userId).emit('walletUpdate', { newBalance: user.coins });
          return true;
        } catch (err) {
          console.error('Deduction Error:', err);
          return false;
        }
      };

      // Immediate first deduction
      const success = await performDeduction();
      if (!success) return;

      const interval = setInterval(performDeduction, 60000);
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
      // Ensure only admins can join if possible, but decoded.role can be checked
      if (socket.decoded.role === 'admin') {
        socket.join('admin-room');
      }
    });

    socket.on("disconnect", async () => {
      // Clear any active calls this user was part of
      for (const [callId, callData] of liveCalls.entries()) {
        if (callData.userId === currentUserId || callData.hostId === currentUserId) {
          clearInterval(callData.interval);
          liveCalls.delete(callId);
          // Notify other party
          const otherId = callData.userId === currentUserId ? callData.hostId : callData.userId;
          io.to(otherId).emit('callTerminated', { reason: 'Partner disconnected' });
        }
      }

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
