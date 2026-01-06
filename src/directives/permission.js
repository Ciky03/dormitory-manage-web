import { getPermissions, hasPermission } from '../util/permission/permission'

const hideElement = (el) => {
  if (el.__permissionVisibility === undefined) {
    el.__permissionVisibility = el.style.visibility || ''
  }
  if (el.__permissionPointerEvents === undefined) {
    el.__permissionPointerEvents = el.style.pointerEvents || ''
  }
  el.style.visibility = 'hidden'
  el.style.pointerEvents = 'none'
}

const showElement = (el) => {
  if (el.__permissionVisibility !== undefined) {
    el.style.visibility = el.__permissionVisibility
  } else {
    el.style.visibility = ''
  }
  if (el.__permissionPointerEvents !== undefined) {
    el.style.pointerEvents = el.__permissionPointerEvents
  } else {
    el.style.pointerEvents = ''
  }
}

const applyPermission = (el) => {
  const required = el.__permissionValue
  const allowed = hasPermission(required, getPermissions())
  if (allowed) {
    showElement(el)
  } else {
    hideElement(el)
  }
}

const attachListener = (el) => {
  if (typeof window === 'undefined') return
  const handler = () => applyPermission(el)
  el.__permissionHandler = handler
  window.addEventListener('permissions-updated', handler)
}

const detachListener = (el) => {
  if (typeof window === 'undefined') return
  if (el.__permissionHandler) {
    window.removeEventListener('permissions-updated', el.__permissionHandler)
    delete el.__permissionHandler
  }
}

export default {
  mounted(el, binding) {
    el.__permissionValue = binding.value
    applyPermission(el)
    attachListener(el)
  },
  updated(el, binding) {
    el.__permissionValue = binding.value
    applyPermission(el)
  },
  unmounted(el) {
    detachListener(el)
  }
}
