import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

/** Route guard: anything nested inside needs a logged-in user. */
function RequireAuth() {
  const { user } = useAuth()
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default RequireAuth
