import { request } from '../request'

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.append(key, value)
  })
  return query.toString()
}

export function fetchUnitTreeList(params = {}) {
  const query = buildQuery(params)
  const path = query ? `/business/edu/tree/list?${query}` : '/business/edu/tree/list'
  return request(path, { method: 'GET' })
}

export function fetchClassList(params = {}) {
  const query = buildQuery(params)
  const path = query ? `/business/edu/class/list?${query}` : '/business/edu/class/list'
  return request(path, { method: 'GET' })
}

export function addUnit(payload) {
  return request('/business/edu/add', {
    method: 'POST',
    body: payload
  })
}

export function fetchUnitForm(id) {
  return request(`/business/edu/form/${id}`, { method: 'GET' })
}

export function editUnit(id, payload) {
  return request(`/business/edu/edit/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function deleteUnit(id) {
  return request(`/business/edu/del/${id}`, { method: 'DELETE' })
}
