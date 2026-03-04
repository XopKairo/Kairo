const setupSockets = (io) => {
  io.on('connection', (socket) => {
    console.log('🔗 New Client Connected:', socket.id);

    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`👤 User joined room: ${roomId}`);
    });

    socket.on('callStarted', (data) => {
      io.to(data.receiverId).emit('incomingCall', data);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client Disconnected');
    });
  });
};

export default setupSockets;
