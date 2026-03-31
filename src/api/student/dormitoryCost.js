import { request } from '../request'

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.append(key, value)
  })
  return query.toString()
}

const unwrapResult = (payload) => payload?.data ?? payload ?? {}

export async function fetchDormitoryCostStat() {
  const payload = await request('/dormitory/cost/stat', { method: 'GET' })
  return unwrapResult(payload)
}

export async function fetchDormitoryCostList(params = {}) {
  const query = buildQuery(params)
  const payload = await request(`/dormitory/cost/list${query ? `?${query}` : ''}`, { method: 'GET' })
  const data = unwrapResult(payload)
  return {
    list: Array.isArray(data?.list) ? data.list : [],
    total: Number(data?.total ?? 0)
  }
}

export async function fetchDormitoryCostDetail(id) {
  const payload = await request(`/dormitory/cost/detail/${encodeURIComponent(id)}`, { method: 'GET' })
  return unwrapResult(payload)
}

export function addDormitoryCost(body) {
  return request('/dormitory/cost/add', { method: 'POST', body })
}

export function editDormitoryCost(id, body) {
  return request(`/dormitory/cost/edit/${encodeURIComponent(id)}`, { method: 'PUT', body })
}

export function publishDormitoryCost(id) {
  return request(`/dormitory/cost/publish/${encodeURIComponent(id)}`, { method: 'POST' })
}

export function payDormitoryCost(detailId, body) {
  return request(`/dormitory/cost/pay/${encodeURIComponent(detailId)}`, { method: 'POST', body })
}

export function cancelDormitoryCost(id) {
  return request(`/dormitory/cost/cancel/${encodeURIComponent(id)}`, { method: 'POST' })
}

export function deleteDormitoryCost(id) {
  return request(`/dormitory/cost/del/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function uploadDormitoryCostAttach(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bucket', 'dm-business-cost')
  return request('/attach/upload', { method: 'POST', body: formData })
}
