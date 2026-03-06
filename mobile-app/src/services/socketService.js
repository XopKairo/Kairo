import { io } from 'socket.io-client';
import { BASE_URL } from './api';

const SOCKET_URL = BASE_URL;

class SocketService {
  socket = null;
  onBanHandler = null;
  onCallTerminatedHandler = null;

  connect(userId = null) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL);
      this.socket.on('connect', () => {
        if (userId) {
          // Both joinUserRoom and registerUser are used in backend
          this.socket.emit('registerUser', userId);
        }
      });

      this.socket.on('userBanned', (data) => {
        if (this.onBanHandler) this.onBanHandler(data);
      });

      this.socket.on('callTerminated', (data) => {
        if (this.onCallTerminatedHandler) this.onCallTerminatedHandler(data);
      });
    }
  }

  setBanHandler(handler) {
    this.onBanHandler = handler;
  }

  setCallTerminatedHandler(handler) {
    this.onCallTerminatedHandler = handler;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  notifyCallStarted(data) {
    if (this.socket) {
      // Data should include callId, userId, hostId
      this.socket.emit('callStarted', data);
    }
  }

  notifyCallEnded(callId) {
    if (this.socket) {
      this.socket.emit('callEnded', callId);
    }
  }
}

export default new SocketService();
