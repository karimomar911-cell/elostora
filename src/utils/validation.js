/**
 * Validation Schemas for Database Operations
 * Uses a simple validation system (can be upgraded to Zod later)
 * Ensures data integrity before sending to database
 */

// Helper function to validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Helper function to validate phone number (basic)
export const isValidPhone = (phone) => {
  if (!phone) return true // Phone is optional
  const phoneRegex = /^[\d\s\-+()]{7,}$/ // At least 7 digits
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Helper function for string validation
export const isValidString = (str, minLength = 1, maxLength = 255) => {
  if (typeof str !== 'string') return false
  return str.length >= minLength && str.length <= maxLength
}

// Helper function for number validation
export const isValidNumber = (num, min = 0, max = Infinity) => {
  if (typeof num !== 'number') return false
  return num >= min && num <= max
}

// Helper function for UUID validation
export const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Validation error class
export class ValidationError extends Error {
  constructor(message, errors = {}) {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors
  }
}

// ────────────────────────────────────────────
// AUTH VALIDATION
// ────────────────────────────────────────────

export const validateSignUp = (email, password) => {
  const errors = {}

  if (!email || !isValidEmail(email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors)
  }

  return { email, password }
}

export const validateLogin = (email, password) => {
  return validateSignUp(email, password)
}

export const validatePasswordChange = (newPassword) => {
  const errors = {}

  if (!newPassword || newPassword.length < 6) {
    errors.newPassword = 'Password must be at least 6 characters'
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors)
  }

  return { newPassword }
}

// ────────────────────────────────────────────
// USER/PROFILE VALIDATION
// ────────────────────────────────────────────

export const validateProfile = (data) => {
  const errors = {}

  // full_name
  if (!data.full_name || !isValidString(data.full_name, 2, 100)) {
    errors.full_name = 'Full name must be between 2 and 100 characters'
  }

  // phone
  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number'
  }

  // role
  const validRoles = ['developer', 'admin', 'employee', 'client', 'inventory_manager']
  if (data.role && !validRoles.includes(data.role)) {
    errors.role = `Role must be one of: ${validRoles.join(', ')}`
  }

  // service_center_id
  if (data.service_center_id && !isValidUUID(data.service_center_id)) {
    errors.service_center_id = 'Invalid service center ID'
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Profile validation failed', errors)
  }

  return data
}

export const validateUserCreation = (data) => {
  const errors = {}

  // email
  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  // password
  if (!data.password || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }

  // full_name
  if (!data.full_name || !isValidString(data.full_name, 2, 100)) {
    errors.full_name = 'Full name must be between 2 and 100 characters'
  }

  // phone
  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number'
  }

  // role
  const validRoles = ['developer', 'admin', 'employee', 'client', 'inventory_manager']
  if (!data.role || !validRoles.includes(data.role)) {
    errors.role = `Role must be one of: ${validRoles.join(', ')}`
  }

  // service_center_id
  if (!data.service_center_id || !isValidUUID(data.service_center_id)) {
    errors.service_center_id = 'Invalid service center ID'
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('User creation validation failed', errors)
  }

  // Sanitize input
  return {
    email: data.email.trim().toLowerCase(),
    password: data.password,
    full_name: data.full_name.trim(),
    phone: (data.phone || '').trim(),
    role: data.role,
    service_center_id: data.service_center_id,
  }
}

// ────────────────────────────────────────────
// INVOICE VALIDATION
// ────────────────────────────────────────────

export const validateInvoice = (data) => {
  const errors = {}

  // client_id
  if (!data.client_id || !isValidUUID(data.client_id)) {
    errors.client_id = 'Invalid client selection'
  }

  // service_price
  if (!isValidNumber(parseFloat(data.service_price || 0), 0, 999999)) {
    errors.service_price = 'Service price must be a positive number'
  }

  // discount
  const discount = parseFloat(data.discount || 0)
  if (!isValidNumber(discount, 0, 100)) {
    errors.discount = 'Discount must be between 0 and 100'
  }

  // spare_parts (array validation)
  if (Array.isArray(data.spare_parts)) {
    data.spare_parts.forEach((part, index) => {
      if (!isValidNumber(part.quantity || 0, 1, 1000)) {
        errors[`spare_parts[${index}].quantity`] = 'Quantity must be between 1 and 1000'
      }
      if (!isValidNumber(parseFloat(part.price || 0), 0, 999999)) {
        errors[`spare_parts[${index}].price`] = 'Price must be a positive number'
      }
    })
  }

  // service_date
  if (data.service_date && isNaN(new Date(data.service_date).getTime())) {
    errors.service_date = 'Invalid service date'
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Invoice validation failed', errors)
  }

  return {
    ...data,
    service_price: parseFloat(data.service_price || 0),
    discount: parseFloat(data.discount || 0),
  }
}

// ────────────────────────────────────────────
// INVENTORY VALIDATION
// ────────────────────────────────────────────

export const validateInventoryItem = (data) => {
  const errors = {}

  // name
  if (!data.name || !isValidString(data.name, 1, 100)) {
    errors.name = 'Item name is required and must be less than 100 characters'
  }

  // quantity
  if (!isValidNumber(parseInt(data.quantity || 0), 0, 999999)) {
    errors.quantity = 'Quantity must be a positive number'
  }

  // unit_price
  if (!isValidNumber(parseFloat(data.unit_price || 0), 0, 999999)) {
    errors.unit_price = 'Unit price must be a positive number'
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Inventory validation failed', errors)
  }

  return {
    ...data,
    quantity: parseInt(data.quantity),
    unit_price: parseFloat(data.unit_price),
  }
}

// ────────────────────────────────────────────
// SERVICE CENTER VALIDATION
// ────────────────────────────────────────────

export const validateServiceCenter = (data) => {
  const errors = {}

  // name
  if (!data.name || !isValidString(data.name, 2, 100)) {
    errors.name = 'Center name must be between 2 and 100 characters'
  }

  // address
  if (data.address && !isValidString(data.address, 5, 255)) {
    errors.address = 'Address must be between 5 and 255 characters'
  }

  // phone
  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number'
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Service center validation failed', errors)
  }

  return {
    ...data,
    name: data.name.trim(),
    phone: (data.phone || '').trim(),
  }
}

// ────────────────────────────────────────────
// GENERAL UTILITY
// ────────────────────────────────────────────

/**
 * Sanitize string input to prevent XSS
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return ''
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 255) // Limit length
}

/**
 * Validate and sanitize user input
 */
export const validateAndSanitize = (data, schema) => {
  const sanitized = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}