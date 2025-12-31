const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const SUCCESS_CODE = import.meta.env.VITE_API_SUCCESS_CODE ?? '200'

const TOKEN_STORAGE_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY ?? 'token'

const getMessage = (payload, status) =>
  payload?.msg ||
  payload?.message ||
  payload ||
  `Request failed with ${status}`

export async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const isFormData = options.body instanceof FormData
  const isUrlEncoded = options.body instanceof URLSearchParams
  const hasJsonBody = options.body && typeof options.body === 'object' && !isFormData && !isUrlEncoded

  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body: hasJsonBody ? JSON.stringify(options.body) : options.body
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const error = new Error(getMessage(data, response.status))
    error.status = response.status
    error.data = data
    throw error
  }

  if (data && typeof data === 'object' && 'code' in data) {
    if (data.msg && !('message' in data)) {
      data.message = data.msg
    }

    if (String(data.code) !== String(SUCCESS_CODE)) {
      const error = new Error(getMessage(data, response.status))
      error.status = response.status
      error.data = data
      throw error
    }
  }

  return data
}
