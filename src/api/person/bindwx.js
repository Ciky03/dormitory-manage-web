import { request } from '../request'

export function fetchWxQrCodeInfo() {
  return request('/auth/wx/mp/bind/qrCode/info')
}

export function fetchWxQrCodeStatus(bindToken) {
  return request(`/auth/wx/mp/bind/qrCode/status?bindToken=${encodeURIComponent(bindToken)}`)
}
