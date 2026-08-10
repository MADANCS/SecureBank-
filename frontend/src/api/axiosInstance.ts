import axios from 'axios';

// Default to live Render backend API URL if VITE_API_BASE_URL is not set
const DEFAULT_API_URL = 'https://securebank-c41z.onrender.com/api';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_URL;

const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string> | null = null;

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (!refreshPromise) {
        refreshPromise = instance
          .post('/auth/refresh', null, { params: { refreshToken: localStorage.getItem('refreshToken') } })
          .then((res) => {
            localStorage.setItem('accessToken', res.data.accessToken);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            refreshPromise = null;
            return res.data.accessToken;
          })
          .catch((e) => {
            refreshPromise = null;
            throw e;
          });
      }
      await refreshPromise;
      return instance(originalRequest);
    }
    throw error;
  }
);

export default instance;
