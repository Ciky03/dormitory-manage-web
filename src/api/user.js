import { request } from './request'

export function fetchCurrentUser() {
  return request('/system/user/current', { method: 'GET' })
}
