import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Clock, Database, User, FileText, Building2, AlertCircle } from 'lucide-react'
import { supabase } from '../core/api/supabaseClient'

const ActionIcon = ({ action }) => {
  switch (action) {
    case 'INSERT': return <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><Database className="w-3 h-3" /></div>
    case 'UPDATE': return <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><Database className="w-3 h-3" /></div>
    case 'DELETE': return <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center"><AlertCircle className="w-3 h-3" /></div>
    default: return <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><Activity className="w-3 h-3" /></div>
  }
}

const EntityIcon = ({ type }) => {
  switch (type) {
    case 'profiles': return <User className="w-4 h-4 text-slate-400" />
    case 'invoices': return <FileText className="w-4 h-4 text-slate-400" />
    case 'service_centers': return <Building2 className="w-4 h-4 text-slate-400" />
    default: return <Database className="w-4 h-4 text-slate-400" />
  }
}

const LiveActivityFeed = () => {
  const [logs, setLogs] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initial fetch of last 10 logs
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setLogs(data)
    }
    fetchLogs()

    // Subscribe to realtime
    const channel = supabase.channel('activity_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, (payload) => {
        setLogs((prev) => [payload.new, ...prev].slice(0, 50)) // Keep last 50
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsConnected(true)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Live Ecosystem Feed</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isConnected ? 'Real-time Active' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide max-h-[400px]">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              layout
              transition={{ type: 'spring', bounce: 0.4 }}
              className="p-3 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors shadow-sm group"
            >
              <div className="flex items-start gap-3">
                <ActionIcon action={log.action} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{log.action}</span>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <EntityIcon type={log.entity_type} />
                      {log.entity_type}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 truncate font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    ID: {log.entity_id.split('-')[0]}...
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          {logs.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm font-semibold">
              Waiting for ecosystem activity...
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default LiveActivityFeed
