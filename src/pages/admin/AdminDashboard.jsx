import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../core/auth/AuthProvider'
import { fetchProfilesByCenter } from '../../services/profileService'
import { fetchInvoicesByCenter } from '../../services/invoiceService'
import StatCard from '../../components/StatCard'
import { ROUTES } from '../../core/routing/routes'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const { profile } = useAuth()
  const centerId = profile?.service_center_id

  const [stats, setStats]       = useState(null)
  const [recentInvoices, setRecentInvoices] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!centerId) { setLoading(false); return }

    const load = async () => {
      try {
        const [centerProfiles, invoices] = await Promise.all([
          fetchProfilesByCenter(centerId),
          fetchInvoicesByCenter(centerId),
        ])

        const employees = centerProfiles.filter(p => p.role === 'employee')
        const clients   = centerProfiles.filter(p => p.role === 'client')

        const totalRevenue = invoices.reduce(
          (sum, inv) => sum + (parseFloat(inv.final_price) || 0), 0
        )

        setStats({
          employeeCount: employees.length,
          clientCount:   clients.length,
          invoiceCount:  invoices.length,
          totalRevenue,
        })
        setRecentInvoices(invoices.slice(0, 5))
      } catch (err) {
        toast.error('Failed to load dashboard data.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [centerId])

  const centerName = profile?.service_centers?.name ?? 'Your Center'

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
            <span className="w-8 h-[2px] bg-primary-600" />
            Management Portal
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Admin Dashboard</h1>
          <p className="text-slate-500 mt-2 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {centerName} — <span className="text-slate-400">Real-time overview</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={ROUTES.ADMIN_EMPLOYEES} className="btn-secondary group">
            <span>Manage Team</span>
            <svg className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link to={ROUTES.ADMIN_INVOICES} className="btn-primary group">
            <span>View Invoices</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Team Members"
          value={loading ? null : stats?.employeeCount}
          subtitle="Active employees"
          loading={loading}
          color="blue"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          title="Client Base"
          value={loading ? null : stats?.clientCount}
          subtitle="Registered users"
          loading={loading}
          color="purple"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
        <StatCard
          title="Total Transactions"
          value={loading ? null : stats?.invoiceCount}
          subtitle="Completed orders"
          loading={loading}
          color="green"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
        <StatCard
          title="Gross Revenue"
          value={loading ? null : `$${(stats?.totalRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Aggregated total"
          loading={loading}
          color="yellow"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-8">
        {/* Recent Invoices Card */}
        <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden group">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Recent Activity</h2>
              <p className="text-sm font-semibold text-slate-400 mt-0.5">The latest 5 invoices generated</p>
            </div>
            <Link to={ROUTES.ADMIN_INVOICES} className="p-2.5 rounded-xl bg-white border border-slate-200 text-primary-600 hover:bg-primary-50 hover:border-primary-200 transition-all shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </Link>
          </div>

          <div className="p-2">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50/50 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/3" />
                      <div className="h-3 bg-slate-200 rounded w-1/4" />
                    </div>
                    <div className="w-24 h-6 bg-slate-200 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : recentInvoices.length === 0 ? (
              <div className="text-center py-20 bg-white">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                </div>
                <p className="text-slate-500 font-bold text-lg tracking-tight">No activity recorded yet</p>
                <p className="text-slate-400 text-sm mt-1 mb-8 font-medium">Start by creating a new invoice for a client.</p>
                <Link to={ROUTES.INVOICE_NEW} className="btn-primary">
                  Create First Invoice
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Identity</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Model / Asset</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Settlement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group/row">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-black group-hover/row:bg-primary-50 group-hover/row:text-primary-600 transition-colors">
                              {inv.client_name?.charAt(0) ?? '—'}
                            </div>
                            <span className="font-bold text-slate-900 tracking-tight">{inv.client_name ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-semibold text-slate-600">{inv.car_model ?? '—'}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {inv.service_date ? new Date(inv.service_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="inline-flex px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-black text-sm shadow-sm border border-emerald-100">
                            ${parseFloat(inv.final_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100 flex justify-center">
            <Link to={ROUTES.ADMIN_INVOICES} className="text-[11px] font-black text-slate-400 hover:text-primary-600 uppercase tracking-[0.2em] transition-colors">
              View Detailed Ledger Records
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
