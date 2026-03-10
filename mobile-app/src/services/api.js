import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Public Environment Variable for Expo
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://kairo-b1i9.onrender.com/api';
export const BASE_URL = API_URL.replace(/\/api$/, '');

const API = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Subscription mechanism for maintenance events
let onMaintenanceTrigger = (_status) => {};
let onBlacklistTrigger = (_message) => {};

export const setMaintenanceHandler = (handler) => {
  onMaintenanceTrigger = handler;
};

export const setBlacklistHandler = (handler) => {
  onBlacklistTrigger = handler;
};

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

// Global response interceptor to handle Maintenance (503), Blacklist (403) and Auth (401)
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 503) {
        onMaintenanceTrigger(true);
      } else if (status === 403) {
        onBlacklistTrigger(data.message || 'Access restricted');
      } else if (status === 401) {
        // Clear token and logout if unauthorized (except on login path)
        if (!error.config.url.includes('/login')) {
          await logoutUser();
        }
      }
    }
    return Promise.reject(error);
  }
);

// Compatibility logic for older calls
export const loginUser = async (contact, otpToken) => {
  try {
    const response = await API.post('/user/auth/login', { contact, otp_verified_token: otpToken });
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const registerUser = async (name, contact, _, otpToken, additionalData = {}) => {
  try {
    const payload = {
      name,
      otp_verified_token: otpToken,
      phone: contact,
      ...additionalData
    };

    const response = await API.post('/user/auth/register', payload);    if (response.data.token) {
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
