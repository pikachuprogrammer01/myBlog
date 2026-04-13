import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const authStore = useAuthStore()

  // 检查用户是否登录
  const checkAuth = () => {
    return authStore.isAuthenticated
  }

  // 检查是否为管理员
  const checkAdmin = () => {
    return authStore.isAdmin
  }

  // 获取当前用户
  const getCurrentUser = () => {
    return authStore.user
  }

  // 登录包装函数
  const login = async (username, password) => {
    return authStore.login(username, password)
  }

  // 注册包装函数
  const register = async (username, password) => {
    return authStore.register(username, password)
  }

  // 注销
  const logout = () => {
    authStore.logout()
  }

  return {
    checkAuth,
    checkAdmin,
    getCurrentUser,
    login,
    register,
    logout
  }
}