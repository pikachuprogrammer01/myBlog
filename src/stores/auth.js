import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { getStorage, setStorage, removeStorage } from '@/utils/storage';
import { login as loginApi, register as registerApi, getProfile, uploadAvatar, deleteAvatar } from '@/api/services/authService';

export const useAuthStore = defineStore('auth', () => {
  const savedUser = getStorage(STORAGE_KEYS.CURRENT_USER);
  const user = ref(savedUser);
  const token = ref(getStorage(STORAGE_KEYS.AUTH_TOKEN, null));
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  function persistSession(authUser, authToken) {
    token.value = authToken;
    user.value = authUser;
    setStorage(STORAGE_KEYS.AUTH_TOKEN, authToken);
    setStorage(STORAGE_KEYS.CURRENT_USER, authUser);
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    removeStorage(STORAGE_KEYS.AUTH_TOKEN);
    removeStorage(STORAGE_KEYS.CURRENT_USER);
  }

  // 登录 — 调用后端 API
  async function login(username, password) {
    loading.value = true;
    try {
      const res = await loginApi(username, password);
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
      const res = await registerApi(username, password);
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
      const res = await getProfile();
      if (res.data.success) {
        user.value = res.data.data;
        setStorage(STORAGE_KEYS.CURRENT_USER, res.data.data);
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

  async function updateAvatarUrl(imageBase64) {
    const res = await uploadAvatar(imageBase64);
    if (res.data.success) {
      // Re-fetch profile to ensure local state matches server
      try {
        const profileRes = await getProfile();
        if (profileRes.data.success) {
          user.value = profileRes.data.data;
          setStorage(STORAGE_KEYS.CURRENT_USER, profileRes.data.data);
        }
      } catch {
        user.value = { ...user.value, avatarUrl: res.data.data.avatarUrl };
        setStorage(STORAGE_KEYS.CURRENT_USER, user.value);
      }
    }
    return res.data;
  }

  async function removeAvatarUrl() {
    const res = await deleteAvatar();
    if (res.data.success) {
      try {
        const profileRes = await getProfile();
        if (profileRes.data.success) {
          user.value = profileRes.data.data;
          setStorage(STORAGE_KEYS.CURRENT_USER, profileRes.data.data);
        }
      } catch {
        user.value = { ...user.value, avatarUrl: null };
        setStorage(STORAGE_KEYS.CURRENT_USER, user.value);
      }
    }
    return res.data;
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
    updateAvatarUrl,
    removeAvatarUrl,
  };
});
