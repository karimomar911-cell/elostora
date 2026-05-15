import { ROUTES, ROLES } from '../../core/routing/routes'
import {
  Home,
  Users,
  Building,
  FileText,
  Package,
  Search,
  Lock,
  User,
  ChevronRight,
  LogOut,
  Menu,
  X
} from 'lucide-react'

export const HomeIcon = Home
export const UsersIcon = Users
export const BuildingIcon = Building
export const InvoiceIcon = FileText
export const BoxIcon = Package
export const SearchIcon = Search
export const LockIcon = Lock
export const UserIcon = User
export const ChevronIcon = ChevronRight
export const LogoutIcon = LogOut
export const MenuIcon = Menu
export const CloseIcon = X

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
