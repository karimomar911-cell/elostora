import { supabase } from '../lib/supabaseClient'

// ─────────────────────────────────────────────
// Search invoices by client name or car model
// Scoped to service center for non-developers
// ─────────────────────────────────────────────
export const searchInvoices = async (query, centerId = null) => {
  let req = supabase
    .from('invoices')
    .select(`
      id,
      client_name,
      car_model,
      service_date,
      final_price,
      service_center_id,
      service_centers ( id, name )
    `)
    .or(`client_name.ilike.%${query}%,car_model.ilike.%${query}%`)
    .order('service_date', { ascending: false })
    .limit(20)

  if (centerId) req = req.eq('service_center_id', centerId)

  const { data, error } = await req
  if (error) throw error
  return data
}

// ─────────────────────────────────────────────
// Search profiles by full name
// Scoped to service center for non-developers
// ─────────────────────────────────────────────
export const searchProfiles = async (query, centerId = null) => {
  let req = supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      role,
      service_center_id,
      service_centers ( id, name )
    `)
    .ilike('full_name', `%${query}%`)
    .order('full_name')
    .limit(20)

  if (centerId) req = req.eq('service_center_id', centerId)

  const { data, error } = await req
  if (error) throw error
  return data
}

// ─────────────────────────────────────────────
// Search service centers by name
// Only for developer role
// ─────────────────────────────────────────────
export const searchCenters = async (query) => {
  const { data, error } = await supabase
    .from('service_centers')
    .select('id, name, logo_url, created_at')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(10)

  if (error) throw error
  return data
}
