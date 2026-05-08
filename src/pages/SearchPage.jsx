import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../core/auth/AuthProvider'
import {
  searchInvoices,
  searchProfiles,
  searchCenters,
} from '../services/searchService'
import { formatCurrency, formatDate } from '../utils/invoiceUtils'
import { ROLES } from '../routes/routes'
import LoadingSpinner from '../components/LoadingSpinner'

// ── Result type badges ──
const TYPE_CONFIG = {
  invoice: { icon: 'bg-blue-50 text-blue-600',   label: 'Invoice', path: (r) => r === ROLES.ADMIN || r === ROLES.DEVELOPER ? '/admin/invoices' : '/employee/invoices' },
  profile: { icon: 'bg-emerald-50 text-emerald-600',  label: 'Account', path: (r) => r === ROLES.DEVELOPER ? '/developer/users' : '/admin/clients' },
  center:  { icon: 'bg-purple-50 text-purple-600', label: 'Center', path: () => '/developer/centers' },
}

const ResultRow = ({ result, onClick }) => {
  const config = TYPE_CONFIG[result._type] ?? TYPE_CONFIG.invoice

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-5 px-6 py-4 hover:bg-slate-50 transition-all text-left group/row border-b border-slate-50 last:border-0"
    >
      {/* Icon Wrapper */}
      <div className={`w-12 h-12 rounded-2xl ${config.icon} flex items-center justify-center flex-shrink-0 shadow-sm border border-white/50 group-hover/row:scale-110 transition-transform duration-300`}>
        {result._type === 'invoice' && (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        )}
        {result._type === 'profile' && (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        )}
        {result._type === 'center' && (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-black text-slate-900 tracking-tight truncate">{result._title}</p>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">{config.label}</span>
        </div>
        <p className="text-xs font-semibold text-slate-400 truncate">{result._subtitle}</p>
      </div>

      {/* Meta Area */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {result._meta && (
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-800 tracking-tighter">{result._meta}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</p>
          </div>
        )}
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover/row:bg-primary-50 group-hover/row:text-primary-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
        </div>
      </div>
    </button>
  )
}

const SearchPage = () => {
  const { profile, role } = useAuth()
  const navigate = useNavigate()
  const centerId = profile?.service_center_id
  const inputRef = useRef(null)

  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const [filter, setFilter]     = useState('all')

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    try {
      const scopedCenter = role === ROLES.DEVELOPER ? null : centerId
      const [invoices, profiles, centers] = await Promise.all([
        searchInvoices(q, scopedCenter),
        searchProfiles(q, scopedCenter),
        role === ROLES.DEVELOPER ? searchCenters(q) : Promise.resolve([]),
      ])

      const normalized = [
        ...invoices.map(inv => ({
          _type:    'invoice',
          _id:      inv.id,
          _title:   inv.client_name ?? 'Undefined Client',
          _subtitle:`${inv.car_model ?? 'Unknown Asset'} · ${formatDate(inv.service_date)}`,
          _meta:    formatCurrency(inv.final_price),
        })),
        ...profiles.map(p => ({
          _type:    'profile',
          _id:      p.id,
          _title:   p.full_name ?? 'Unnamed User',
          _subtitle:`${p.role.toUpperCase()} · ${p.service_centers?.name ?? 'Headquarters'}`,
        })),
        ...centers.map(c => ({
          _type:    'center',
          _id:      c.id,
          _title:   c.name,
          _subtitle:`Node established on ${formatDate(c.created_at)}`,
        })),
      ]
      setResults(normalized)
    } catch (err) { console.error('Search error:', err) } finally { setLoading(false) }
  }, [role, centerId])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 350)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  const filtered = filter === 'all' ? results : results.filter(r => r._type === filter)

  const handleResultClick = (result) => {
    const target = TYPE_CONFIG[result._type]?.path(role)
    if (target) navigate(target)
  }

  const filterTabs = [
    { key: 'all',     label: 'Global' },
    { key: 'invoice', label: 'Ledger' },
    { key: 'profile', label: 'Identity' },
    ...(role === ROLES.DEVELOPER ? [{ key: 'center', label: 'Nodes' }] : []),
  ]

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
            <span className="w-8 h-[2px] bg-primary-600" />
            Global Intelligence
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">System Search</h1>
        </div>
      </div>

      <div className="max-w-3xl space-y-8">
        {/* Search Control */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <svg className="w-6 h-6 text-slate-300 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by identity, asset, or node ID…"
            className="input-field pl-16 pr-24 py-5 text-lg font-bold placeholder:text-slate-300 shadow-xl group-focus-within:ring-primary-100 transition-all border-slate-100"
          />
          <div className="absolute inset-y-0 right-0 pr-6 flex items-center gap-3">
            {loading ? (
              <div className="w-6 h-6 border-3 border-slate-100 border-t-primary-500 rounded-full animate-spin" />
            ) : query ? (
              <button onClick={() => { setQuery(''); setResults([]); setSearched(false) }} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-[10px] font-black bg-slate-50 border border-slate-200 rounded-lg text-slate-400 tracking-tighter">
                PRESS /
              </kbd>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        {searched && results.length > 0 && (
          <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit border border-slate-200/50 backdrop-blur-sm">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3
                  ${filter === tab.key ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-md text-[10px] ${filter === tab.key ? 'bg-primary-50 text-primary-600' : 'bg-slate-200 text-slate-500'}`}>
                  {tab.key === 'all' ? results.length : results.filter(r => r._type === tab.key).length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Results Manifest */}
        <div className="space-y-6">
          {!searched && !loading && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center shadow-premium">
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Neural Engine Ready</h2>
              <p className="text-slate-400 font-semibold max-w-sm mx-auto">Input parameters to begin scanning the unified platform database.</p>
            </div>
          )}

          {searched && !loading && filtered.length === 0 && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center shadow-premium">
              <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-rose-200">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Null Result</h2>
              <p className="text-slate-400 font-semibold">No entities matching those parameters exist in the current scope.</p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="bg-white rounded-[2.5rem] shadow-premium border border-slate-100 overflow-hidden">
              <div className="divide-y divide-slate-50">
                {filtered.map(result => (
                  <ResultRow
                    key={`${result._type}-${result._id}`}
                    result={result}
                    onClick={() => handleResultClick(result)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchPage
