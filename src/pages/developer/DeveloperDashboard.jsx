import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDeveloperBranding } from '../../hooks/useDeveloperBranding'
import { fetchServiceCenters } from '../../services/centerService'
import { countProfilesByRole } from '../../services/profileService'
import { countInvoices, sumInvoiceTotals } from '../../services/invoiceService'
import StatCard from '../../components/StatCard'
import { ROUTES } from '../../routes/routes'
import toast from 'react-hot-toast'
import { compressImageFile } from '../../utils/imageHelpers'

const DeveloperDashboard = () => {
  const { profile } = useAuth()
  const { brandName, brandLogo, brandBackground, sidebarLogo, setBrandName, setBrandLogo, setBrandBackground, setSidebarLogo, resetBranding } = useDeveloperBranding()
  const [pendingBrandName, setPendingBrandName] = useState(brandName)
  const [pendingBrandLogo, setPendingBrandLogo] = useState(brandLogo)
  const [pendingBrandBackground, setPendingBrandBackground] = useState(brandBackground)
  const [pendingSidebarLogo, setPendingSidebarLogo] = useState(sidebarLogo)
  const [stats, setStats]     = useState(null)
  const [centers, setCenters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPendingBrandName(brandName)
    setPendingBrandLogo(brandLogo)
    setPendingBrandBackground(brandBackground)
    setPendingSidebarLogo(sidebarLogo)
  }, [brandName, brandLogo, brandBackground, sidebarLogo])

  useEffect(() => {
    const load = async () => {
      try {
        const [centersData, roleCounts, invoiceCount, invoiceTotal] = await Promise.all([
          fetchServiceCenters(),
          countProfilesByRole(),
          countInvoices(),
          sumInvoiceTotals(),
        ])
        setCenters(centersData)
        setStats({ roleCounts, invoiceCount, invoiceTotal })
      } catch (err) {
        toast.error('Failed to load system-wide metrics.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 512, maxHeight: 512, initialQuality: 0.8 })
      setPendingBrandLogo(dataUrl)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Unable to process the logo. Use a smaller image.')
    }
  }

  const handleBackgroundUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 1024, maxHeight: 1024, initialQuality: 0.75 })
      setPendingBrandBackground(dataUrl)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Unable to process the background image. Use a smaller image.')
    }
  }

  const handleSidebarLogoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 512, maxHeight: 512, initialQuality: 0.8 })
      setPendingSidebarLogo(dataUrl)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Unable to process the sidebar logo. Use a smaller image.')
    }
  }

  const saveBranding = () => {
    setBrandName(pendingBrandName || 'FranchiseHQ')
    setBrandLogo(pendingBrandLogo)
    setBrandBackground(pendingBrandBackground)
    setSidebarLogo(pendingSidebarLogo)
    toast.success('Developer franchise branding updated.')
  }

  const clearBranding = () => {
    resetBranding()
    setPendingBrandName('FranchiseHQ')
    setPendingBrandLogo(null)
    setPendingBrandBackground(null)
    setPendingSidebarLogo(null)
    toast.success('Developer branding reset.')
  }

  const totalUsers = stats
    ? Object.values(stats.roleCounts).reduce((a, b) => a + b, 0)
    : 0

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
            <span className="w-8 h-[2px] bg-primary-600" />
            System Administrator Control
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Developer Dashboard</h1>
          <p className="text-slate-500 mt-2 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            Full Access — <span className="text-slate-400">Master system overview</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={ROUTES.DEVELOPER_CENTERS} className="btn-secondary group">
            <span>Manage Hubs</span>
            <svg className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </Link>
          <Link to={ROUTES.DEVELOPER_USERS} className="btn-primary group">
            <span>Control Tower</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── Developer Branding Control ── */}
      <div className="bg-white rounded-3xl shadow-premium border border-slate-100 p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary-600">Developer Branding</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">Franchise Name & Logo</h2>
            <p className="text-sm text-slate-500 mt-2">Edit the visible franchise label and developer logo for the developer role only.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={saveBranding} className="btn-primary px-6 py-3 text-xs font-black uppercase tracking-widest">
              Save Branding
            </button>
            <button onClick={clearBranding} className="btn-secondary px-6 py-3 text-xs font-black uppercase tracking-widest">
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-8">
          <div className="space-y-6">
            <div>
              <label className="input-label text-[10px] uppercase tracking-[0.2em]">Franchise Name</label>
              <input
                value={pendingBrandName}
                onChange={(event) => setPendingBrandName(event.target.value)}
                className="input-field w-full"
                placeholder="FranchiseHQ"
              />
            </div>

            <div>
              <label className="input-label text-[10px] uppercase tracking-[0.2em]">Franchise Logo</label>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="w-24 h-24 rounded-3xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                  {pendingBrandLogo ? (
                    <img src={pendingBrandLogo} alt="Franchise logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 font-black text-2xl">F</span>
                  )}
                </div>
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="developer-logo-upload" />
                  <label htmlFor="developer-logo-upload" className="btn-secondary py-2 px-4 text-xs font-black uppercase tracking-widest cursor-pointer inline-block mb-2">
                    Upload Logo
                  </label>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PNG / JPG only</p>
                </div>
              </div>
            </div>

            <div>
              <label className="input-label text-[10px] uppercase tracking-[0.2em]">Background Image</label>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="w-24 h-24 rounded-3xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                  {pendingBrandBackground ? (
                    <img src={pendingBrandBackground} alt="Background preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 font-black text-2xl">B</span>
                  )}
                </div>
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" id="developer-background-upload" />
                  <label htmlFor="developer-background-upload" className="btn-secondary py-2 px-4 text-xs font-black uppercase tracking-widest cursor-pointer inline-block mb-2">
                    Upload Background
                  </label>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PNG / JPG only, fills the page background</p>
                </div>
              </div>
            </div>

            <div>
              <label className="input-label text-[10px] uppercase tracking-[0.2em]">Sidebar Logo</label>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="w-24 h-24 rounded-3xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                  {pendingSidebarLogo ? (
                    <img src={pendingSidebarLogo} alt="Sidebar logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 font-black text-2xl">S</span>
                  )}
                </div>
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={handleSidebarLogoUpload} className="hidden" id="developer-sidebar-logo-upload" />
                  <label htmlFor="developer-sidebar-logo-upload" className="btn-secondary py-2 px-4 text-xs font-black uppercase tracking-widest cursor-pointer inline-block mb-2">
                    Upload Sidebar Logo
                  </label>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PNG / JPG only, appears in sidebar after login</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 p-6 bg-slate-50">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-black mb-4">Preview</p>
            <div
              className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100 overflow-hidden"
              style={pendingBrandBackground ? { backgroundImage: `url(${pendingBrandBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            >
              <div className="rounded-[2rem] bg-white/95 p-6 shadow-inner border border-slate-100">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                    {pendingBrandLogo ? (
                      <img src={pendingBrandLogo} alt="Preview logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-400 text-lg font-black">F</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 truncate">{pendingBrandName || 'FranchiseHQ'}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mt-1">Developer only branding override</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  This section is available only to the developer role. The branding is stored locally for the developer browser and will override the sidebar title and logo when you are signed in as a developer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Service Centers"
          value={loading ? null : centers.length}
          subtitle="Regional operation hubs"
          loading={loading}
          color="blue"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          title="Aggregated Users"
          value={loading ? null : totalUsers}
          subtitle="Multi-role accounts"
          loading={loading}
          color="purple"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard
          title="Global Transactions"
          value={loading ? null : stats?.invoiceCount}
          subtitle="System-wide orders"
          loading={loading}
          color="green"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
        <StatCard
          title="Ecosystem Revenue"
          value={loading ? null : `$${(stats?.invoiceTotal ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          subtitle="Total platform flow"
          loading={loading}
          color="yellow"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* ── Role breakdown + Centers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Role breakdown */}
        <div className="bg-white rounded-3xl shadow-premium border border-slate-100 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Identity Matrix</h2>
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
          </div>
          
          {loading ? (
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between h-4 bg-slate-50 rounded w-full animate-pulse" />
                  <div className="h-1.5 bg-slate-50 rounded-full w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {[
                { role: 'developer', label: 'Engineers', color: 'bg-primary-500', icon: 'bg-primary-50 text-primary-600' },
                { role: 'admin',     label: 'Managers',  color: 'bg-indigo-500', icon: 'bg-indigo-50 text-indigo-600'   },
                { role: 'employee',  label: 'Operators', color: 'bg-emerald-500', icon: 'bg-emerald-50 text-emerald-600' },
                { role: 'client',    label: 'Customers', color: 'bg-amber-500', icon: 'bg-amber-50 text-amber-600'   },
              ].map(({ role, label, color, icon }) => {
                const count = stats?.roleCounts?.[role] ?? 0
                const pct   = totalUsers ? Math.round((count / totalUsers) * 100) : 0
                return (
                  <div key={role} className="group/item">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${icon} flex items-center justify-center text-[10px] font-black`}>
                          {label.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-700 tracking-tight">{label}</span>
                      </div>
                      <span className="text-xs font-black text-slate-400 tracking-tighter">{count} <span className="opacity-40 ml-1">/ {pct}%</span></span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="pt-4 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center italic">Biometric & Identity Distribution</p>
          </div>
        </div>

        {/* Service Centers list */}
        <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden group lg:col-span-2">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Ecosystem Nodes</h2>
              <p className="text-sm font-semibold text-slate-400 mt-0.5">Primary service center network</p>
            </div>
            <Link to={ROUTES.DEVELOPER_CENTERS} className="p-2.5 rounded-xl bg-white border border-slate-200 text-primary-600 hover:bg-primary-50 hover:border-primary-200 transition-all shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </Link>
          </div>

          <div className="p-2">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50/50 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/3" />
                      <div className="h-3 bg-slate-200 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : centers.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <p className="text-slate-500 font-bold text-lg tracking-tight">Zero nodes detected</p>
                <Link to={ROUTES.DEVELOPER_CENTERS} className="btn-primary mt-6">Initialize First Center</Link>
              </div>
            ) : (
              <div className="space-y-1">
                {centers.slice(0, 5).map((center) => (
                  <div key={center.id}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group/node">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden group-hover/node:border-primary-200 transition-colors">
                      {center.logo_url ? (
                        <img src={center.logo_url} alt={center.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-800 font-black text-lg">{center.name?.charAt(0)?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-black text-slate-900 tracking-tight truncate">{center.name}</p>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        Activated {new Date(center.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Node Active</p>
                        <p className="text-[10px] font-bold text-emerald-500 mt-0.5">Online • Stable</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="px-8 py-4 mt-2 border-t border-slate-50 flex justify-center">
              <Link to={ROUTES.DEVELOPER_CENTERS} className="text-[10px] font-black text-slate-400 hover:text-primary-600 uppercase tracking-[0.2em] transition-colors">
                Full Network Topology & Audit
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeveloperDashboard
