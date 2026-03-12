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
  return request('/business/room/add', {
    method: 'POST',
    body: payload
  })
}

export function editRoom(id, payload) {
  return request(`/business/room/edit/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function fetchBuildingList() {
  return request('/business/room/building/list', { method: 'GET' })
}

export function fetchRoomList(params = {}) {
  const query = buildQuery(params)
  const path = query ? `/business/room/list?${query}` : '/business/room/list'
  return request(path, { method: 'GET' })
}

export function deleteRoom(id) {
  return request(`/business/room/del/${id}`, { method: 'DELETE' })
}

export function fetchRoomForm(id) {
  return request(`/business/room/form/${id}`, { method: 'GET' })
}
