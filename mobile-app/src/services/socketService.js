import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './api';

const SOCKET_URL = BASE_URL;

class SocketService {
  /** @type {any} */
  socket = null;
  onBanHandler = () => {};
  onCallTerminatedHandler = () => {};
  onBalanceUpdateHandler = () => {};
  onGiftReceivedHandler = () => {};
  onStatusUpdateHandler = () => {};

  async connect(userId = null) {
    if (this.socket?.connected) return;

    const token = await AsyncStorage.getItem('userToken');
    if (!token) return;

    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token },
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket Connected Successfully');
        if (userId) {
          this.socket.emit('registerUser', userId);
        }
      });

      this.socket.on('connect_error', (err) => {
        console.error('❌ Socket Connection Error:', err.message);
      });

      this.socket.on('statusUpdate', (data) => {
        if (this.onStatusUpdateHandler) this.onStatusUpdateHandler(data);
      });

      this.socket.on('userBanned', (data) => {
        if (this.onBanHandler) this.onBanHandler(data);
      });

      this.socket.on('callTerminated', (data) => {
        if (this.onCallTerminatedHandler) this.onCallTerminatedHandler(data);
      });

      this.socket.on('balanceUpdated', (data) => {
        if (this.onBalanceUpdateHandler) this.onBalanceUpdateHandler(data);
      });

      this.socket.on('giftReceived', (data) => {
        if (this.onGiftReceivedHandler) this.onGiftReceivedHandler(data);
      });
    }
  }

  setBanHandler(handler) {
    this.onBanHandler = handler;
  }

  setCallTerminatedHandler(handler) {
    this.onCallTerminatedHandler = handler;
  }

  setBalanceUpdateHandler(handler) {
    this.onBalanceUpdateHandler = handler;
  }

  setGiftReceivedHandler(handler) {
    this.onGiftReceivedHandler = handler;
  }

  setStatusUpdateHandler(handler) {
    this.onStatusUpdateHandler = handler;
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
