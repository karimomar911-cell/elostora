import { supabase } from '../api/supabaseClient'

export const SessionManager = {
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },
  
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },
  
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  onAuthStateChange: (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
    return subscription
  }
}
