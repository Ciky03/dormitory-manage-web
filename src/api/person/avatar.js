import { request } from '../request'

export function uploadAvatar(file, bucket) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bucket', bucket)
  return request('/system/attach/upload', { method: 'POST', body: formData })
}

export function updateUserAvatar(attachId) {
  return request(`/system/user/avatar/edit?attachId=${encodeURIComponent(attachId)}`, { method: 'PUT' })
}
