import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../core/auth/AuthProvider'
import LoadingSpinner from '../components/LoadingSpinner'
import { ROUTES } from './routes'
import { signOut } from '../services/authService'

// ─────────────────────────────────────────────
// Requires the user to be authenticated.
// Redirects to /login if not.
// ─────────────────────────────────────────────
export const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner center size="lg" message="Loading…" />
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />
  return children
}

// ─────────────────────────────────────────────
// Requires the user to have one of the given roles.
// Redirects to /unauthorized if role doesn't match.
// While profile is still loading (user exists but profile
// hasn't resolved yet) we show a spinner.
// ─────────────────────────────────────────────
export const RoleRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, profile, loading } = useAuth()
  if (loading) return <LoadingSpinner center size="lg" message="Loading…" />
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />
  // Profile still resolving — keep waiting
  if (!profile) {
    const handleReLogin = async () => {
      try {
        // Clear auth state before redirect
        await signOut()
        window.location.href = '/login'
      } catch (err) {
        console.error('Force re-login error:', err)
        toast.error('Failed to re-login. Please close this tab and login again.')
        // Fallback: still try to redirect even if signOut fails
        setTimeout(() => {
          window.location.href = '/login'
        }, 500)
      }
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <LoadingSpinner center size="lg" message="Loading profile…" />
        <div className="mt-8 text-center max-w-sm px-6">
          <p className="text-slate-500 font-medium mb-4">
            If this takes too long, your session or profile might be invalid.
          </p>
          <button 
            onClick={handleReLogin}
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