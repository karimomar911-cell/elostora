import { UserCog } from 'lucide-react'

const IdentityMatrix = ({ stats, loading, totalUsers }) => {
  return (
    <div className="bg-white rounded-3xl shadow-premium border border-slate-100 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Identity Matrix</h2>
        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
          <UserCog className="w-5 h-5" />
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
  )
}

export default IdentityMatrix
