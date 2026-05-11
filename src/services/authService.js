import { supabase } from '../core/api/supabaseClient'
import { validateLogin, validatePasswordChange, validateUserCreation, isValidUUID } from '../utils/validation'

// ─────────────────────────────────────────────
// Sign in with email + password
// ─────────────────────────────────────────────
export const signIn = async ({ email, password }) => {
  // Validate input
  validateLogin(email, password)
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ─────────────────────────────────────────────
// Sign out current user
// ─────────────────────────────────────────────
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ─────────────────────────────────────────────
// Fetch profile row for a given user id
// Joins service_centers so we have center info available globally
// ─────────────────────────────────────────────
export const fetchProfile = async (userId) => {
  // Validate UUID
  if (!isValidUUID(userId)) {
    throw new Error('Invalid user ID format')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      phone,
      role,
      service_center_id,
      created_at,
      service_centers (
        id,
        name,
        logo_url
      )
    `)
    .eq('id', userId)

  if (error) throw error
  return data?.[0]
}

// ─────────────────────────────────────────────
// Update password for the currently signed-in user
// ─────────────────────────────────────────────
export const updatePassword = async (newPassword) => {
  // Validate input
  validatePasswordChange(newPassword)
  
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

// ─────────────────────────────────────────────
// Get active session (non-reactive, one-time read)
// ─────────────────────────────────────────────
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// ─────────────────────────────────────────────
// Create user from admin/employee interface
// Uses an isolated client to prevent session override
// ─────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'
import { supabaseUrl, supabaseAnonKey } from '../core/api/supabaseClient'

export const adminCreateUser = async ({ email, password, full_name, phone, role, service_center_id }) => {
  // Validate all inputs before creating user
  const validated = validateUserCreation({ 
    email, 
    password, 
    full_name, 
    phone, 
    role, 
    service_center_id 
  })

  const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  })

  const { data, error } = await adminClient.auth.signUp({
    email: validated.email,
    password: validated.password,
    options: {
      data: {
        full_name: validated.full_name,
        phone: validated.phone,
        role: validated.role,
        service_center_id: validated.service_center_id
      }
    }
  })

  if (error) throw error
  return data
}