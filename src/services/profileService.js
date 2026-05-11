import { supabase } from '../core/api/supabaseClient'
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

// ── Delete a profile with cleanup (transferring data to "Deleted" status) ──
export const deleteProfileWithCleanup = async (id) => {
  // 1. Update Invoices (Nullify ID, preserve name with marker)
  const { error: invError } = await supabase
    .from('invoices')
    .update({ 
      client_id: null,
      created_by: null // If they were the operator
    })
    .or(`client_id.eq.${id},created_by.eq.${id}`)

  if (invError) {
    console.error('Failed to unlink invoices:', invError)
    throw new Error('Failed to preserve invoice records during deletion.')
  }

  // 2. Update Cars (Nullify client ID)
  const { error: carError } = await supabase
    .from('cars')
    .update({ client_id: null })
    .eq('client_id', id)

  if (carError) {
    console.error('Failed to unlink cars:', carError)
    throw new Error('Failed to preserve car records during deletion.')
  }

  // 3. Update Inventory Logs (Nullify performer)
  const { error: logError } = await supabase
    .from('inventory_logs')
    .update({ performed_by: null })
    .eq('performed_by', id)

  if (logError) {
    console.error('Failed to unlink logs:', logError)
  }

  // 4. Finally delete the profile
  const { error: profError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  if (profError) throw profError
  return true
}
