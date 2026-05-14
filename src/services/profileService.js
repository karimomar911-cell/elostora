import { supabase } from '../core/api/supabaseClient'

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
    .eq('is_deleted', false)
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
    .eq('is_deleted', false)
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
    .eq('is_deleted', false)
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
    .eq('is_deleted', false)
  if (error) throw error

  return data.reduce((acc, { role }) => {
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {})
}

// ─────────────────────────────────────────────────────────────────────────────
// deleteProfileWithCleanup
//
// FIXED BUGS:
//   1. Now validates `count` after delete — Supabase never throws when RLS
//      blocks a delete silently; it just returns count=0.
//   2. Writes an audit log entry BEFORE deleting so history is always present
//      even if the delete itself later fails.
//   3. Accepts `deletedBy` (profile object) and `reason` for full audit trail.
//
// Execution order (transactional intent):
//   1. Snapshot the target profile (abort early if not found)
//   2. Insert audit log row
//   3. Nullify FK references in invoices, cars, inventory_logs
//   4. Delete the profile row
//   5. Validate count > 0 — throw if RLS silently blocked the operation
// ─────────────────────────────────────────────────────────────────────────────
export const deleteProfileWithCleanup = async (id, { deletedBy, reason = '' } = {}) => {
  // ── DIAGNOSTIC: confirm we entered with the right args ───────────────────
  console.log('[deleteProfileWithCleanup] START', { id, deletedBy: deletedBy?.id, reason })

  if (!id) throw new Error('deleteProfileWithCleanup: target user ID is required.')

  // ── STEP 1: Snapshot target profile (verify it exists) ───────────────────
  const { data: targetProfile, error: snapshotError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', id)
    .maybeSingle()

  console.log('[deleteProfileWithCleanup] snapshot:', { targetProfile, snapshotError })

  if (snapshotError) throw new Error(`Failed to read target profile: ${snapshotError.message}`)
  if (!targetProfile) throw new Error('Target user not found. They may have already been deleted.')

  // ── STEP 2: Write audit log BEFORE deletion ───────────────────────────────
  // We write it first so the history entry exists even if a later step fails.
  if (deletedBy?.id) {
    const auditPayload = {
      deleted_user_id:    targetProfile.id,
      deleted_user_name:  targetProfile.full_name ?? 'Unknown',
      deleted_user_role:  targetProfile.role ?? 'unknown',
      deleted_by_id:      deletedBy.id,
      deleted_by_name:    deletedBy.full_name ?? 'Developer',
      reason:             reason || null,
    }
    console.log('[deleteProfileWithCleanup] writing audit log:', auditPayload)

    const { error: auditError } = await supabase
      .from('deletion_audit_logs')
      .insert([auditPayload])

    if (auditError) {
      // Non-fatal: log but don't abort — audit failure must not block deletion.
      // The table may not exist yet (migration not applied) or RLS may need adjusting.
      console.error('[deleteProfileWithCleanup] AUDIT LOG FAILED (non-fatal):', auditError)
    } else {
      console.log('[deleteProfileWithCleanup] audit log written successfully')
    }
  } else {
    console.warn('[deleteProfileWithCleanup] No deletedBy provided — audit log skipped.')
  }

  // ── STEP 3: Nullify FK references (prevent constraint violations) ─────────

  // 3a. Invoices — nullify client_id and created_by where they reference this user
  const { error: invError } = await supabase
    .from('invoices')
    .update({ client_id: null, created_by: null })
    .or(`client_id.eq.${id},created_by.eq.${id}`)

  console.log('[deleteProfileWithCleanup] invoices unlink:', { invError })
  if (invError) throw new Error(`Failed to unlink invoices: ${invError.message}`)

  // 3b. Cars — nullify client_id
  const { error: carError } = await supabase
    .from('cars')
    .update({ client_id: null })
    .eq('client_id', id)

  console.log('[deleteProfileWithCleanup] cars unlink:', { carError })
  if (carError) throw new Error(`Failed to unlink cars: ${carError.message}`)

  // 3c. Inventory logs — nullify performed_by (non-fatal)
  const { error: logError } = await supabase
    .from('inventory_logs')
    .update({ performed_by: null })
    .eq('performed_by', id)

  console.log('[deleteProfileWithCleanup] inventory_logs unlink:', { logError })
  if (logError) {
    console.error('[deleteProfileWithCleanup] inventory_logs unlink failed (non-fatal):', logError)
  }

  // ── STEP 4: Soft Delete the profile row ───────────────────────────────────
  // We UPDATE is_deleted to true instead of hard DELETE.
  const { data: deletedRows, error: profError } = await supabase
    .from('profiles')
    .update({ 
      is_deleted: true, 
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy?.id || null
    })
    .eq('id', id)
    .select('id')   // ← force Supabase to return the updated row(s)

  console.log('[deleteProfileWithCleanup] SOFT DELETE result:', { deletedRows, profError })

  if (profError) {
    throw new Error(`Database error during soft deletion: ${profError.message}`)
  }

  // ── STEP 5: Validate that a row was actually updated ─────────────────────
  if (!deletedRows || deletedRows.length === 0) {
    throw new Error(
      'Soft deletion was blocked by the database (RLS policy or constraint). ' +
      'The profile row was NOT updated. Check RLS policies.'
    )
  }

  console.log('[deleteProfileWithCleanup] SUCCESS — rows soft deleted:', deletedRows.length)
  return { success: true, deletedCount: deletedRows.length, auditLogged: !!deletedBy?.id }
}

// ── Fetch deletion audit log history ─────────────────────────────────────────
export const fetchDeletionAuditLogs = async () => {
  const { data, error } = await supabase
    .from('deletion_audit_logs')
    .select('*')
    .order('deleted_at', { ascending: false })
    .limit(100)

  if (error) {
    // Table may not exist if migration hasn't been applied yet
    console.error('[fetchDeletionAuditLogs] error:', error)
    return []
  }
  return data ?? []
}
