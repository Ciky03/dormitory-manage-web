import { request } from '../request'

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.append(key, value)
  })
  return query.toString()
}

export function fetchMyRoomProfile() {
  return request('/business/dormitory/convention/room/current', { method: 'GET' })
}

export function fetchCurrentConvention() {
  return request('/business/dormitory/convention/current', { method: 'GET' })
}

export function fetchDraftConvention() {
  return request('/business/dormitory/convention/draft/current', { method: 'GET' })
}

export function fetchConventionMyAck() {
  return request('/business/dormitory/convention/ack/current', { method: 'GET' })
}

export function fetchConventionAckStats() {
  return request('/business/dormitory/convention/ack/stats', { method: 'GET' })
}

export function fetchConventionAckState(id) {
  return request(`/business/dormitory/convention/ack/state/${encodeURIComponent(id)}`, {
    method: 'GET'
  })
}

export function fetchConventionRecentVersions(limit = 5) {
  const query = buildQuery({ limit })
  return request(`/business/dormitory/convention/version/recent?${query}`, { method: 'GET' })
}

export function fetchConventionHistory(roomId) {
  return request(`/business/dormitory/convention/history/${encodeURIComponent(roomId)}`, {
    method: 'GET'
  })
}

export function fetchConventionVersionDetail(id) {
  return request(`/business/dormitory/convention/form/${id}`, { method: 'GET' })
}

export function saveConventionDraft(payload) {
  return request('/business/dormitory/convention/add', {
    method: 'POST',
    body: payload
  })
}

export function editConventionDraft(id, payload) {
  return request(`/business/dormitory/convention/edit/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload
  })
}

export function publishConventionDraft(id) {
  return request(`/business/dormitory/convention/publish/${encodeURIComponent(id)}`, {
    method: 'POST'
  })
}

export function markConventionRead(payload = {}) {
  return request('/business/dormitory/convention/ack', {
    method: 'POST',
    body: {
      conventionId: payload.conventionId,
      agreeFlag: null
    }
  })
}

export function agreeConvention(payload = {}) {
  return request('/business/dormitory/convention/ack', {
    method: 'POST',
    body: {
      conventionId: payload.conventionId,
      agreeFlag: true
    }
  })
}
