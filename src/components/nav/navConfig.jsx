import { ROUTES, ROLES } from '../../core/routing/routes'

// Icons are inline SVG components for zero dependencies

export const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

export const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

export const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

export const InvoiceIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

export const BoxIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

export const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

export const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

export const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

export const ChevronIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

export const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

export const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

export const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// ─────────────────────────────────────────────
// Navigation items per role
// ─────────────────────────────────────────────
export const NAV_ITEMS = {
  [ROLES.DEVELOPER]: [
    {
      label: 'Dashboard',
      path: ROUTES.DEVELOPER_DASHBOARD,
      icon: HomeIcon,
    },
    {
      label: 'Service Centers',
      path: ROUTES.DEVELOPER_CENTERS,
      icon: BuildingIcon,
    },
    {
      label: 'Users',
      path: ROUTES.DEVELOPER_USERS,
      icon: UsersIcon,
    },
    {
      label: 'Invoices',
      path: ROUTES.ADMIN_INVOICES,
      icon: InvoiceIcon,
    },
    {
      label: 'Inventory',
      path: ROUTES.INVENTORY,
      icon: BoxIcon,
    },
    {
      label: 'Search',
      path: ROUTES.SEARCH,
      icon: SearchIcon,
    },
  ],

  [ROLES.ADMIN]: [
    {
      label: 'Dashboard',
      path: ROUTES.ADMIN_DASHBOARD,
      icon: HomeIcon,
    },
    {
      label: 'Employees',
      path: ROUTES.ADMIN_EMPLOYEES,
      icon: UsersIcon,
    },
    {
      label: 'Clients',
      path: ROUTES.ADMIN_CLIENTS,
      icon: UserIcon,
    },
    {
      label: 'Invoices',
      path: ROUTES.ADMIN_INVOICES,
      icon: InvoiceIcon,
    },
    {
      label: 'Service Centers',
      path: ROUTES.ADMIN_CENTERS,
      icon: BuildingIcon,
    },
    {
      label: 'Inventory',
      path: ROUTES.INVENTORY,
      icon: BoxIcon,
    },
    {
      label: 'Search',
      path: ROUTES.SEARCH,
      icon: SearchIcon,
    },
  ],

  [ROLES.INVENTORY_MANAGER]: [
    {
      label: 'Inventory',
      path: ROUTES.INVENTORY,
      icon: BoxIcon,
    },
    {
      label: 'Search',
      path: ROUTES.SEARCH,
      icon: SearchIcon,
    },
  ],

  [ROLES.EMPLOYEE]: [
    {
      label: 'Dashboard',
      path: ROUTES.EMPLOYEE_DASHBOARD,
      icon: HomeIcon,
    },
    {
      label: 'Invoices',
      path: ROUTES.EMPLOYEE_INVOICES,
      icon: InvoiceIcon,
    },
    {
      label: 'Clients',
      path: ROUTES.EMPLOYEE_CLIENTS,
      icon: UserIcon,
    },
    {
      label: 'Search',
      path: ROUTES.SEARCH,
      icon: SearchIcon,
    },
  ],

  [ROLES.CLIENT]: [
    {
      label: 'Dashboard',
      path: ROUTES.CLIENT_DASHBOARD,
      icon: HomeIcon,
    },
    {
      label: 'My Invoices',
      path: ROUTES.CLIENT_INVOICES,
      icon: InvoiceIcon,
    },
  ],
}

// Bottom nav items (same for all roles)
export const BOTTOM_NAV_ITEMS = [
  {
    label: 'Change Password',
    path: ROUTES.CHANGE_PASSWORD,
    icon: LockIcon,
  },
]
