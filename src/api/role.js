import { request } from './request'

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.append(key, value)
  })
  return query.toString()
}

export function fetchRolePage(params = {}) {
  const query = buildQuery(params)
  const path = query ? `/system/role/list/page?${query}` : '/system/role/list/page'
  return request(path, { method: 'GET' })
}

export function addRole(payload) {
  return request('/system/role/add', { method: 'POST', body: payload })
}

export function fetchRoleForm(roleId) {
  return request(`/system/role/form/${roleId}`, { method: 'GET' })
}

export function editRole(roleId, payload) {
  return request(`/system/role/edit/${roleId}`, { method: 'PUT', body: payload })
}

export function updateRoleStatus(roleId, status) {
  return request(`/system/role/edit/${roleId}/${status}`, { method: 'PUT' })
}

export function deleteRole(ids) {
  return request(`/system/role/del/${ids}`, { method: 'DELETE' })
}

export function fetchRoleMenuIds(roleId) {
  return request(`/system/role/menuIds/${roleId}`, { method: 'GET' })
}

export function updateRoleMenus(roleId, menuIds = []) {
  return request(`/system/role/menus/${roleId}`, {
    method: 'PUT',
    body: menuIds
  })
}
