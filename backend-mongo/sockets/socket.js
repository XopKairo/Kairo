const { Server } = require("socket.io");
const Message = require('../models/Message');
const User = require('../models/User');

const setupSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        /https:\/\/.*\.vercel\.app$/,
        'https://kairo-admin.vercel.app',
        'https://kairo-sooty.vercel.app',
        process.env.ADMIN_URL,
        process.env.MOBILE_APP_URL
      ].filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  const onlineUsers = new Map(); // userId -> Set of socketIds

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
