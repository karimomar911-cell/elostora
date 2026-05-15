import { supabase } from '../core/api/supabaseClient'

const INVOICE_SELECT = `
  id,
  service_center_id,
  client_id,
  created_by,
  client_name,
  car_model,
  service_date,
  handover_date,
  services_performed,
  spare_parts,
  service_price,
  total_price,
  discount,
  final_price,
  service_centers ( id, name ),
  profiles!invoices_created_by_fkey ( id, full_name )
`

// ── Fetch all invoices ──
export const fetchAllInvoices = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select(INVOICE_SELECT)
    .order('service_date', { ascending: false })
  if (error) throw error
  return data
}

// ── Fetch invoices by service center ──
export const fetchInvoicesByCenter = async (centerId) => {
  const { data, error } = await supabase
    .from('invoices')
    .select(INVOICE_SELECT)
    .eq('service_center_id', centerId)
    .order('service_date', { ascending: false })
  if (error) throw error
  return data
}

// ── Fetch invoices by client (via Chassis ownership) ──
export const fetchInvoicesByClient = async (clientId) => {
  // First, get all cars owned by this client
  const { data: cars, error: carError } = await supabase
    .from('cars')
    .select('chassis_number')
    .eq('client_id', clientId)

  if (carError) throw carError

  const chassisList = cars?.map(c => c.chassis_number) || []

  // Fetch invoices where client_id matches (legacy) OR chassis_number is in the list
  let query = supabase
    .from('invoices')
    .select(INVOICE_SELECT)
    .order('service_date', { ascending: false })

  if (chassisList.length > 0) {
    query = query.or(`client_id.eq.${clientId},chassis_number.in.(${chassisList.join(',')})`)
  } else {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// ── Fetch single invoice ──
export const fetchInvoice = async (id) => {
  const { data, error } = await supabase
    .from('invoices')
    .select(INVOICE_SELECT)
    .eq('id', id)
  if (error) throw error
  return data?.[0]
}

// ── Create invoice ──
export const createInvoice = async (payload) => {
  const { data, error } = await supabase
    .from('invoices')
    .insert([payload])
    .select()
  if (error) throw error
  return data?.[0]
}

// ── Update invoice ──
export const updateInvoice = async (id, payload) => {
  const { data, error } = await supabase
    .from('invoices')
    .update(payload)
    .eq('id', id)
    .select()
  if (error) throw error
  return data?.[0]
}

// ── Delete invoice ──
export const deleteInvoice = async (id) => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Count invoices ──
export const countInvoices = async () => {
  const { count, error } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

// ── Sum totals ──
export const sumInvoiceTotals = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select('final_price')
  if (error) throw error
  return data.reduce((sum, row) => sum + (parseFloat(row.final_price) || 0), 0)
}

// ── Fetch revenue trend ──
export const fetchRevenueTrend = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select('service_date, final_price')
    .order('service_date', { ascending: true })
  
  if (error) throw error
  
  const trend = data.reduce((acc, row) => {
    const date = new Date(row.service_date)
    if (isNaN(date.getTime())) return acc
    const month = date.toLocaleString('default', { month: 'short' })
    const value = parseFloat(row.final_price) || 0
    
    if (!acc[month]) acc[month] = { name: month, revenue: 0 }
    acc[month].revenue += value
    return acc
  }, {})
  
  return Object.values(trend)
}
