import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from './api';

const SOCKET_URL = BASE_URL;

class SocketService {
  /** @type {any} */
  socket = null;
  userId = null;
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
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      console.log('⚠️ No token found for socket connection');
      return;
    }

    // If socket exists, check if it's the same user and connected
    if (this.socket) {
      if (this.socket.connected && this.userId === userId) {
        return;
      }
      // If user changed or disconnected, cleanup old socket
      this.disconnect();
    }

    this.userId = userId;
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
      timeout: 30000,
      reconnection: true,
      reconnectionAttempts: 20, // Increased for better stability
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket Connected Successfully');
      if (this.userId) {
        this.socket.emit('registerUser', this.userId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('⚠️ Socket Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Socket Connection Error:', err.message);
      // If unauthorized, we might need a token refresh logic here
    });

    this.socket.on('statusUpdate', (data) => {
      if (typeof this.onStatusUpdateHandler === 'function') this.onStatusUpdateHandler(data);
    });

    this.socket.on('userBanned', (data) => {
      if (typeof this.onBanHandler === 'function') this.onBanHandler(data);
    });

    this.socket.on('callTerminated', (data) => {
      if (typeof this.onCallTerminatedHandler === 'function') this.onCallTerminatedHandler(data);
    });

    this.socket.on('balanceUpdated', (data) => {
      if (typeof this.onBalanceUpdateHandler === 'function') this.onBalanceUpdateHandler(data);
    });

    this.socket.on('giftReceived', (data) => {
      if (typeof this.onGiftReceivedHandler === 'function') this.onGiftReceivedHandler(data);
    });

    this.socket.on('incomingCall', (data) => {
      if (typeof this.onIncomingCallHandler === 'function') this.onIncomingCallHandler(data);
    });

    this.socket.on('callTimeout', (data) => {
      if (typeof this.onCallTimeoutHandler === 'function') this.onCallTimeoutHandler(data);
    });

    this.socket.on('callActive', (data) => {
      if (typeof this.onCallActiveHandler === 'function') this.onCallActiveHandler(data);
    });

    this.socket.on('callEnded', (data) => {
      if (typeof this.onCallEndedHandler === 'function') this.onCallEndedHandler(data);
    });

    this.socket.on('callError', (data) => {
      if (typeof this.onCallErrorHandler === 'function') this.onCallErrorHandler(data);
    });

    this.socket.on('forceDisconnect', (data) => {
      if (typeof this.onForceDisconnectHandler === 'function') this.onForceDisconnectHandler(data);
    });
  }

  setBanHandler(handler) {
    this.onBanHandler = handler || (() => {});
  }

  setCallTerminatedHandler(handler) {
    this.onCallTerminatedHandler = handler || (() => {});
  }

  setBalanceUpdateHandler(handler) {
    this.onBalanceUpdateHandler = handler || (() => {});
  }

  setGiftReceivedHandler(handler) {
    this.onGiftReceivedHandler = handler || (() => {});
  }

  setStatusUpdateHandler(handler) {
    this.onStatusUpdateHandler = handler || (() => {});
  }

  setIncomingCallHandler(handler) {
    this.onIncomingCallHandler = handler || (() => {});
  }

  setCallTimeoutHandler(handler) {
    this.onCallTimeoutHandler = handler || (() => {});
  }

  setCallActiveHandler(handler) {
    this.onCallActiveHandler = handler || (() => {});
  }

  setCallEndedHandler(handler) {
    this.onCallEndedHandler = handler || (() => {});
  }

  setCallErrorHandler(handler) {
    this.onCallErrorHandler = handler || (() => {});
  }

  setForceDisconnectHandler(handler) {
    this.onForceDisconnectHandler = handler || (() => {});
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  notifyCallStarted(data) {
    if (this.socket?.connected) {
      this.socket.emit('callStarted', data);
    }
  }

  notifyCallEnded(callId) {
    if (this.socket?.connected) {
      this.socket.emit('callEnded', callId);
    }
  }
}

export default new SocketService();
