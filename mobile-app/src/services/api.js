import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Public Environment Variable for Expo
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://kairo-b1i9.onrender.com/api';
// Extract base URL for sockets/assets (removes /api suffix if present)
export const BASE_URL = API_URL.replace(/\/api$/, '');

const API = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Interceptor to add the token to every request
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global response interceptor
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    return Promise.reject(error);
  }
);

// Compatibility logic for older calls
export const loginUser = async (contact, password) => {
  try {
    const response = await API.post('/user/auth/login', { contact, password });
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const registerUser = async (name, contact, password, isPhone, otpToken) => {
  try {
    const payload = { 
      name, 
      password, 
      otp_verified_token: otpToken
    };
    if (isPhone) payload.phone = contact;
    else payload.email = contact;

    const response = await API.post('/user/auth/register', payload);
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateUserProfile = async (userId, data) => {
  try {
    const response = await API.put(`/users/${userId}/profile`, data);
    if (response.data.user) {
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const sendOtp = async (contact) => {
  try {
    const response = await API.post('/user/auth/send-otp', { contact });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const verifyOtp = async (contact, otp) => {
  try {
    const response = await API.post('/user/auth/verify-otp', { contact, otp });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const resetPassword = async (contact, newPassword) => {
  try {
    const response = await API.post('/user/auth/reset-password', { contact, newPassword });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const logoutUser = async () => {
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('userData');
};

export const getAppSettings = async () => {
  try {
    const response = await API.get('/settings');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export default API;
