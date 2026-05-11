import { supabase } from '../lib/supabaseClient'

// ── Fetch all service centers ──
export const fetchServiceCenters = async () => {
  const { data, error } = await supabase
    .from('service_centers')
    .select('id, name, logo_url, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ── Check if service center name already exists ──
export const checkCenterNameExists = async (name, excludeId = null) => {
  let query = supabase
    .from('service_centers')
    .select('id, name')
    .ilike('name', name)
  
  if (excludeId) {
    query = query.neq('id', excludeId)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data && data.length > 0
}

// ── Fetch single service center ──
export const fetchServiceCenter = async (id) => {
  const { data, error } = await supabase
    .from('service_centers')
    .select('id, name, logo_url, created_at')
    .eq('id', id)
  if (error) throw error
  return data?.[0]
}

// ── Create service center ──
export const createServiceCenter = async (payload) => {
  // Check for duplicate center name
  const nameExists = await checkCenterNameExists(payload.name)
  if (nameExists) {
    throw new Error(`مركز الخدمة باسم "${payload.name}" موجود بالفعل. الرجاء اختيار اسم مختلف.`)
  }
  
  const { data, error } = await supabase
    .from('service_centers')
    .insert([payload])
    .select()
  if (error) throw error
  if (!data || data.length === 0) throw new Error('Failed to create service center.')
  return data[0]
}

// ── Update service center ──
export const updateServiceCenter = async (id, payload) => {
  // If updating name, check for duplicates (excluding current center)
  if (payload.name) {
    const nameExists = await checkCenterNameExists(payload.name, id)
    if (nameExists) {
      throw new Error(`مركز الخدمة باسم "${payload.name}" موجود بالفعل. الرجاء اختيار اسم مختلف.`)
    }
  }
  
  const { data, error } = await supabase
    .from('service_centers')
    .update(payload)
    .eq('id', id)
    .select()
  if (error) throw error
  if (!data || data.length === 0) throw new Error('No rows updated. Check your permissions.')
  return data[0]
}

// ── Delete service center ──
export const deleteServiceCenter = async (id) => {
  const { error } = await supabase
    .from('service_centers')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Upload logo to Supabase Storage ──
export const uploadLogo = async (file, centerId) => {
  const ext      = file.name.split('.').pop()
  const filePath = `${centerId}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('logos')
    .getPublicUrl(filePath)

  return data.publicUrl
}
