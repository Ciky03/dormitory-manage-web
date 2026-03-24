import { request } from '../request'

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.append(key, value)
  })
  return query.toString()
}

export function addRoom(payload) {
  return request('/business/dormitory/add', {
    method: 'POST',
    body: payload
  })
}

export function editRoom(id, payload) {
  return request(`/business/dormitory/edit/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function fetchRoomTreeList(params = {}) {
  const query = buildQuery(params)
  const path = query ? `/business/dormitory/tree/list?${query}` : '/business/dormitory/tree/list'
  return request(path, { method: 'GET' })
}

export function fetchBuildingList(params = {}) {
  return fetchRoomTreeList(params)
}

export function fetchRoomList(params = {}) {
  const query = buildQuery(params)
  const path = query ? `/business/dormitory/list?${query}` : '/business/dormitory/list'
  return request(path, { method: 'GET' })
}

export function deleteRoom(id) {
  return request(`/business/dormitory/del/${id}`, { method: 'DELETE' })
}

export function fetchRoomForm(id) {
  return request(`/business/dormitory/form/${id}`, { method: 'GET' })
}
