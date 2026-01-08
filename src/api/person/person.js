import { request } from '../request'

export function editPassword(payload) {
  return request('/system/user/pwd/edit', { method: 'PUT', body: payload })
}
