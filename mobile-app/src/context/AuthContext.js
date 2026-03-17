import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import api, { loginUser, googleLoginUser, fastLoginUser, registerUser, setMaintenanceHandler, setBlacklistHandler } from '../services/api';
import socketService from '../services/socketService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [blacklistMessage, setBlacklistMessage] = useState('');

  // Global Zora Alert State
  const [alertConfig, setAlertConfig] = useState({ 
    visible: false, title: '', message: '', type: 'error', confirmText: 'OK', buttons: [] 
  });

  const showAlert = (title, message, type = 'error', confirmText = 'OK', buttons = []) => {
    setAlertConfig({ visible: true, title, message, type, confirmText, buttons });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    // 1. API Handlers
    setMaintenanceHandler(setIsMaintenance);
    setBlacklistHandler((msg) => {
      setBlacklistMessage(msg);
      setIsBlacklisted(true);
    });

    // 2. Socket Listeners for Real-time Admin Controls
    socketService.setBanHandler((data) => {
      showAlert('Account Restricted', data.reason || 'You have been banned by admin.', 'error', 'SIGN OUT');
      setTimeout(signOut, 3000);
    });

    socketService.setBalanceUpdateHandler((data) => {
      setUser(prev => prev ? { ...prev, coins: data.newBalance } : null);
      AsyncStorage.getItem('userData').then(oldData => {
        if (oldData) {
          const updated = JSON.parse(oldData);
          updated.coins = data.newBalance;
          AsyncStorage.setItem('userData', JSON.stringify(updated));
        }
      });
    });

    async function init() {
      await Promise.all([
        loadStorageData(),
        checkMaintenance()
      ]);
    }
    init();
    
    const interval = setInterval(checkMaintenance, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function checkMaintenance() {
    try {
      const res = await api.get('public/settings/app');
      if (res.data && res.data.maintenance) {
        setIsMaintenance(true);
      } else {
        setIsMaintenance(false);
      }
    } catch (error) {
      if (error.status === 503) {
        setIsMaintenance(true);
      }
    }
  }

  async function loadStorageData() {
    try {
      const authDataSerialized = await AsyncStorage.getItem('userData');
      if (authDataSerialized) {
        const _user = JSON.parse(authDataSerialized);
        setUser(_user);
        socketService.connect(_user._id || _user.id);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (contact, otpToken) => {
    const data = await loginUser(contact, otpToken);
    if (data.success) {
      setUser(data.user);
      socketService.connect(data.user._id || data.user.id);
    }
    return data;
  };

  const fastSignIn = async (contact) => {
    const data = await fastLoginUser(contact);
    if (data.success) {
      setUser(data.user);
      socketService.connect(data.user._id || data.user.id);
    }
    return data;
  };

  const googleSignIn = async (idToken) => {
    const data = await googleLoginUser(idToken);
    if (data.success) {
      setUser(data.user);
      socketService.connect(data.user._id || data.user.id);
    }
    return data;
  };

  const signUp = async (name, contact, password, otpToken, additionalData) => {
    const data = await registerUser(name, contact, password, otpToken, additionalData);
    if (data.success) {
      setUser(data.user);
      socketService.connect(data.user._id || data.user.id);
    }
    return data;
  };

  const signOut = async () => {
    await AsyncStorage.clear();
    await SecureStore.deleteItemAsync('userToken');
    socketService.disconnect();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, isMaintenance, alertConfig, isBlacklisted, blacklistMessage,
      signIn, fastSignIn, googleSignIn, signUp, signOut, 
      checkMaintenance, showAlert, hideAlert 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
