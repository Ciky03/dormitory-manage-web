import { request } from './request'

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.append(key, value)
  })
  return query.toString()
}

export function addStudent(payload) {
  return request('/business/person/student/add', {
    method: 'POST',
    body: payload
  })
}

export function addTeacher(payload) {
  return request('/business/person/teacher/add', {
    method: 'POST',
    body: payload
  })
}

export function addDormitoryManager(payload) {
  return request('/business/person/dm/add', {
    method: 'POST',
    body: payload
  })
}

export function editStudent(id, payload) {
  return request(`/business/person/student/edit/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function editTeacher(id, payload) {
  return request(`/business/person/teacher/edit/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function editDormitoryManager(id, payload) {
  return request(`/business/person/dm/edit/${id}`, {
    method: 'PUT',
    body: payload
  })
}

export function fetchRoleIdByCode(roleCode) {
  return request(`/system/role/get/${roleCode}`, { method: 'GET' })
}

export function fetchStudentList(params = {}) {
  const query = buildQuery(params)
  const path = query ? `/business/person/student/list?${query}` : '/business/person/student/list'
  return request(path, { method: 'GET' })
}

export function fetchTeacherList(params = {}) {
  const query = buildQuery(params)
  const path = query ? `/business/person/teacher/list?${query}` : '/business/person/teacher/list'
  return request(path, { method: 'GET' })
}

export function fetchDormitoryManagerList(params = {}) {
  const query = buildQuery(params)
  const path = query ? `/business/person/dm/list?${query}` : '/business/person/dm/list'
  return request(path, { method: 'GET' })
}

export function fetchStudentForm(id) {
  return request(`/business/person/student/form/${id}`, { method: 'GET' })
}

export function fetchTeacherForm(id) {
  return request(`/business/person/teacher/form/${id}`, { method: 'GET' })
}

export function fetchDormitoryManagerForm(id) {
  return request(`/business/person/dm/form/${id}`, { method: 'GET' })
}

export function deleteStudent(id) {
  return request(`/business/person/student/del/${id}`, { method: 'DELETE' })
}

export function deleteTeacher(id) {
  return request(`/business/person/teacher/del/${id}`, { method: 'DELETE' })
}

export function deleteDormitoryManager(id) {
  return request(`/business/person/dm/del/${id}`, { method: 'DELETE' })
}

export function addStudentClassConfig(payload) {
  return request('/business/person/class/student/add', {
    method: 'POST',
    body: payload
  })
}

export function addStudentRoomConfig(payload) {
  return request('/business/person/room/student/add', {
    method: 'POST',
    body: payload
  })
}
