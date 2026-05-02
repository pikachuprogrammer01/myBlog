import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth.js'

// Mock auth service
vi.mock('@/api/services/authService', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getProfile: vi.fn(),
}))

import { login as loginApi, register as registerApi, getProfile } from '@/api/services/authService'

// 模拟localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn(key => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

// 模拟全局localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('初始状态正确', () => {
    const authStore = useAuthStore()
    expect(authStore.user).toBeNull()
    expect(authStore.token).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.isAdmin).toBe(false)
  })

  it('登录成功', async () => {
    loginApi.mockResolvedValue({
      data: {
        success: true,
        data: {
          user: { username: 'admin', role: 'admin' },
          token: 'fake-token',
        },
      },
    })

    const authStore = useAuthStore()
    const result = await authStore.login('admin', 'admin123')

    expect(result.success).toBe(true)
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user).toBeDefined()
    expect(authStore.user.username).toBe('admin')
    expect(authStore.user.role).toBe('admin')
    expect(authStore.isAdmin).toBe(true)
  })

  it('登录失败无效凭据', async () => {
    loginApi.mockRejectedValue({
      response: { data: { message: '用户名或密码错误' } },
    })

    const authStore = useAuthStore()
    const result = await authStore.login('wrong', 'wrong')

    expect(result.success).toBe(false)
    expect(result.message).toBe('用户名或密码错误')
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.user).toBeNull()
  })

  it('注册新用户成功', async () => {
    registerApi.mockResolvedValue({
      data: {
        success: true,
        data: {
          user: { username: 'newuser', role: 'user' },
          token: 'fake-token',
        },
      },
    })

    const authStore = useAuthStore()
    const result = await authStore.register('newuser', 'newpass123')

    expect(result.success).toBe(true)
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user.username).toBe('newuser')
    expect(authStore.user.role).toBe('user')
  })

  it('注册失败用户名已存在', async () => {
    registerApi.mockRejectedValue({
      response: { data: { message: '用户名已存在' } },
    })

    const authStore = useAuthStore()
    const result = await authStore.register('existing', 'pass456')

    expect(result.success).toBe(false)
    expect(result.message).toBe('用户名已存在')
  })

  it('注销清除状态', async () => {
    loginApi.mockResolvedValue({
      data: {
        success: true,
        data: {
          user: { username: 'admin', role: 'admin' },
          token: 'fake-token',
        },
      },
    })

    const authStore = useAuthStore()
    await authStore.login('admin', 'admin123')
    expect(authStore.isAuthenticated).toBe(true)

    authStore.logout()

    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.user).toBeNull()
    expect(authStore.token).toBeNull()
  })
})
