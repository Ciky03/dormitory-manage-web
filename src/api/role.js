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
