import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with a status outside 2xx
      console.error(`[API Error] ${error.response.status} ${error.response.config.url}:`, error.response.data);
      if (error.response.status === 401 && error.response.config.url !== '/auth/login') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // The request was made but no response was received (CORS, network failure)
      console.error('[API Network/CORS Error] No response received:', error.message);
    } else {
      // Something happened in setting up the request
      console.error('[API Setup Error]:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
