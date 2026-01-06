const PERMISSION_STORAGE_KEY =
  import.meta.env.VITE_PERMISSION_KEY ?? 'permission_codes'

const normalizePermissions = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) {
    return payload.map((item) => String(item)).filter(Boolean)
  }
  if (typeof payload === 'string') {
    return [payload].filter(Boolean)
  }
  if (Array.isArray(payload?.permissions)) {
    return payload.permissions.map((item) => String(item)).filter(Boolean)
  }
  if (Array.isArray(payload?.data)) {
    return payload.data.map((item) => String(item)).filter(Boolean)
  }
  return []
}

export const setPermissions = (permissions = []) => {
  if (typeof localStorage === 'undefined') return []
  const list = normalizePermissions(permissions)
  localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(list))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('permissions-updated'))
  }
  return list
}

export const getPermissions = () => {
  if (typeof localStorage === 'undefined') return []
  const cached = localStorage.getItem(PERMISSION_STORAGE_KEY)
  if (!cached) return []
  try {
    const parsed = JSON.parse(cached)
    return normalizePermissions(parsed)
  } catch (error) {
    return normalizePermissions(cached)
  }
}

export const clearPermissions = () => {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(PERMISSION_STORAGE_KEY)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('permissions-updated'))
  }
}

export const hasPermission = (required, permissions = getPermissions()) => {
  if (!required) return false
  const permissionList = normalizePermissions(permissions)
  if (Array.isArray(required)) {
    return required.some((item) => permissionList.includes(String(item)))
  }
  return permissionList.includes(String(required))
}
