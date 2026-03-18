import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
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
  onIncomingCallHandler = () => {};
  onCallTimeoutHandler = () => {};
  onCallActiveHandler = () => {};
  onCallEndedHandler = () => {};
  onCallErrorHandler = () => {};
  onForceDisconnectHandler = () => {};

  async connect(userId = null) {
    if (this.socket?.connected) return;

    const token = await SecureStore.getItemAsync('userToken');
    if (!token) return;

    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
        auth: { token },
        timeout: 20000, // Increase timeout to 20 seconds
        reconnectionAttempts: 5,
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

      this.socket.on('incomingCall', (data) => {
        if (this.onIncomingCallHandler) this.onIncomingCallHandler(data);
      });

      this.socket.on('callTimeout', (data) => {
        if (this.onCallTimeoutHandler) this.onCallTimeoutHandler(data);
      });

      this.socket.on('callActive', (data) => {
        if (this.onCallActiveHandler) this.onCallActiveHandler(data);
      });

      this.socket.on('callEnded', (data) => {
        if (this.onCallEndedHandler) this.onCallEndedHandler(data);
      });

      this.socket.on('callError', (data) => {
        if (this.onCallErrorHandler) this.onCallErrorHandler(data);
      });

      this.socket.on('forceDisconnect', (data) => {
        if (this.onForceDisconnectHandler) this.onForceDisconnectHandler(data);
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

  setIncomingCallHandler(handler) {
    this.onIncomingCallHandler = handler;
  }

  setCallTimeoutHandler(handler) {
    this.onCallTimeoutHandler = handler;
  }

  setCallActiveHandler(handler) {
    this.onCallActiveHandler = handler;
  }

  setCallEndedHandler(handler) {
    this.onCallEndedHandler = handler;
  }

  setCallErrorHandler(handler) {
    this.onCallErrorHandler = handler;
  }

  setForceDisconnectHandler(handler) {
    this.onForceDisconnectHandler = handler;
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
