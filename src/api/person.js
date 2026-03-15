import { request } from './request'

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

export function fetchRoleIdByCode(roleCode) {
  return request(`/system/role/get/${roleCode}`, { method: 'GET' })
}
