import { supabase } from '../api/supabaseClient'

export const ProfileService = {
  fetchProfile: async (userId) => {
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
      .eq('is_deleted', false)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    // PGRST116 means zero rows returned
    return data || null
  }
}
