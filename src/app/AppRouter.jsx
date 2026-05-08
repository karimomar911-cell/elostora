import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES, ROLES, ROLE_HOME } from '../core/routing/routes'
import { PrivateRoute, RoleRoute } from '../core/routing/guards'
import { useAuth } from '../core/auth/AuthProvider'
import AppLayout from '../layouts/AppLayout'
import LoadingSpinner from '../components/LoadingSpinner'

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const LoginPage          = lazy(() => import('../pages/LoginPage'))
const NotFoundPage       = lazy(() => import('../pages/NotFoundPage'))
const UnauthorizedPage   = lazy(() => import('../pages/UnauthorizedPage'))
const SearchPage         = lazy(() => import('../pages/SearchPage'))
const ChangePasswordPage = lazy(() => import('../pages/ChangePasswordPage'))

// Developer
const DeveloperDashboard = lazy(() => import('../pages/developer/DeveloperDashboard'))
const ServiceCentersPage = lazy(() => import('../pages/developer/ServiceCentersPage'))
const UsersPage          = lazy(() => import('../pages/developer/UsersPage'))

// Admin
const AdminDashboard   = lazy(() => import('../pages/admin/AdminDashboard'))
const EmployeesPage    = lazy(() => import('../pages/admin/EmployeesPage'))
const AdminClientsPage = lazy(() => import('../pages/admin/AdminClientsPage'))
const AdminCentersPage = lazy(() => import('../pages/admin/AdminCentersPage'))

// Employee
const EmployeeDashboard   = lazy(() => import('../pages/employee/EmployeeDashboard'))
const EmployeeClientsPage = lazy(() => import('../pages/employee/EmployeeClientsPage'))

// Client
const ClientDashboard    = lazy(() => import('../pages/client/ClientDashboard'))
const ClientInvoicesPage = lazy(() => import('../pages/client/ClientInvoicesPage'))

// Invoices & Inventory
const InvoicesListPage = lazy(() => import('../pages/invoices/InvoicesListPage'))
const InvoiceFormPage  = lazy(() => import('../pages/invoices/InvoiceFormPage'))
const InventoryPage    = lazy(() => import('../pages/invoices/InventoryPage'))

// ─── Page wrapper with layout ─────────────────────────────────────────────────
const L = ({ children }) => <AppLayout>{children}</AppLayout>

// ─── Full-page suspense fallback ──────────────────────────────────────────────
const PageFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner center size="lg" message="Loading page…" />
  </div>
)

// ─── Router ───────────────────────────────────────────────────────────────────
const AppRouter = () => {
  const { isAuthenticated, profile } = useAuth()

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>

        {/* ── Public ── */}
        <Route
          path={ROUTES.LOGIN}
          element={
            isAuthenticated && profile
              ? <Navigate to={ROLE_HOME[profile.role] ?? ROUTES.UNAUTHORIZED} replace />
              : <LoginPage />
          }
        />
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

        {/* ── Root redirect ── */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Navigate
                to={profile ? (ROLE_HOME[profile.role] ?? ROUTES.UNAUTHORIZED) : ROUTES.LOGIN}
                replace
              />
            </PrivateRoute>
          }
        />

        {/* ══ DEVELOPER ══ */}
        <Route path={ROUTES.DEVELOPER_DASHBOARD} element={
          <RoleRoute roles={[ROLES.DEVELOPER]}>
            <L><DeveloperDashboard /></L>
          </RoleRoute>
        } />
        <Route path={ROUTES.DEVELOPER_CENTERS} element={
          <RoleRoute roles={[ROLES.DEVELOPER]}>
            <L><ServiceCentersPage /></L>
          </RoleRoute>
        } />
        <Route path={ROUTES.DEVELOPER_USERS} element={
          <RoleRoute roles={[ROLES.DEVELOPER]}>
            <L><UsersPage /></L>
          </RoleRoute>
        } />

        {/* ══ ADMIN ══ */}
        <Route path={ROUTES.ADMIN_DASHBOARD} element={
          <RoleRoute roles={[ROLES.ADMIN, ROLES.DEVELOPER]}>
            <L><AdminDashboard /></L>
          </RoleRoute>
        } />
        <Route path={ROUTES.ADMIN_EMPLOYEES} element={
          <RoleRoute roles={[ROLES.ADMIN, ROLES.DEVELOPER]}>
            <L><EmployeesPage /></L>
          </RoleRoute>
        } />
        <Route path={ROUTES.ADMIN_CLIENTS} element={
          <RoleRoute roles={[ROLES.ADMIN, ROLES.DEVELOPER]}>
            <L><AdminClientsPage /></L>
          </RoleRoute>
        } />
        <Route path={ROUTES.ADMIN_INVOICES} element={
          <RoleRoute roles={[ROLES.ADMIN, ROLES.DEVELOPER]}>
            <L><InvoicesListPage /></L>
          </RoleRoute>
        } />
        <Route path={ROUTES.ADMIN_CENTERS} element={
          <RoleRoute roles={[ROLES.ADMIN, ROLES.DEVELOPER]}>
            <L><AdminCentersPage /></L>
          </RoleRoute>
        } />

        {/* ══ EMPLOYEE ══ */}
        <Route path={ROUTES.EMPLOYEE_DASHBOARD} element={
          <RoleRoute roles={[ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.DEVELOPER]}>
            <L><EmployeeDashboard /></L>
          </RoleRoute>
        } />
        <Route path={ROUTES.EMPLOYEE_INVOICES} element={
          <RoleRoute roles={[ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.DEVELOPER]}>
            <L><InvoicesListPage /></L>
          </RoleRoute>
        } />
        <Route path={ROUTES.EMPLOYEE_CLIENTS} element={
          <RoleRoute roles={[ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.DEVELOPER]}>
            <L><EmployeeClientsPage /></L>
          </RoleRoute>
        } />

        {/* ══ CLIENT ══ */}
        <Route path={ROUTES.CLIENT_DASHBOARD} element={
          <RoleRoute roles={[ROLES.CLIENT, ROLES.ADMIN, ROLES.DEVELOPER]}>
            <L><ClientDashboard /></L>
          </RoleRoute>
        } />
        <Route path={ROUTES.CLIENT_INVOICES} element={
          <RoleRoute roles={[ROLES.CLIENT, ROLES.ADMIN, ROLES.DEVELOPER]}>
            <L><ClientInvoicesPage /></L>
          </RoleRoute>
        } />

        {/* ══ SHARED INVOICE ROUTES ══ */}
        <Route path={ROUTES.INVOICE_NEW} element={
          <RoleRoute roles={[ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.DEVELOPER]}>
            <L><InvoiceFormPage /></L>
          </RoleRoute>
        } />

        {/* ══ SHARED ══ */}
        <Route path={ROUTES.INVENTORY} element={
          <RoleRoute roles={[ROLES.INVENTORY_MANAGER, ROLES.ADMIN, ROLES.DEVELOPER]}>
            <L><InventoryPage /></L>
          </RoleRoute>
        } />
        <Route path={ROUTES.CHANGE_PASSWORD} element={
          <PrivateRoute>
            <L><ChangePasswordPage /></L>
          </PrivateRoute>
        } />
        <Route path={ROUTES.SEARCH} element={
          <PrivateRoute>
            <L><SearchPage /></L>
          </PrivateRoute>
        } />

        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </Suspense>
  )
}

export default AppRouter
