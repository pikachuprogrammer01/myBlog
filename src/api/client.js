import axios from 'axios';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { getStorage, setStorage, removeStorage } from '@/utils/storage';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on each request
client.interceptors.request.use((config) => {
  const token = getStorage(STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Silent token refresh: queue concurrent 401s, refresh once, retry all
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

function redirectToLogin() {
  const path = window.location.pathname;
  if (!path.includes('/login') && !path.includes('/register')) {
    import('@/router').then(({ default: router }) => {
      router.push('/login').catch(() => {
        window.location.href = '/login';
      });
    });
  }
}

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Not 401, or already a retry — reject immediately
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // No token to refresh — just redirect
    const token = getStorage(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      removeStorage(STORAGE_KEYS.AUTH_TOKEN);
      removeStorage(STORAGE_KEYS.CURRENT_USER);
      redirectToLogin();
      return Promise.reject(error);
    }

    // If a refresh is in flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      });
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
      // Use a plain axios instance (no interceptors) to avoid infinite loops
      const refreshRes = await axios.post(
        `${API_BASE}/api/auth/refresh`,
        null,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (refreshRes.data.success) {
        const newToken = refreshRes.data.data.token;
        setStorage(STORAGE_KEYS.AUTH_TOKEN, newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      }

      // Refresh returned success: false
      throw new Error(refreshRes.data.message || '刷新失败');
    } catch (refreshError) {
      processQueue(refreshError, null);
      removeStorage(STORAGE_KEYS.AUTH_TOKEN);
      removeStorage(STORAGE_KEYS.CURRENT_USER);
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default client;
