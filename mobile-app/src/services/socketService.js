import { io } from 'socket.io-client';

const SOCKET_URL = 'https://kairo-b1i9.onrender.com';

class SocketService {
  socket = null;

  connect(userId = null) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL);
      this.socket.on('connect', () => {
        console.log('Connected to socket server:', this.socket.id);
        if (userId) {
          this.socket.emit('joinUserRoom', userId);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  notifyCallStarted(data) {
    if (this.socket) {
      this.socket.emit('liveCallStarted', data);
    }
  }
}

export default new SocketService();
