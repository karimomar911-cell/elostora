import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { fetchInvoicesByCenter, deleteInvoice } from '../../services/invoiceService'
import { formatCurrency, formatDate, exportInvoicePDF } from '../../utils/invoiceUtils'
import Modal          from '../../components/Modal'
import ConfirmDialog  from '../../components/ConfirmDialog'
import EmptyState     from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { ROUTES }     from '../../routes/routes'

// ── Invoice detail panel inside modal ──
const InvoiceDetailPanel = ({ invoice, onClose, onDelete, centerName, role }) => {
  const [exporting, setExporting] = useState(false)
  const spareParts = Array.isArray(invoice.spare_parts) ? invoice.spare_parts : []

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportInvoicePDF(invoice, centerName)
      toast.success('PDF exported successfully!')
    } catch (err) {
      toast.error('Failed to export PDF.')
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Client & vehicle grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
        {[
          ['Client',        invoice.client_name  ?? '—'],
          ['Car Model',     invoice.car_model     ?? '—'],
          ['Service Date',  formatDate(invoice.service_date)],
          ['Handover Date', formatDate(invoice.handover_date)],
          ['Assigned To',   invoice.profiles?.full_name ?? '—'],
          ['Facility',      invoice.service_centers?.name ?? centerName],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="font-bold text-slate-800 tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Services Section */}
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
          Services Rendered
        </p>
        <div className="text-sm text-slate-600 bg-white border border-slate-100 rounded-2xl p-5 leading-relaxed shadow-sm font-medium">
          {invoice.services_performed || 'No service description provided.'}
        </div>
      </div>

      {/* Spare parts */}
      {spareParts.length > 0 && (
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
            Inventory & Components ({spareParts.length})
          </p>
          <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-5 py-3">Component</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3">Unit Rate</th>
                  <th className="px-5 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {spareParts.map((part, i) => {
                  const qty   = parseFloat(part.quantity)   || 0
                  const price = parseFloat(part.unit_price) || 0
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-700">{part.name ?? '—'}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-500">{qty}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-500">{formatCurrency(price)}</td>
                      <td className="px-5 py-3.5 font-black text-slate-800 text-right">{formatCurrency(qty * price)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Price summary */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary-500/20 blur-3xl rounded-full" />
        
        <div className="space-y-3 relative z-10">
          <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Service Base</span>
            <span className="text-white">{formatCurrency(invoice.service_price)}</span>
          </div>
          <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Inventory Total</span>
            <span className="text-white">{formatCurrency(invoice.total_price - invoice.service_price)}</span>
          </div>
          {parseFloat(invoice.discount || 0) > 0 && (
            <div className="flex justify-between text-rose-400 text-xs font-bold uppercase tracking-wider">
              <span>Adjustment / Discount</span>
              <span>- {formatCurrency(invoice.discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-end pt-4 border-t border-white/10">
            <div>
              <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] mb-1">Total Settlement</p>
              <p className="text-3xl font-black tracking-tighter">{formatCurrency(invoice.final_price)}</p>
            </div>
            <div className="bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary-500/30">
              Paid / Settled
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary flex-1 py-3.5 text-base"
        >
          {exporting ? (
            <><div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />Processing PDF…</>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                     a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Professional PDF
            </>
          )}
        </button>
        {['admin', 'developer'].includes(role) && (
          <button onClick={onDelete} className="btn-danger sm:w-1/4">
            Delete
          </button>
        )}
        <button onClick={onClose} className="btn-secondary sm:w-1/4">Close</button>
      </div>
    </div>
  )
}

// ── Main list page ──
const InvoicesListPage = () => {
  const { profile, role } = useAuth()
  const navigate = useNavigate()
  const centerId  = profile?.service_center_id
  const centerName = profile?.service_centers?.name ?? 'Service Center'

  const [invoices, setInvoices]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const [search, setSearch]         = useState('')
  const [filterType, setFilterType] = useState('active') // 'active' or 'deleted'

  const load = async () => {
    if (!centerId) { setLoading(false); return }
    try {
      const data = await fetchInvoicesByCenter(centerId)
      setInvoices(data)
    } catch {
      toast.error('Failed to load invoices.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [centerId])

  const filtered = invoices.filter(inv => {
    const matchesSearch = !search ||
      inv.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.car_model?.toLowerCase().includes(search.toLowerCase())
    
    const matchesFilter = filterType === 'active' 
      ? inv.client_id !== null 
      : inv.client_id === null

    return matchesSearch && matchesFilter
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteInvoice(deleteTarget.id)
      toast.success('Invoice deleted.')
      setDeleteTarget(null)
      setSelected(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to delete.')
    } finally {
      setDeleting(false)
    }
  }

  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + (parseFloat(inv.final_price) || 0), 0
  )

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
            <span className="w-8 h-[2px] bg-primary-600" />
            Financial Records
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Invoices</h1>
          <p className="text-slate-500 mt-2 font-semibold">
            {invoices.length} records found • Total Revenue: <span className="text-emerald-600">{formatCurrency(totalRevenue)}</span>
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.INVOICE_NEW)}
          className="btn-primary group"
        >
          <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Generate New Invoice
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200/60 w-full md:w-auto">
          <button
            onClick={() => setFilterType('active')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterType === 'active' ? 'bg-white text-primary-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Active Clients
          </button>
          <button
            onClick={() => setFilterType('deleted')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterType === 'deleted' ? 'bg-white text-rose-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Deleted Users
          </button>
        </div>

        <div className="relative w-full max-w-md group">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by client, vehicle or model…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-11 group-hover:border-slate-300 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Syncing ledger records…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-premium border border-slate-100 p-20 text-center">
          <EmptyState
            title="No records detected"
            message="Your search didn't match any existing invoices. Try adjusting filters or create a new entry."
            action={
              <button onClick={() => navigate(ROUTES.INVOICE_NEW)} className="btn-primary mt-4">
                Generate First Invoice
              </button>
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Identity</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Model / Asset</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Log</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Handover</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Settlement</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(inv => (
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
                    <td className="px-6 py-5 text-xs font-bold text-slate-400">
                      {formatDate(inv.service_date)}
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-400">
                      {formatDate(inv.handover_date)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="inline-flex px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-black text-sm border border-emerald-100">
                        {formatCurrency(inv.final_price)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => setSelected(inv)}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary-600 hover:border-primary-200 hover:shadow-sm transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">End of ledger</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!selected}
        title="Ledger Document Detail"
        onClose={() => setSelected(null)}
        size="lg"
      >
        {selected && (
          <InvoiceDetailPanel
            invoice={selected}
            onClose={() => setSelected(null)}
            onDelete={() => { setDeleteTarget(selected); }}
            centerName={centerName}
            role={role}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Protocol: Delete Record"
        message={`Confirm deletion of invoice for "${deleteTarget?.client_name}". This action will purge the record from the database permanently.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}

export default InvoicesListPage
