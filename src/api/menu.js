import { request } from './request'

export function fetchMenuList() {
  return request('/system/menu/list', { method: 'GET' })
}

export function fetchMenuOptions() {
  return request('/system/menu/options', { method: 'GET' })
}

export function fetchMenuSort(parentId) {
  const query = encodeURIComponent(parentId ?? '')
  return request(`/system/config/sort/menu?parentId=${query}`, { method: 'GET' })
}

export function fetchMenuForm(menuId) {
  return request(`/system/menu/form/${menuId}`, { method: 'GET' })
}

export function addMenu(payload) {
  return request('/system/menu/add', { method: 'POST', body: payload })
}

export function editMenu(menuId, payload) {
  return request(`/system/menu/edit/${menuId}`, { method: 'PUT', body: payload })
}

export function updateMenuVisible(menuId, visible) {
  return request(`/system/menu/edit/${menuId}/${visible}`, { method: 'PUT' })
}

export function deleteMenu(ids) {
  return request(`/system/menu/del/${ids}`, { method: 'DELETE' })
}
