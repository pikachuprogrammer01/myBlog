import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";

export function useAuth() {
  const authStore = useAuthStore();
  const currentUser = computed(() => authStore.user);
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const isAdmin = computed(() => authStore.isAdmin);

  // 检查用户是否登录
  const checkAuth = () => {
    return isAuthenticated.value;
  };

  // 检查是否为管理员
  const checkAdmin = () => {
    return isAdmin.value;
  };

  // 获取当前用户
  const getCurrentUser = () => {
    return currentUser.value;
  };

  // 登录包装函数
  const login = async (username, password) => {
    return authStore.login(username, password);
  };

  // 注册包装函数
  const register = async (username, password) => {
    return authStore.register(username, password);
  };

  // 注销
  const logout = () => {
    authStore.logout();
  };

  const getAllUsers = () => {
    return authStore.getAllUsers();
  };

  const promoteUserToAdmin = (userId) => {
    return authStore.promoteUserToAdmin(userId);
  };

  const resetLocalUsers = () => {
    return authStore.resetLocalUsers();
  };

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    checkAuth,
    checkAdmin,
    getCurrentUser,
    login,
    register,
    logout,
    getAllUsers,
    promoteUserToAdmin,
    resetLocalUsers,
  };
}
