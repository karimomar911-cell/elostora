import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

/**
 * A generic hook for common Supabase database operations.
 */
export const useDatabase = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (queryFn, {
    successMessage = null,
    errorMessage = 'An error occurred while fetching data.',
    showToast = true
  } = {}) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: queryError } = await queryFn(supabase)
      if (queryError) throw queryError
      
      if (successMessage && showToast) {
        toast.success(successMessage)
      }
      return data
    } catch (err) {
      const msg = err.message || errorMessage
      setError(msg)
      if (showToast) {
        toast.error(msg)
      }
      console.error('Database Error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, execute }
}

export default useDatabase
