import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { request, restoreSession, setAccessToken, type AuthUser } from '@/services/api'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, organizationName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleExpiredSession = () => {
      setAccessToken(null)
      setUser(null)
    }
    window.addEventListener('structiqx:session-expired', handleExpiredSession)
    restoreSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
    return () => window.removeEventListener('structiqx:session-expired', handleExpiredSession)
  }, [])

  const authenticate = useCallback(async (path: string, body: object) => {
    const result = await request<{ accessToken: string; user: AuthUser }>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }, false)
    setAccessToken(result.accessToken)
    setUser(result.user)
  }, [])

  const signIn = useCallback((email: string, password: string) =>
    authenticate('/auth/login', { email, password }), [authenticate])

  const register = useCallback((name: string, email: string, password: string, organizationName: string) =>
    authenticate('/auth/register', { name, email, password, organizationName }), [authenticate])

  const signOut = useCallback(async () => {
    try {
      await request<void>('/auth/logout', { method: 'POST' }, false)
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, loading, signIn, register, signOut }), [user, loading, signIn, register, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
