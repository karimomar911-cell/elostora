/**
 * Common utility functions for the franchise app
 */

/**
 * Format number as currency
 */
export const formatCurrency = (amount, currency = 'EGP') => {
  const num = parseFloat(amount) || 0
  return `${num.toFixed(2)} ${currency}`
}

/**
 * Format date to readable string
 */
export const formatDate = (dateString, locale = 'en-US') => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString(locale)
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format date and time
 */
export const formatDateTime = (dateString, locale = 'en-US') => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleString(locale)
  } catch {
    return 'Invalid date'
  }
}

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Debounce function for input handlers
 */
export const debounce = (func, wait = 300) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for scroll/resize handlers
 */
export const throttle = (func, limit = 300) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Check if array contains duplicates
 */
export const hasDuplicates = (arr, key = null) => {
  if (key) {
    const values = arr.map(item => item[key])
    return new Set(values).size !== values.length
  }
  return new Set(arr).size !== arr.length
}

/**
 * Sleep/delay function
 */
export const sleep = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Generate random ID
 */
export const generateId = () => Math.random().toString(36).substr(2, 9)

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    return false
  }
}

/**
 * Download file from blob
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert to Title Case
 */
export const toTitleCase = (str) => {
  if (!str) return ''
  return str.split(' ').map(capitalize).join(' ')
}

/**
 * Check if value is empty
 */
export const isEmpty = (value) => {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim().length === 0) ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  )
}

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Group array by property
 */
export const groupBy = (arr, key) => {
  return arr.reduce((groups, item) => {
    const groupKey = item[key]
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {})
}

/**
 * Sort array by property
 */
export const sortBy = (arr, key, order = 'asc') => {
  const sorted = [...arr]
  sorted.sort((a, b) => {
    const valA = a[key]
    const valB = b[key]
    
    if (valA < valB) return order === 'asc' ? -1 : 1
    if (valA > valB) return order === 'asc' ? 1 : -1
    return 0
  })
  return sorted
}

/**
 * Get unique values from array
 */
export const getUnique = (arr, key = null) => {
  if (key) {
    const seen = new Set()
    return arr.filter(item => {
      const value = item[key]
      if (seen.has(value)) return false
      seen.add(value)
      return true
    })
  }
  return [...new Set(arr)]
}

/**
 * Merge arrays of objects by key
 */
export const mergeArrays = (arr1, arr2, mergeKey) => {
  const map = new Map(arr1.map(item => [item[mergeKey], item]))
  
  arr2.forEach(item => {
    const existing = map.get(item[mergeKey])
    if (existing) {
      map.set(item[mergeKey], { ...existing, ...item })
    } else {
      map.set(item[mergeKey], item)
    }
  })
  
  return Array.from(map.values())
}

/**
 * Flatten nested array
 */
export const flatten = (arr) => {
  return arr.reduce((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item) : item)
  }, [])
}

/**
 * Get difference between two arrays
 */
export const difference = (arr1, arr2) => {
  return arr1.filter(item => !arr2.includes(item))
}

/**
 * Check if value is numeric
 */
export const isNumeric = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value)
}

/**
 * Parse query string
 */
export const parseQueryString = () => {
  const params = new URLSearchParams(window.location.search)
  const result = {}
  for (const [key, value] of params) {
    result[key] = value
  }
  return result
}

/**
 * Build query string from object
 */
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, value)
    }
  })
  return searchParams.toString()
}