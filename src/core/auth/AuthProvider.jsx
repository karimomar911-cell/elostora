import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { SessionManager } from './SessionManager'
import { ProfileService } from './ProfileService'
import { ROLE_HOME } from '../routing/routes'
import { supabase } from '../api/supabaseClient'
import { validateSchema } from '../api/schemaValidator'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const [recoveryRequired, setRecoveryRequired] = useState(false)
  const navigate = useNavigate()

  const loadProfile = useCallback(async (userId, userMetadata = {}) => {
    try {
      // Fetch profile with schema-error resilience already handled in ProfileService
      const profileData = await ProfileService.fetchProfile(userId)
      
      if (profileData) {
        setProfile(profileData)
        setRecoveryRequired(false)
        return profileData
      }
    } catch (err) {
      console.error('[AuthProvider] fetchProfile failed (ignoring to allow fallback):', err.message)
      // We don't throw here; we let the metadata fallback below handle it
    }

      // If no profile exists yet, fall back to the authenticated user's metadata.
      // This is required in development when the profile trigger has not created a row.
      if (userMetadata?.role) {
        const fallbackProfile = {
          id: userId,
          full_name: userMetadata.full_name || userMetadata.email || 'User',
          phone: userMetadata.phone || null,
          role: userMetadata.role,
          service_center_id: userMetadata.service_center_id || null,
        }

        setProfile(fallbackProfile)
        setRecoveryRequired(false)
        return fallbackProfile
      }

      // No profile and no usable metadata: require recovery.
      setRecoveryRequired(true)
      await SessionManager.signOut()
      setProfile(null)
      setUser(null)
      return null
    } catch (err) {
      console.error('Failed to load profile:', err)
      setProfile(null)
      throw err
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let ignore = false // Prevent race conditions from multiple concurrent profile loads

    const bootstrap = async () => {
      // 1. Validate Schema Drift (Non-blocking but diagnostic)
      await validateSchema()

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted || ignore) return
        
        if (session?.user) {
          setUser(session.user)
          // Mark that we're loading profile to prevent race conditions
          const previousIgnore = ignore
          try {
            await loadProfile(session.user.id, session.user.user_metadata)
          } catch (err) {
            if (!ignore && !previousIgnore) {
              console.error('Bootstrap profile load error:', err.message)
            }
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error('Bootstrap session error:', err.message)
        }
      } finally {
        if (mounted && !ignore) {
          setLoading(false)
          setAuthReady(true)
        }
      }
    }

    bootstrap()

    // Listen for sign-out / token refresh across tabs
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted || ignore) return
        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
        if (event === 'TOKEN_REFRESHED' && session) {
          setUser(session.user)
        }
      }
    )

    return () => {
      mounted = false
      ignore = true // Prevent any pending operations from updating state
      subscription?.unsubscribe()
    }
  }, [loadProfile])

  // Accepts both { email, password } object (legacy) or (email, password) args
  const login = async (emailOrObj, passwordArg) => {
    const email    = typeof emailOrObj === 'object' ? emailOrObj.email    : emailOrObj
    const password = typeof emailOrObj === 'object' ? emailOrObj.password : passwordArg

    setLoading(true)
    setRecoveryRequired(false)
    try {
      const { user: authUser } = await SessionManager.signIn(email, password)
      setUser(authUser)

      const profileData = await loadProfile(authUser.id, authUser.user_metadata)
      if (!profileData) {
        throw new Error('Profile not found. Contact your administrator.')
      }

      const destination = ROLE_HOME[profileData.role]
      if (!destination) {
        throw new Error(`Your account role (${profileData.role}) is not authorized. Contact the system developer.`)
      }

      toast.success(`Welcome back, ${profileData.full_name || 'User'}!`)
      navigate(destination, { replace: true })
      return profileData
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await SessionManager.signOut()
      setUser(null)
      setProfile(null)
      setRecoveryRequired(false)
      toast.success('Signed out successfully.')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error('Sign out failed. Please try again.')
      console.error(err)
    }
  }

  const hasRole = (roles = []) => !!profile && roles.includes(profile.role)

  const value = {
    user,
    profile,
    setProfile,       // backward compat — some pages mutate profile directly
    loading,
    authReady,
    recoveryRequired,
    role: profile?.role ?? null,
    login,
    logout,
    hasRole,
    loadProfile,      // backward compat
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
