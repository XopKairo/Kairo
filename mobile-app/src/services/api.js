import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://kairo-b1i9.onrender.com/api';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to add the token to every request
api.interceptors.request.use(
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

export const loginUser = async (contact, password) => {
  try {
    const response = await api.post('/user/auth/login', { contact, password });
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const registerUser = async (name, contact, password, isPhone) => {
  try {
    const payload = { name, password };
    if (isPhone) payload.phone = contact;
    else payload.email = contact;

    const response = await api.post('/user/auth/register', payload);
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const sendOtp = async (contact) => {
  try {
    const response = await api.post('/user/auth/send-otp', { contact });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const verifyOtp = async (contact, otp) => {
  try {
    const response = await api.post('/user/auth/verify-otp', { contact, otp });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const resetPassword = async (contact, newPassword) => {
  try {
    const response = await api.post('/user/auth/reset-password', { contact, newPassword });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const logoutUser = async () => {
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('userData');
};

export default api;
