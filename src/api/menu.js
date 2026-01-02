import { request } from './request'

export function fetchMenuList() {
  return request('/system/menu/list', { method: 'GET' })
}

export function fetchMenuOptions() {
  return request('/system/menu/options', { method: 'GET' })
}

export function addMenu(payload) {
  return request('/system/menu/add', { method: 'POST', body: payload })
}

export function editMenu(menuId, payload) {
  return request(`/system/menu/edit/${menuId}`, { method: 'PUT', body: payload })
}
