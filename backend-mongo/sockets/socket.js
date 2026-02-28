const { Server } = require("socket.io");
const Message = require('../models/Message');
const User = require('../models/User');

const setupSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // allow all origins for now
      methods: ["GET", "POST"]
    }
  });

  const onlineUsers = new Map(); // Map userId -> socketId

  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    // Register user when they connect
    socket.on('registerUser', async (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
      console.log(`User ${userId} is online with socket ${socket.id}`);
      
      // Broadcast user online status
      io.emit('userStatusChanged', { userId, status: 'online' });
      await User.findByIdAndUpdate(userId, { status: 'online' });
    });

    // Handle private messages
    socket.on('sendMessage', async (data) => {
      const { senderId, receiverId, content } = data;
      try {
        // Save to DB
        const newMessage = new Message({ senderId, receiverId, content });
        await newMessage.save();

        const messageData = {
          _id: newMessage._id,
          senderId,
          receiverId,
          content,
          createdAt: newMessage.createdAt
        };

        // Emit to receiver if online
        io.to(receiverId).emit('receiveMessage', messageData);
        // Also emit back to sender (useful for multiple devices)
        io.to(senderId).emit('receiveMessage', messageData);
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { senderId, receiverId, isTyping } = data;
      io.to(receiverId).emit('userTyping', { senderId, isTyping });
    });

    // Explicitly join admin room
    socket.on('joinAdminRoom', () => {
      socket.join('admin-room');
      console.log(`Socket ${socket.id} joined admin-room`);
    });

    socket.on("newPayoutRequest", (data) => {
      io.to('admin-room').emit('payoutAlert', data);
    });

    socket.on("newSupportTicket", (data) => {
       io.to('admin-room').emit('supportAlert', data);
    });

    socket.on("liveCallStarted", (data) => {
        io.to('admin-room').emit('callStartedAlert', data);
    });

    socket.on("disconnect", async () => {
      console.log("Client disconnected", socket.id);
      let disconnectedUserId = null;
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }
      if (disconnectedUserId) {
         io.emit('userStatusChanged', { userId: disconnectedUserId, status: 'offline' });
         await User.findByIdAndUpdate(disconnectedUserId, { status: 'offline' }).catch(e => console.log(e));
      }
    });
  });

  return io;
};

module.exports = setupSockets;
