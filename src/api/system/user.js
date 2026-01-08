import { request } from '../request'

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.append(key, value)
  })
  return query.toString()
}

export function fetchCurrentUser() {
  return request('/system/user/current', { method: 'GET' })
}

export function fetchUserPage(params = {}) {
  const query = buildQuery(params)
  const path = query ? `/system/user/list/page?${query}` : '/system/user/list/page'
  return request(path, { method: 'GET' })
}

export function addUser(payload) {
  return request('/system/user/add', { method: 'POST', body: payload })
}

export function fetchUserForm(userId) {
  return request(`/system/user/form/${userId}`, { method: 'GET' })
}

export function editUser(userId, payload) {
  return request(`/system/user/edit/${userId}`, { method: 'PUT', body: payload })
}

export function updateUserStatus(userId, status) {
  return request(`/system/user/edit/${userId}/${status}`, { method: 'PUT' })
}

export function resetUserPassword(userId) {
  return request(`/system/user/pwd/reset/${userId}`, { method: 'PUT' })
}

export function deleteUser(ids) {
  return request(`/system/user/del/${ids}`, { method: 'DELETE' })
}
