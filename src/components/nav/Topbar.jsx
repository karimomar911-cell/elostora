import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../core/auth/AuthProvider'
import { MenuIcon, SearchIcon } from './navConfig'
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from './navConfig'
import { ROUTES } from '../../core/routing/routes'

// Build a flat map of path → label for breadcrumbs
const buildPathMap = (role) => {
  const all = [...(NAV_ITEMS[role] ?? []), ...BOTTOM_NAV_ITEMS]
  const map = {}
  all.forEach(({ path, label }) => { map[path] = label })
  // Static additions
  map[ROUTES.INVOICE_NEW]      = 'New Invoice'
  map[ROUTES.CHANGE_PASSWORD]  = 'Change Password'
  map[ROUTES.SEARCH]           = 'Search'
  return map
}

const Topbar = ({ onMenuClick }) => {
  const { profile, role } = useAuth()
  const location = useLocation()
  const pathMap  = buildPathMap(role)

  // Simple breadcrumb: split path and resolve labels
  const segments = location.pathname.split('/').filter(Boolean)
  const crumbs = segments.map((seg, i) => {
    const fullPath = '/' + segments.slice(0, i + 1).join('/')
    const label = pathMap[fullPath] ?? seg.charAt(0).toUpperCase() + seg.slice(1)
    const isLast = i === segments.length - 1
    return { label, path: fullPath, isLast }
  })

  return (
    <header className="h-16 glass sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
      {/* Decorative Blur */}
      <div className="absolute inset-0 bg-white/40 -z-10" />

      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2.5 rounded-xl text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          {crumbs.length === 0 && (
            <span className="font-bold text-slate-800 tracking-tight">Dashboard</span>
          )}
          {crumbs.map(({ label, path, isLast }, i) => (
            <span key={path} className="flex items-center gap-2">
              {i > 0 && (
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {isLast ? (
                <span className="font-bold text-slate-900 tracking-tight">{label}</span>
              ) : (
                <Link to={path} className="text-slate-400 font-semibold hover:text-primary-600 transition-colors">
                  {label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: search shortcut + user info */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Quick search button */}
        <Link
          to={ROUTES.SEARCH}
          className="hidden sm:flex items-center gap-3 px-4 py-2 text-sm text-slate-400
                     bg-slate-100/50 border border-slate-200 rounded-xl hover:bg-white hover:border-primary-300 hover:text-slate-600 hover:shadow-sm transition-all group"
        >
          <SearchIcon className="w-4 h-4 group-hover:text-primary-500 transition-colors" />
          <span className="font-semibold">Quick search</span>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px]
                          bg-white border border-slate-200 rounded font-black text-slate-400">
            /
          </kbd>
        </Link>

        {/* User profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200/60">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-900 leading-none">
              {profile?.full_name ?? 'User'}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{role}</p>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-slate-700 text-sm font-black">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Topbar
