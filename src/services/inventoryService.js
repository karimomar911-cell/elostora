import { supabase } from '../core/api/supabaseClient'
import { logInventoryAction } from './inventoryLogService'

export const fetchInventory = async () => {
  // Now global - all branches share the same inventory
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export const addInventoryItem = async (item, profile) => {
  const { data, error } = await supabase
    .from('inventory')
    .insert([item])
    .select()

  if (error) throw error
  
  if (data?.[0]) {
    let centerName = 'Main Warehouse'
    if (profile.service_center_id) {
      const { data: center } = await supabase
        .from('service_centers')
        .select('name')
        .eq('id', profile.service_center_id)
        .single()
      if (center) centerName = center.name
    }

    await logInventoryAction({
      itemId: data[0].id,
      itemName: data[0].name,
      type: 'received',
      quantity: data[0].quantity,
      profile: profile,
      centerId: profile.service_center_id,
      centerName: centerName,
      referenceId: 'Manual Add'
    })
  }
  return data?.[0]
}

export const updateInventoryItem = async (id, updates, profile) => {
  const { data, error } = await supabase
    .from('inventory')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) throw error
  return data?.[0]
}

export const deleteInventoryItem = async (id) => {
  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}

export const bulkAddInventoryItems = async (items, profile) => {
  const { data, error } = await supabase
    .from('inventory')
    .insert(items)
    .select()

  if (error) throw error

  if (data) {
    let centerName = 'Main Warehouse'
    if (profile.service_center_id) {
      const { data: center } = await supabase
        .from('service_centers')
        .select('name')
        .eq('id', profile.service_center_id)
        .single()
      if (center) centerName = center.name
    }

    for (const item of data) {
      await logInventoryAction({
        itemId: item.id,
        itemName: item.name,
        type: 'received',
        quantity: item.quantity,
        profile: profile,
        centerId: profile.service_center_id,
        centerName: centerName,
        referenceId: 'Bulk Import'
      })
    }
  }
  return data
}

export const deductInventoryStock = async (itemId, quantityToDeduct, profile, referenceId) => {
  // First get current stock and name
  const { data: item, error: fetchError } = await supabase
    .from('inventory')
    .select('name, quantity')
    .eq('id', itemId)
    .single()

  if (fetchError) throw fetchError

  const newQuantity = Math.max(0, (item.quantity || 0) - quantityToDeduct)

  const { error: updateError } = await supabase
    .from('inventory')
    .update({ quantity: newQuantity })
    .eq('id', itemId)

  if (updateError) throw updateError

  // Log the deduction (Issued)
  let centerName = 'Main Warehouse'
  if (profile.service_center_id) {
    const { data: center } = await supabase
      .from('service_centers')
      .select('name')
      .eq('id', profile.service_center_id)
      .single()
    if (center) centerName = center.name
  }

  await logInventoryAction({
    itemId: itemId,
    itemName: item.name,
    type: 'issued',
    quantity: quantityToDeduct,
    profile: profile,
    centerId: profile.service_center_id,
    centerName: centerName,
    referenceId: referenceId || 'Invoice'
  })
}
