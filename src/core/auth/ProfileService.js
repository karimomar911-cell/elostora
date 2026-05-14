import { supabase } from '../api/supabaseClient'

export const ProfileService = {
  fetchProfile: async (userId) => {
    const query = supabase
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

    // Attempt to filter by is_deleted. 
    // If the column doesn't exist (schema drift), this will fail.
    const { data, error } = await query.eq('is_deleted', false).single()

    if (error) {
      // 42703 = Undefined Column (is_deleted missing in DB)
      if (error.code === '42703') {
        console.warn('[ProfileService] is_deleted column missing in DB. Falling back to unfiltered query.')
        const fallback = await query.single()
        if (fallback.error && fallback.error.code !== 'PGRST116') throw fallback.error
        return fallback.data || null
      }
      
      // PGRST116 = No rows found (normal case for new users/deleted users)
      if (error.code === 'PGRST116') return null
      
      throw error
    }
    
    return data || null
  }
}
