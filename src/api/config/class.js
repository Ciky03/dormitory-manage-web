import { request } from '../request'

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.append(key, value)
  })
  return query.toString()
}

export function fetchUnitTreeList() {
  return request('/business/unit/tree/list', { method: 'GET' })
}

export function fetchClassList(params = {}) {
  const query = buildQuery(params)
  const path = query ? `/business/unit/class/list?${query}` : '/business/unit/class/list'
  return request(path, { method: 'GET' })
}

export function addUnit(payload) {
  return request('/business/unit/add', {
    method: 'POST',
    body: payload
  })
}

export function fetchUnitForm(id) {
  return request(`/business/unit/form/${id}`, { method: 'GET' })
}

export function editUnit(id, payload) {
  return request(`/business/unit/edit/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function deleteUnit(id) {
  return request(`/business/unit/del/${id}`, { method: 'DELETE' })
}
