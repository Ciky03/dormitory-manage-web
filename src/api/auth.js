import { request } from './request'

export function login({ username, password, captchaKey, captchaCode }) {
  const body = new URLSearchParams({
    username,
    password,
    grant_type: 'password',
    ...(captchaKey ? { captchaKey } : {}),
    ...(captchaCode ? { captchaCode } : {})
  })
  const basicAuth = import.meta.env.VITE_OAUTH_BASIC_AUTH
  const tokenKey = import.meta.env.VITE_AUTH_TOKEN_KEY ?? 'token'

  return request('/auth/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: basicAuth ? `Basic ${basicAuth}` : undefined,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  }).then((res) => {
    const accessToken = res?.data?.access_token
    if (accessToken) {
      localStorage.setItem(tokenKey, accessToken)
    }
    return res
  })
}

export function loginWithWechatMp(code) {
  const body = new URLSearchParams({
    grant_type: 'wechatmp',
    code
  })
  const basicAuth = import.meta.env.VITE_OAUTH_BASIC_AUTH
  const tokenKey = import.meta.env.VITE_AUTH_TOKEN_KEY ?? 'token'

  return request('/auth/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: basicAuth ? `Basic ${basicAuth}` : undefined,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  }).then((res) => {
    const accessToken = res?.data?.access_token
    if (accessToken) {
      localStorage.setItem(tokenKey, accessToken)
    }
    return res
  })
}

export function fetchCaptcha() {
  return request('/auth/captcha')
}

export function fetchWxLoginQrCodeInfo() {
  return request('/auth/wx/mp/login/qrCode/info')
}

export function fetchWxLoginQrCodeStatus(loginToken) {
  return request(`/auth/wx/mp/login/qrCode/status?loginToken=${encodeURIComponent(loginToken)}`)
}
