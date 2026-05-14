import { useState, useEffect } from 'react'
import { useAuth } from '../../core/auth/AuthProvider'
import { fetchInvoicesByClient } from '../../services/invoiceService'
import Modal          from '../../components/Modal'
import EmptyState     from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

// ── Invoice detail view inside modal ──
const InvoiceDetail = ({ invoice, onClose }) => {
  const spareParts = Array.isArray(invoice.spare_parts) ? invoice.spare_parts : []

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl text-sm">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Client</p>
          <p className="font-semibold text-gray-900">{invoice.client_name ?? '—'}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Car Model</p>
          <p className="font-semibold text-gray-900">{invoice.car_model ?? '—'}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Service Date</p>
          <p className="font-medium text-gray-700">
            {invoice.service_date
              ? new Date(invoice.service_date).toLocaleDateString()
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Handover Date</p>
          <p className="font-medium text-gray-700">
            {invoice.handover_date
              ? new Date(invoice.handover_date).toLocaleDateString()
              : '—'}
          </p>
        </div>
      </div>

      {/* Services performed */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Services Performed</p>
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">
          {invoice.services_performed || '—'}
        </p>
      </div>

      {/* Spare parts */}
      {spareParts.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Spare Parts ({spareParts.length})
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="table-base">
              <thead className="table-head">
                <tr>
                  <th className="table-th">Part Name</th>
                  <th className="table-th">Qty</th>
                  <th className="table-th">Unit Price</th>
                  <th className="table-th">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {spareParts.map((part, i) => (
                  <tr key={i}>
                    <td className="table-td font-medium">{part.name ?? '—'}</td>
                    <td className="table-td">{part.quantity ?? '—'}</td>
                    <td className="table-td">${parseFloat(part.unit_price || 0).toFixed(2)}</td>
                    <td className="table-td font-semibold">
                      ${(parseFloat(part.quantity || 0) * parseFloat(part.unit_price || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Price summary */}
      <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Service Price</span>
          <span>${parseFloat(invoice.service_price || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Total Price</span>
          <span>${parseFloat(invoice.total_price || 0).toFixed(2)}</span>
        </div>
        {parseFloat(invoice.discount || 0) > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>- ${parseFloat(invoice.discount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
          <span>Final Price</span>
          <span>${parseFloat(invoice.final_price || 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={onClose} className="btn-secondary">Close</button>
      </div>
    </div>
  )
}

// ── Main page ──
const ClientInvoicesPage = () => {
  const { profile } = useAuth()

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return }
    const load = async () => {
      try {
        const data = await fetchInvoicesByClient(profile.id)
        setInvoices(data)
      } catch {
        toast.error('Failed to load invoices.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile?.id])

  const filtered = invoices.filter(inv =>
    !search ||
    inv.car_model?.toLowerCase().includes(search.toLowerCase()) ||
    inv.services_performed?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">My Invoices</h1>
          <p className="page-subtitle">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by car model or service…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field max-w-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No invoices found"
            message="Your service history will appear here after your first visit."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => (
            <div
              key={inv.id}
              className="card-hover flex flex-col sm:flex-row sm:items-center gap-4"
              onClick={() => setSelected(inv)}
            >
              {/* Car icon */}
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h6l2 3h1a2 2 0 012 2v5
                       a2 2 0 01-2 2h-2m-6 0h6m-6 0a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{inv.car_model ?? '—'}</p>
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {inv.services_performed ?? 'No services listed'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {inv.service_date
                    ? new Date(inv.service_date).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })
                    : '—'}
                </p>
              </div>

              {/* Price + arrow */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-lg">
                    ${parseFloat(inv.final_price || 0).toFixed(2)}
                  </p>
                  {parseFloat(inv.discount || 0) > 0 && (
                    <p className="text-xs text-green-600">
                      -{parseFloat(inv.discount).toFixed(2)} discount
                    </p>
                  )}
                </div>
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice detail modal */}
      <Modal
        open={!!selected}
        title="Invoice Details"
        onClose={() => setSelected(null)}
        size="lg"
      >
        {selected && (
          <InvoiceDetail invoice={selected} onClose={() => setSelected(null)} />
        )}
      </Modal>
    </div>
  )
}

export default ClientInvoicesPage
