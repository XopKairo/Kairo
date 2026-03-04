import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { loginUser, registerUser } from '../services/api';
import socketService from '../services/socketService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    async function init() {
      await Promise.all([
        loadStorageData(),
        checkMaintenance()
      ]);
    }
    init();
    
    // Periodically check for maintenance mode (every 5 minutes)
    const interval = setInterval(checkMaintenance, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function checkMaintenance() {
    try {
      const res = await api.get('/settings');
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
        socketService.connect(_user.id);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (contact, password) => {
    const data = await loginUser(contact, password);
    if (data.success) {
      setUser(data.user);
      socketService.connect(data.user.id);
    }
    return data;
  };

  const signUp = async (name, contact, password, isPhone, otpToken) => {
    const data = await registerUser(name, contact, password, isPhone, otpToken);
    if (data.success) {
      setUser(data.user);
      socketService.connect(data.user.id);
    }
    return data;
  };

  const signOut = async () => {
    await AsyncStorage.clear();
    socketService.disconnect();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isMaintenance, signIn, signUp, signOut, checkMaintenance }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
