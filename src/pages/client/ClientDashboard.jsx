import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchInvoicesByClient } from '../../services/invoiceService'
import StatCard from '../../components/StatCard'
import { ROUTES } from '../../routes/routes'
import toast from 'react-hot-toast'

const ClientDashboard = () => {
  const { profile } = useAuth()

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return }
    const load = async () => {
      try {
        const data = await fetchInvoicesByClient(profile.id)
        setInvoices(data)
      } catch (err) {
        toast.error('Failed to load your invoices.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile?.id])

  const totalSpent = invoices.reduce(
    (sum, inv) => sum + (parseFloat(inv.final_price) || 0), 0
  )

  const lastVisit = invoices[0]?.service_date
    ? new Date(invoices[0].service_date).toLocaleDateString()
    : null

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">
            Welcome, {profile?.full_name ?? 'Client'} —{' '}
            {profile?.service_centers?.name ?? 'your service center'}
          </p>
        </div>
        <Link to={ROUTES.CLIENT_INVOICES} className="btn-primary text-sm">
          View All Invoices
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Invoices"
          value={loading ? null : invoices.length}
          subtitle="All service visits"
          loading={loading}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                   a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          title="Total Spent"
          value={loading ? null : `$${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Across all invoices"
          loading={loading}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2
                   m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1
                   c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Last Visit"
          value={loading ? null : (lastVisit ?? 'N/A')}
          subtitle="Most recent service"
          loading={loading}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7
                   a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Service center info */}
      {profile?.service_centers && (
        <div className="card mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary-50 border border-primary-100
                          flex items-center justify-center flex-shrink-0 overflow-hidden">
            {profile.service_centers.logo_url ? (
              <img
                src={profile.service_centers.logo_url}
                alt={profile.service_centers.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-primary-700 font-bold text-xl">
                {profile.service_centers.name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">
              Your Service Center
            </p>
            <p className="font-semibold text-gray-900 text-lg">
              {profile.service_centers.name}
            </p>
          </div>
        </div>
      )}

      {/* Recent invoices */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-800">Recent Service History</h2>
          <Link
            to={ROUTES.CLIENT_INVOICES}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 py-3 border-b border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                     a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No service history yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Your invoices will appear here after your first service visit.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead className="table-head">
                <tr>
                  <th className="table-th">Car Model</th>
                  <th className="table-th">Service Date</th>
                  <th className="table-th">Handover Date</th>
                  <th className="table-th">Services</th>
                  <th className="table-th">Final Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {invoices.slice(0, 5).map(inv => (
                  <tr key={inv.id} className="table-tr">
                    <td className="table-td font-medium text-gray-900">
                      {inv.car_model ?? '—'}
                    </td>
                    <td className="table-td text-gray-500">
                      {inv.service_date
                        ? new Date(inv.service_date).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="table-td text-gray-500">
                      {inv.handover_date
                        ? new Date(inv.handover_date).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="table-td text-gray-500 max-w-[200px] truncate">
                      {inv.services_performed ?? '—'}
                    </td>
                    <td className="table-td font-semibold text-gray-900">
                      ${parseFloat(inv.final_price || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientDashboard
