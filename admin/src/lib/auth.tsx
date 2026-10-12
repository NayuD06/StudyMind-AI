import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, refreshSession, SESSION_EXPIRED, setAccessToken, type User } from './api.ts'

type AuthValue = {
  user: User | null
  loading: boolean
  login: (input: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>
  logoutAll: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Khi tải lại trang, access token trong bộ nhớ đã mất: dùng cookie refresh để khôi phục phiên
  useEffect(() => {
    refreshSession()
      .then((session) => setUser(session.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))

    const expire = () => {
      setAccessToken(null)
      setUser(null)
    }
    window.addEventListener(SESSION_EXPIRED, expire)
    return () => window.removeEventListener(SESSION_EXPIRED, expire)
  }, [])

  const value: AuthValue = {
    user,
    loading,
    login: async (input) => {
      const { data } = await api.post('/auth/login', input)
      setAccessToken(data.accessToken)
      setUser(data.user)
    },
    logout: async () => {
      await api.post('/auth/logout')
      setAccessToken(null)
      setUser(null)
    },
    // Server hủy mọi phiên cũ và trả về phiên mới cho thiết bị này
    changePassword: async (input) => {
      const { data } = await api.post('/auth/change-password', input)
      setAccessToken(data.accessToken)
      setUser(data.user)
    },
    logoutAll: async () => {
      await api.post('/auth/logout-all')
      setAccessToken(null)
      setUser(null)
    },
  }

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth phải dùng bên trong AuthProvider')
  return value
}
