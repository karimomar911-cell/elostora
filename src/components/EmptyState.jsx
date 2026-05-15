import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'
import { cn } from '../utils/cn'

const EmptyState = ({ title, message, action, icon: Icon = Inbox, className }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, type: 'spring' }}
    className={cn("flex flex-col items-center justify-center py-20 px-6 text-center", className)}
  >
    <motion.div 
      whileHover={{ scale: 1.05, rotate: 5 }}
      className="w-20 h-20 bg-slate-50 border border-slate-100 shadow-sm rounded-3xl flex items-center justify-center mb-6 text-slate-400"
    >
      <Icon className="w-10 h-10" />
    </motion.div>
    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{title}</h3>
    <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">{message}</p>
    {action && <div className="mt-8">{action}</div>}
  </motion.div>
)

export default EmptyState
