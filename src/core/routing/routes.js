// Centralized route paths — import from here, never hardcode strings
export const ROUTES = {
  // Public
  LOGIN: '/login',

  // Developer
  DEVELOPER_DASHBOARD: '/developer',
  DEVELOPER_CENTERS:   '/developer/centers',
  DEVELOPER_USERS:     '/developer/users',

  // Admin
  ADMIN_DASHBOARD:  '/admin',
  ADMIN_EMPLOYEES:  '/admin/employees',
  ADMIN_CLIENTS:    '/admin/clients',
  ADMIN_INVOICES:   '/admin/invoices',
  ADMIN_CENTERS:    '/admin/centers',

  // Employee
  EMPLOYEE_DASHBOARD: '/employee',
  EMPLOYEE_INVOICES:  '/employee/invoices',
  EMPLOYEE_CLIENTS:   '/employee/clients',

  // Client
  CLIENT_DASHBOARD: '/client',
  CLIENT_INVOICES:  '/client/invoices',

  // Shared
  INVOICE_NEW:    '/invoices/new',
  INVOICE_VIEW:   (id) => `/invoices/${id}`,
  CHANGE_PASSWORD: '/change-password',
  SEARCH:          '/search',
  INVENTORY:       '/inventory',
  UNAUTHORIZED:    '/unauthorized',
  NOT_FOUND:       '*',
}

// Role identifiers — must match profiles.role in Supabase
export const ROLES = {
  DEVELOPER: 'developer',
  ADMIN:     'admin',
  EMPLOYEE:  'employee',
  INVENTORY_MANAGER: 'inventory_manager',
  CLIENT:    'client',
}

// Default redirect after login per role
export const ROLE_HOME = {
  [ROLES.DEVELOPER]: ROUTES.DEVELOPER_DASHBOARD,
  [ROLES.ADMIN]:     ROUTES.ADMIN_DASHBOARD,
  [ROLES.EMPLOYEE]:  ROUTES.EMPLOYEE_DASHBOARD,
  [ROLES.INVENTORY_MANAGER]: ROUTES.INVENTORY,
  [ROLES.CLIENT]:    ROUTES.CLIENT_DASHBOARD,
}
