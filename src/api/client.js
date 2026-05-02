import axios from 'axios';
import { STORAGE_KEYS } from '@/constants/storage-keys';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on each request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear session, let router guard redirect
client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      // Use SPA navigation instead of hard reload to avoid flash
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/register')) {
        import('@/router').then(({ default: router }) => {
          router.push('/login').catch(() => {
            window.location.href = '/login';
          });
        });
      }
    }
    return Promise.reject(error);
  }
);

export default client;
