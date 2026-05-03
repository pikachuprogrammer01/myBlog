import { getStorage, setStorage, removeStorage } from './storage';

const DEFAULT_TTL = 5 * 60 * 1000

export function getCache(key, ttl = DEFAULT_TTL) {
  try {
    const cached = getStorage(key)
    if (!cached) return null
    const { data, timestamp } = cached
    if (Date.now() - timestamp > ttl) {
      removeStorage(key)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function setCache(key, data) {
  setStorage(key, { data, timestamp: Date.now() })
}

export function removeCache(key) {
  removeStorage(key)
}
