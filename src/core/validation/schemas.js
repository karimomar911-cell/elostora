import { z } from 'zod'

// ─── Reusable field schemas ────────────────────────────────────────────────────
const phone = z
  .string()
  .min(7, 'Phone number must be at least 7 digits')
  .max(20, 'Phone number is too long')
  .regex(/^[+\d\s\-()]+$/, 'Invalid phone number format')

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long') // bcrypt limit

// ─── Auth schemas ──────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: password,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must differ from current password',
    path: ['newPassword'],
  })

// ─── Employee / User schemas ───────────────────────────────────────────────────
export const employeeSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: phone.optional().or(z.literal('')),
  role: z.enum(['admin', 'employee', 'inventory_manager', 'client'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
  service_center_id: z.string().uuid('Please select a service center').nullable().optional(),
  password: password.optional().or(z.literal('')),
})

// ─── Inventory schemas ───────────────────────────────────────────────────────
export const inventorySchema = z.object({
  name: z.string().min(2, 'Item name is required'),
  sku: z.string().max(50).optional().or(z.literal('')),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative'),
  unit_price: z.coerce.number().min(0, 'Price cannot be negative'),
  condition: z.enum(['new', 'used']).default('new'),
  location: z.string().max(100).optional().or(z.literal('')),
  service_center_id: z.string().uuid().nullable().optional(),
})

// ─── Client schemas ────────────────────────────────────────────────────────────
export const clientSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: phone,
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  password: password.optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  chassis_number: z.string().min(3, 'Chassis number is required').optional().or(z.literal('')),
  plate_number: z.string().optional().or(z.literal('')),
  car_model: z.string().optional().or(z.literal('')),
})

// ─── Service Center schemas ────────────────────────────────────────────────────
export const serviceCenterSchema = z.object({
  name: z.string().min(2, 'Center name must be at least 2 characters').max(100),
  address: z.string().max(200).optional().or(z.literal('')),
  phone: phone.optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
})

// ─── Invoice schemas ───────────────────────────────────────────────────────────
export const invoiceItemSchema = z.object({
  name: z.string().min(1, 'Part name is required'),
  quantity: z.coerce.number().int().positive('Quantity must be positive'),
  unit_price: z.coerce.number().min(0, 'Price cannot be negative'),
  inventory_id: z.string().uuid().nullable().optional(),
})

export const invoiceSchema = z.object({
  client_id: z.string().uuid().nullable().optional().or(z.literal('')),
  client_name: z.string().min(2, 'Client name is required'),
  chassis_number: z.string().min(3, 'Chassis number is required'),
  car_model: z.string().min(1, 'Vehicle model is required'),
  service_date: z.string().min(1, 'Service date is required'),
  handover_date: z.string().optional().or(z.literal('')),
  services_performed: z.string().min(5, 'Please provide details of services performed'),
  service_price: z.coerce.number().min(0, 'Labor price cannot be negative'),
  discount: z.coerce.number().min(0).default(0),
  spare_parts: z.array(invoiceItemSchema).optional().default([]),
})
