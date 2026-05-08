import { supabase } from '../lib/supabaseClient'

// ── Upsert a car (register or transfer ownership) ──
export const upsertCar = async ({ chassis_number, plate_number, client_id, car_model }) => {
  // We use upsert on the unique 'chassis_number' column.
  // If chassis_number exists, it updates the record (transferring client_id and updating plate_number).
  // If not, it inserts a new record.
  const { data, error } = await supabase
    .from('cars')
    .upsert(
      { chassis_number, plate_number, client_id, car_model },
      { onConflict: 'chassis_number' }
    )
    .select()

  if (error) throw error
  return data?.[0]
}

// ── Fetch cars for a client ──
export const fetchCarsByClient = async (clientId) => {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('client_id', clientId)

  if (error) throw error
  return data || []
}

// ── Fetch all cars ──
export const fetchAllCars = async () => {
  const { data, error } = await supabase
    .from('cars')
    .select('*, profiles(full_name)')
  
  if (error) throw error
  return data || []
}
// ── Delete cars for a client ──
export const deleteCarsByClient = async (clientId) => {
  const { error } = await supabase
    .from('cars')
    .delete()
    .eq('client_id', clientId)
  
  if (error) throw error
}
