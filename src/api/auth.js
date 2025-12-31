import { request } from './request'

export function login({ username, password }) {
  const body = new URLSearchParams({
    username,
    password,
    grant_type: 'password'
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
