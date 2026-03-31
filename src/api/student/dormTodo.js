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

export async function fetchDormTodoStat() {
  const payload = await request('/business/dormitory/todo/stat', { method: 'GET' })
  return unwrapResult(payload)
}

export async function fetchDormTodoList(params = {}) {
  const query = buildQuery(params)
  const payload = await request(`/business/dormitory/todo/list${query ? `?${query}` : ''}`, { method: 'GET' })
  const data = unwrapResult(payload)
  return {
    list: Array.isArray(data?.list) ? data.list : [],
    total: Number(data?.total ?? 0)
  }
}

export async function fetchDormTodoDetail(id) {
  const payload = await request(`/business/dormitory/todo/detail/${encodeURIComponent(id)}`, { method: 'GET' })
  return unwrapResult(payload)
}

export async function fetchDormTodoCommentList(todoId) {
  const payload = await request(`/business/dormitory/todo/comment/list/${encodeURIComponent(todoId)}`, {
    method: 'GET'
  })
  const data = unwrapResult(payload)
  return Array.isArray(data) ? data : []
}

export async function fetchDormTodoAssigneeOptions() {
  const payload = await request('/business/dormitory/todo/assignee/options', { method: 'GET' })
  const data = unwrapResult(payload)
  return Array.isArray(data) ? data : []
}

export function addDormTodo(body) {
  return request('/business/dormitory/todo/add', { method: 'POST', body })
}

export function editDormTodo(id, body) {
  return request(`/business/dormitory/todo/edit/${encodeURIComponent(id)}`, { method: 'PUT', body })
}

export function startDormTodo(id) {
  return request(`/business/dormitory/todo/start/${encodeURIComponent(id)}`, { method: 'POST' })
}

export function completeDormTodo(id) {
  return request(`/business/dormitory/todo/complete/${encodeURIComponent(id)}`, { method: 'POST' })
}

export function cancelDormTodo(id, body) {
  return request(`/business/dormitory/todo/cancel/${encodeURIComponent(id)}`, { method: 'POST', body })
}

export function addDormTodoComment(body) {
  return request('/business/dormitory/todo/comment/add', { method: 'POST', body })
}