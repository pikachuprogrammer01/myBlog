import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

export function useAuth() {
  const authStore = useAuthStore();

  const currentUser = computed(() => authStore.user);
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const isAdmin = computed(() => authStore.isAdmin);

  function login(username, password) {
    return authStore.login(username, password);
  }

  function register(username, password) {
    return authStore.register(username, password);
  }

  function logout() {
    authStore.logout();
  }

  function restoreSession() {
    return authStore.restoreSession();
  }

  function updateAvatar(imageBase64) {
    return authStore.updateAvatarUrl(imageBase64);
  }

  function removeAvatar() {
    return authStore.removeAvatarUrl();
  }

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    restoreSession,
    updateAvatar,
    removeAvatar,
  };
}
