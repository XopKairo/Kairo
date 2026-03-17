import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const env_api_url = process.env.EXPO_PUBLIC_API_URL;
if (!env_api_url) console.warn("WARNING: EXPO_PUBLIC_API_URL is missing!");
export const BASE_URL = env_api_url ? (env_api_url.endsWith('/') ? env_api_url.slice(0, -1) : env_api_url) : '';
export const API_URL = `${BASE_URL}/api/`;

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
    const token = await SecureStore.getItemAsync('userToken');
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
        if (error.config.url && !error.config.url.endsWith('login')) {
          await logoutUser();
        }
      }
    }
    return Promise.reject(error);
  }
);

export const googleLoginUser = async (idToken) => {
  try {
    const response = await API.post('user/auth/google-login', { idToken });
    if (response.data.token) {
      await SecureStore.setItemAsync('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const firebaseLoginUser = async (idToken) => {
  try {
    const response = await API.post('user/auth/firebase-login', { idToken });
    if (response.data.token) {
      await SecureStore.setItemAsync('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const fastLoginUser = async (contact) => {
  try {
    const response = await API.post('user/auth/fast-login', { contact });
    if (response.data.token) {
      await SecureStore.setItemAsync('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const registerUser = async (name, contact, _, otpToken, additionalData = {}) => {
  try {
    const isMultipart = !!additionalData.profilePicture;
    let payload;
    let headers = {};

    if (isMultipart) {
      payload = new FormData();
      payload.append('name', name);
      payload.append('otp_verified_token', otpToken);
      payload.append('phone', contact);

      Object.keys(additionalData).forEach(key => {
        if (key === 'profilePicture' && additionalData[key]) {
          const uri = additionalData[key];
          const filename = uri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image`;
          
          payload.append('profilePicture', {
            uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
            name: filename,
            type
          });
        } else if (Array.isArray(additionalData[key])) {
          payload.append(key, JSON.stringify(additionalData[key]));
        } else if (additionalData[key]) {
          payload.append(key, additionalData[key]);
        }
      });
      headers = { 'Content-Type': 'multipart/form-data' };
    } else {
      payload = {
        name,
        phone: contact,
        otp_verified_token: otpToken,
        ...additionalData
      };
    }

    const response = await API.post('user/auth/register', payload, { headers });

    if (response.data.token) {
      await SecureStore.setItemAsync('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const updateUserProfile = async (userId, data) => {
  try {
    const response = await API.put('user/auth/profile-update', data);
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
    const response = await API.post('user/auth/send-otp', { contact });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const verifyOtp = async (contact, otp) => {
  try {
    const response = await API.post('user/auth/verify-otp', { contact, otp });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const logoutUser = async () => {
  await SecureStore.deleteItemAsync('userToken');
  await AsyncStorage.removeItem('userData');
};

export const getAppSettings = async () => {
  try {
    const response = await API.get('public/settings');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export default API;
