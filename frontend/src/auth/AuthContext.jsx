import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { AUTH_EXPIRED_EVENT, clearAuth, loadAuth, saveAuth } from './storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadAuth()?.user ?? null)

  // The API client announces expired/revoked tokens; treat that as being logged out.
  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    saveAuth({ token: data.access_token, user: data.user })
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
