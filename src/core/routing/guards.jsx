import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import LoadingSpinner from '../../components/LoadingSpinner'
import { ROUTES } from './routes'

/**
 * Requires the user to be authenticated.
 * Redirects to /login if not.
 */
export const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingSpinner center size="lg" message="Loading…" />
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />

  return children
}

/**
 * Requires the user to have one of the given roles.
 * Redirects to /unauthorized if role doesn't match.
 */
export const RoleRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, profile, loading } = useAuth()

  if (loading) return <LoadingSpinner center size="lg" message="Loading…" />
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />

  // Profile still resolving — keep waiting
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <LoadingSpinner center size="lg" message="Loading profile…" />
        <div className="mt-8 text-center max-w-sm px-6">
          <p className="text-slate-500 font-medium mb-4">If this takes too long, your session or profile might be invalid.</p>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="btn-secondary w-full"
          >
            Force Reload / Re-Login
          </button>
        </div>
      </div>
    )
  }

  if (!roles.includes(profile.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />
  }

  return children
}
