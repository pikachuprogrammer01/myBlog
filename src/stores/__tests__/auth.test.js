import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth.js'

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
    // 创建新的pinia实例
    setActivePinia(createPinia())
    // 清除localStorage模拟
    localStorageMock.clear()
  })

  it('初始状态正确', () => {
    const authStore = useAuthStore()
    expect(authStore.user).toBeNull()
    expect(authStore.token).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.isAdmin).toBe(false)
  })

  it('登录成功硬编码用户', () => {
    const authStore = useAuthStore()

    // 使用硬编码用户admin/admin123
    const result = authStore.login('admin', 'admin123')

    expect(result.success).toBe(true)
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user).toBeDefined()
    expect(authStore.user.username).toBe('admin')
    expect(authStore.user.role).toBe('admin')
    expect(authStore.isAdmin).toBe(true)
  })

  it('登录失败无效凭据', () => {
    const authStore = useAuthStore()

    const result = authStore.login('wrong', 'wrong')

    expect(result.success).toBe(false)
    expect(result.message).toBe('用户名或密码错误')
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.user).toBeNull()
  })

  it('注册新用户成功', () => {
    const authStore = useAuthStore()

    const result = authStore.register('newuser', 'newpass123')

    expect(result.success).toBe(true)
    // 注册后自动登录
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user.username).toBe('newuser')
    expect(authStore.user.role).toBe('user') // 默认角色
  })

  it('注册失败用户名已存在', () => {
    const authStore = useAuthStore()

    // 第一次注册成功
    authStore.register('existing', 'pass123')

    // 第二次注册相同用户名
    const result = authStore.register('existing', 'pass456')

    expect(result.success).toBe(false)
    expect(result.message).toBe('用户名已存在')
  })

  it('注销清除状态', () => {
    const authStore = useAuthStore()

    // 先登录
    authStore.login('admin', 'admin123')
    expect(authStore.isAuthenticated).toBe(true)

    // 注销
    authStore.logout()

    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.user).toBeNull()
    expect(authStore.token).toBeNull()
  })
})