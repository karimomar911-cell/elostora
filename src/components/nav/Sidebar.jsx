import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDeveloperBranding } from '../../hooks/useDeveloperBranding'
import {
  NAV_ITEMS,
  BOTTOM_NAV_ITEMS,
  LogoutIcon,
  CloseIcon,
} from './navConfig'

// Role badge colors
const ROLE_COLORS = {
  developer: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  admin:             'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  inventory_manager: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  employee:          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  client:            'bg-amber-500/20 text-amber-300 border border-amber-500/30',
}

const Sidebar = ({ onClose }) => {
  const { profile, logout, role } = useAuth()
  const { brandName, brandLogo, sidebarLogo } = useDeveloperBranding()
  const navigate = useNavigate()

  const navItems    = NAV_ITEMS[role] ?? []
  const bottomItems = BOTTOM_NAV_ITEMS

  const handleLogout = async () => {
    await logout()
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group
     ${isActive
       ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 translate-x-1'
       : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'
     }`

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d] w-64 flex-shrink-0 border-r border-white/5 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary-600/10 blur-[60px] rounded-full pointer-events-none" />

      {/* ── Logo / Brand ── */}
      <div className="relative z-10 flex items-center justify-between px-6 py-7">
        <div className="flex items-center gap-3.5">
          <div className="relative w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg border border-white/10 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary-500/30 group hover:scale-105">
            <div className="absolute inset-0 rounded-3xl bg-primary-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-400/0 to-primary-600/0 group-hover:from-primary-400/10 group-hover:to-primary-600/20 transition-all duration-300" />
            {role === 'developer' && sidebarLogo ? (
              <img src={sidebarLogo} alt="Sidebar Logo" className="relative w-full h-full object-cover" />
            ) : role === 'developer' && brandLogo ? (
              <img src={brandLogo} alt="Brand Logo" className="relative w-full h-full object-cover" />
            ) : profile?.service_centers?.logo_url ? (
              <img src={profile.service_centers.logo_url} alt="Logo" className="relative w-full h-full object-cover" />
            ) : (
              <svg className="relative w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5
                     M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-base tracking-tighter leading-tight truncate">
              {role === 'developer'
                ? brandName || profile?.service_centers?.name || 'FranchiseHQ'
                : profile?.service_centers?.name || 'FranchiseHQ'}
            </p>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-0.5 opacity-60">
              {role === 'developer' ? 'System Root' : 'Service Node'}
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* ── Profile Section ── */}
      <div className="relative z-10 px-4 py-6">
        <div className="flex flex-col gap-4 p-5 rounded-2xl glass-dark border-white/5 overflow-hidden group">
          {/* Decorative background circle */}
          <div className="absolute top-[-20%] right-[-10%] w-16 h-16 bg-primary-500/10 blur-xl rounded-full group-hover:scale-150 transition-transform duration-700" />
          
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner">
              <span className="text-white text-lg font-black tracking-tighter">
                {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate leading-tight">
                {profile?.full_name ?? 'Guest User'}
              </p>
              <div className="flex mt-1">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${ROLE_COLORS[role] ?? 'bg-slate-700 text-slate-400'}`}>
                  {role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main navigation ── */}
      <nav className="relative z-10 flex-1 px-4 py-4 space-y-1.5 overflow-y-auto scrollbar-hide">
        <p className="px-3 mb-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
          Menu
        </p>
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path.split('/').length <= 2}
            className={linkClass}
            onClick={onClose}
          >
            <Icon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="tracking-tight">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom navigation ── */}
      <div className="relative z-10 px-4 py-6 mt-auto border-t border-white/5 space-y-1.5">
        {bottomItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={linkClass}
            onClick={onClose}
          >
            <Icon className="w-5 h-5 opacity-70" />
            <span className="tracking-tight">{label}</span>
          </NavLink>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold
                     text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 hover:translate-x-1
                     transition-all duration-300"
        >
          <LogoutIcon className="w-5 h-5 opacity-70" />
          <span className="tracking-tight">Sign out</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
