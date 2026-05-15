import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

const StatCard = ({ title, value, subtitle, icon, color = 'blue', loading = false, delay = 0 }) => {
  const colors = {
    blue:   { bg: 'from-primary-50 to-white',   icon: 'bg-primary-100 text-primary-600',   accent: 'bg-primary-600' },
    green:  { bg: 'from-emerald-50 to-white',  icon: 'bg-emerald-100 text-emerald-600',  accent: 'bg-emerald-600' },
    purple: { bg: 'from-indigo-50 to-white',   icon: 'bg-indigo-100 text-indigo-600',   accent: 'bg-indigo-600'  },
    yellow: { bg: 'from-amber-50 to-white',    icon: 'bg-amber-100 text-amber-600',    accent: 'bg-amber-600'   },
    red:    { bg: 'from-rose-50 to-white',     icon: 'bg-rose-100 text-rose-600',     accent: 'bg-rose-600'    },
  }
  const c = colors[color] ?? colors.blue

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1, type: 'spring', bounce: 0.4 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        "relative overflow-hidden group bg-gradient-to-br rounded-2xl shadow-premium border border-slate-100 p-6 transition-colors duration-300",
        c.bg
      )}
    >
      {/* Accent bar */}
      <motion.div 
        className={cn("absolute top-0 left-0 w-1.5 h-full opacity-20 group-hover:opacity-100 transition-opacity", c.accent)} 
        layoutId={`accent-${title}`}
      />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <motion.div 
          whileHover={{ rotate: 5, scale: 1.1 }}
          className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-colors", c.icon)}
        >
          {icon}
        </motion.div>
        {loading ? (
          <div className="w-4 h-4 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-slate-200" />
        )}
      </div>

      <div className="flex flex-col">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
        {loading ? (
          <div className="h-9 w-32 bg-slate-200 rounded-lg animate-pulse" />
        ) : (
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{value ?? '—'}</p>
        )}
        {subtitle && (
          <p className="text-xs font-semibold text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default StatCard

