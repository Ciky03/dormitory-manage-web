const USER_STORAGE_KEY = import.meta.env.VITE_USER_STORAGE_KEY ?? 'current_user'

const normalizeUser = (payload) => {
  if (payload?.data && typeof payload.data === 'object') return payload.data
  if (payload && typeof payload === 'object') return payload
  return {}
}

export const setCurrentUser = (payload) => {
  if (typeof localStorage === 'undefined') return normalizeUser(payload)
  const user = normalizeUser(payload)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('user-updated'))
  }
  return user
}

export const getCurrentUser = () => {
  if (typeof localStorage === 'undefined') return {}
  const cached = localStorage.getItem(USER_STORAGE_KEY)
  if (!cached) return {}
  try {
    const parsed = JSON.parse(cached)
    return normalizeUser(parsed)
  } catch (error) {
    return {}
  }
}

export const clearCurrentUser = () => {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(USER_STORAGE_KEY)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('user-updated'))
  }
}
