import { supabase } from '../core/api/supabaseClient'

export const factoryResetSystem = async (currentDevId) => {
  try {
    // Helper function to throw if there's an error
    const checkError = (res, tableName) => {
      if (res.error) {
        console.error(`Error deleting from ${tableName}:`, res.error);
        throw new Error(`Failed to clear ${tableName}: ${res.error.message}`);
      }
    }

    // 1. Delete Cars, Logs and Invoices first (Foreign Key dependencies)
    checkError(await supabase.from('cars').delete().neq('id', '00000000-0000-0000-0000-000000000000'), 'cars')
    checkError(await supabase.from('inventory_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'), 'inventory_logs')
    checkError(await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000'), 'invoices')
    
    // 2. Delete Inventory
    checkError(await supabase.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000'), 'inventory')

    // 3. Delete Profiles (Except Current Developer)
    if (currentDevId) {
      checkError(await supabase.from('profiles').delete().neq('id', currentDevId), 'profiles')
    } else {
      checkError(await supabase.from('profiles').delete().neq('role', 'developer'), 'profiles')
    }

    // 4. Delete Service Centers
    checkError(await supabase.from('service_centers').delete().neq('id', '00000000-0000-0000-0000-000000000000'), 'service_centers')

    return { success: true }
  } catch (err) {
    console.error('Factory Reset Failed:', err)
    throw err
  }
}
