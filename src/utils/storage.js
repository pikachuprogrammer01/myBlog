// localStorage封装

// 获取数据
export function getStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`读取localStorage失败 (key: ${key}):`, error)
    return defaultValue
  }
}

// 设置数据
export function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`写入localStorage失败 (key: ${key}):`, error)
    return false
  }
}

// 删除数据
export function removeStorage(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`删除localStorage失败 (key: ${key}):`, error)
    return false
  }
}

// 清空所有数据
export function clearStorage() {
  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error('清空localStorage失败:', error)
    return false
  }
}

// 检查localStorage是否可用
export function isStorageAvailable() {
  try {
    const testKey = '__test__'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch (error) {
    console.warn('localStorage不可用:', error)
    return false
  }
}