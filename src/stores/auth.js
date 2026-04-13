import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STORAGE_KEYS } from '@/constants/storage-keys'
import { HARDCODED_USERS } from '@/constants/users'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // 获取所有用户（硬编码 + 本地注册）
  const getAllUsers = () => {
    const localUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]')
    return [...HARDCODED_USERS, ...localUsers]
  }

  // 登录功能
  const login = (username, password) => {
    const users = getAllUsers()
    const foundUser = users.find(u => u.username === username && u.password === password)

    if (!foundUser) {
      return { success: false, message: '用户名或密码错误' }
    }

    // 生成模拟token
    const mockToken = `mock_jwt_${Date.now()}_${Math.random().toString(36).substr(2)}`
    token.value = mockToken
    user.value = foundUser

    // 保存到localStorage
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, mockToken)
    // 保存用户信息（不含密码）
    const userWithoutPassword = { ...foundUser }
    delete userWithoutPassword.password
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userWithoutPassword))

    return { success: true, user: foundUser }
  }

  // 注册功能
  const register = (username, password) => {
    const users = getAllUsers()

    // 检查用户名是否已存在
    if (users.some(u => u.username === username)) {
      return { success: false, message: '用户名已存在' }
    }

    // 创建新用户
    const newUser = {
      id: `user_${Date.now()}`,
      username,
      password,
      role: 'user'
    }

    // 保存到localStorage
    const localUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]')
    localUsers.push(newUser)
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(localUsers))

    // 自动登录
    const loginResult = login(username, password)
    return loginResult
  }

  // 注销功能
  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
  }

  // 初始化：从localStorage恢复用户状态
  const init = () => {
    if (token.value) {
      // 尝试从localStorage恢复用户信息
      const userInfo = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
      if (userInfo) {
        try {
          user.value = JSON.parse(userInfo)
        } catch (e) {
          // 解析失败，清除无效状态
          console.error('Failed to parse user info:', e)
          token.value = null
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
        }
      } else {
        // 用户信息不存在，清除token
        token.value = null
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      }
    }
  }

  // 初始化
  init()

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    getAllUsers
  }
})