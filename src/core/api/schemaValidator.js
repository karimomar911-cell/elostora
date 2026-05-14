import { supabase } from './supabaseClient'
import toast from 'react-hot-toast'

/**
 * schemaValidator.js
 * 
 * Performs a lightweight startup check to verify that the database schema
 * matches the application requirements. This prevents silent crashes and
 * provides clear diagnostic feedback to the developer/admin.
 */

export const validateSchema = async () => {
  console.log('[SchemaValidator] Running startup validation...')
  
  try {
    // 1. Check for 'is_deleted' column on profiles
    // We do a small query that will fail if the column is missing
    const { error: columnError } = await supabase
      .from('profiles')
      .select('is_deleted')
      .limit(1)

    if (columnError) {
      if (columnError.code === '42703') {
        const msg = 'CRITICAL: Database schema mismatch. "profiles.is_deleted" column is missing.'
        console.error(`[SchemaValidator] ${msg}`)
        toast.error(msg, { duration: 10000 })
        return { valid: false, error: 'missing_soft_delete' }
      }
      // Other errors might be connection issues, not schema drift
    }

    // 2. Check for audit logs table
    const { error: tableError } = await supabase
      .from('deletion_audit_logs')
      .select('id')
      .limit(1)

    if (tableError) {
      if (tableError.code === '42P01') {
        const msg = 'WARNING: "deletion_audit_logs" table is missing. Audit functionality will be disabled.'
        console.warn(`[SchemaValidator] ${msg}`)
        toast.error(msg, { duration: 8000 })
        // Non-fatal, but good to know
      }
    }

    console.log('[SchemaValidator] Validation passed or handled gracefully.')
    return { valid: true }
  } catch (err) {
    console.error('[SchemaValidator] Unexpected error during validation:', err)
    return { valid: true } // Don't block app on validator failure itself
  }
}
