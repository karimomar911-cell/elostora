import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/nav/Sidebar'
import Topbar  from '../components/nav/Topbar'
import { useUIStore } from '../core/store/uiStore'

const AppLayout = ({ children }) => {
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const location = useLocation()

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname, setSidebarOpen])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Desktop sidebar (always visible ≥ lg) ── */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer — slides in from left */}
          <div className="relative z-50 flex h-full w-64 animate-slide-in">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main content area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div key={location.pathname} className="p-4 lg:p-10 max-w-screen-2xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
