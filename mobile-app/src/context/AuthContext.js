import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser } from '../services/api';
import socketService from '../services/socketService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

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
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
