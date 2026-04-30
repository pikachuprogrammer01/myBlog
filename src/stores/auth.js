import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import client from '@/api/client';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  function persistSession(authUser, authToken) {
    token.value = authToken;
    user.value = authUser;
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authToken);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(authUser));
    if (client.defaults.headers) {
      client.defaults.headers.Authorization = `Bearer ${authToken}`;
    }
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // 登录 — 调用后端 API
  async function login(username, password) {
    loading.value = true;
    try {
      const res = await client.post('/api/auth/login', { username, password });
      if (res.data.success) {
        persistSession(res.data.data.user, res.data.data.token);
        return { success: true, user: res.data.data.user };
      }
      return { success: false, message: res.data.message || '登录失败' };
    } catch (error) {
      const msg = error.response?.data?.message || '登录失败，请检查网络连接';
      return { success: false, message: msg };
    } finally {
      loading.value = false;
    }
  }

  // 注册 — 调用后端 API
  async function register(username, password) {
    loading.value = true;
    try {
      const res = await client.post('/api/auth/register', { username, password });
      if (res.data.success) {
        persistSession(res.data.data.user, res.data.data.token);
        return { success: true, user: res.data.data.user };
      }
      return { success: false, message: res.data.message || '注册失败' };
    } catch (error) {
      const msg = error.response?.data?.message || '注册失败，请检查网络连接';
      return { success: false, message: msg };
    } finally {
      loading.value = false;
    }
  }

  // 验证并恢复 session
  async function restoreSession() {
    if (!token.value) return false;
    loading.value = true;
    try {
      const res = await client.get('/api/auth/profile');
      if (res.data.success) {
        user.value = res.data.data;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(res.data.data));
        return true;
      }
      clearSession();
      return false;
    } catch {
      clearSession();
      return false;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    clearSession();
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    restoreSession,
    logout,
  };
});
