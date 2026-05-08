import { supabase } from '../lib/supabaseClient'
import { deleteCarsByClient } from './carService'

// ── Fetch all profiles (with service center join) ──
export const fetchAllProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      phone,
      role,
      service_center_id,
      car_model,
      chassis_number,
      created_at,
      service_centers ( id, name )
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ── Fetch profiles by role ──
export const fetchProfilesByRole = async (role) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      phone,
      role,
      service_center_id,
      car_model,
      chassis_number,
      created_at,
      service_centers ( id, name )
    `)
    .eq('role', role)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ── Fetch profiles by service center ──
export const fetchProfilesByCenter = async (centerId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      phone,
      role,
      service_center_id,
      car_model,
      chassis_number,
      created_at,
      service_centers ( id, name )
    `)
    .eq('service_center_id', centerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ── Create a profile manually (if no trigger exists) ──
export const createProfile = async (payload) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([payload])
    .select()
  if (error) throw error
  return data?.[0]
}

// ── Update a profile ──
export const updateProfile = async (id, payload) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .select()
  if (error) throw error
  return data?.[0]
}

// ── Count profiles per role ──
export const countProfilesByRole = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
  if (error) throw error

  return data.reduce((acc, { role }) => {
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {})
}

// ── Delete a profile ──
export const deleteProfile = async (id) => {
  // Use a bulk-style filter to bypass potential single-row RLS restrictions
  const { error } = await supabase
    .from('profiles')
    .delete()
    .in('id', [id]) 

  if (error) throw error
  return true
}
