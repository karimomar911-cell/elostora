import { supabase } from '../core/api/supabaseClient'

export const fetchInventoryLogs = async () => {
  const { data, error } = await supabase
    .from('inventory_logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const logInventoryAction = async ({
  itemId,
  itemName,
  type,
  quantity,
  profile,
  centerId,
  centerName,
  referenceId
}) => {
  const { error } = await supabase
    .from('inventory_logs')
    .insert([{
      item_id: itemId,
      item_name: itemName,
      type: type,
      quantity: quantity,
      performed_by: profile.id,
      performer_name: profile.full_name,
      service_center_id: centerId,
      center_name: centerName,
      reference_id: referenceId
    }])

  if (error) {
    console.error('Logging failed:', error)
  }
}
