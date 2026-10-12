import axios, { type InternalAxiosRequestConfig } from 'axios'

export type User = { id: number; name: string; email: string; role: 'STUDENT' | 'ADMIN' }
type Session = { user: User; accessToken: string }

// withCredentials để trình duyệt gửi kèm cookie refresh token (httpOnly)
export const api = axios.create({ baseURL: '/api', withCredentials: true })

// Access token chỉ nằm trong bộ nhớ, không lưu localStorage, nên mã độc XSS không đọc lại được sau khi tải trang
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// Nhiều nơi cùng cần làm mới phiên thì dùng chung một request, vì mỗi refresh token chỉ dùng được một lần
let refreshing: Promise<Session> | null = null

export function refreshSession() {
  refreshing ??= api
    .post<Session>('/auth/refresh')
    .then((res) => {
      accessToken = res.data.accessToken
      return res.data
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

// Access token hết hạn (401): làm mới phiên rồi gửi lại request đúng một lần
api.interceptors.response.use(undefined, async (error) => {
  const config = error.config as (InternalAxiosRequestConfig & { retried?: boolean }) | undefined
  const isAuthCall = config?.url?.startsWith('/auth/')
  if (error.response?.status !== 401 || !config || config.retried || isAuthCall) throw error

  config.retried = true
  await refreshSession()
  return api(config)
})

// Lấy thông báo lỗi tiếng Việt do backend trả về
export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) return error.response?.data?.message ?? 'Không kết nối được máy chủ'
  return 'Đã có lỗi xảy ra'
}
