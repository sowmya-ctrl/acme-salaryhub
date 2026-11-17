import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

/** Route guard: anything nested inside needs a logged-in user. */
function RequireAuth() {
  const { user } = useAuth()
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default RequireAuth
