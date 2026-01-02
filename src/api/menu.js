import { request } from './request'

export function fetchMenuList() {
  return request('/system/menu/list', { method: 'GET' })
}
