import axios from 'axios'
import { AUTH_EXPIRED_EVENT, clearAuth, loadAuth } from '../auth/storage'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the token to every request.
api.interceptors.request.use((config) => {
  const auth = loadAuth()
  if (auth?.token) config.headers.Authorization = `Bearer ${auth.token}`
  return config
})

// An expired or revoked token means "log in again" (a wrong password on the login form is not this case).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url !== '/auth/login') {
      clearAuth()
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)

export default api
