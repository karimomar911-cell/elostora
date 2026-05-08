import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../routes/routes'
import { useAuth } from '../core/auth/AuthProvider'

const HELP_CONTENT = [
  { 
    title: 'Developer Dashboard', 
    desc: 'Manage service centers and system data.',
    detail: 'The Developer Dashboard allows complete oversight. Factory reset wipes all non-developer users and transactions.',
    route: ROUTES.DEVELOPER_DASHBOARD
  },
  { 
    title: 'System Purge (Dev Only)', 
    desc: 'Learn how to reset the entire database.',
    detail: 'Go to the Users page and click "Factory Settings". This wipes everything except developers. USE WITH CAUTION!',
    route: ROUTES.DEVELOPER_USERS
  },
  { 
    title: 'Admin Management', 
    desc: 'Oversee branch staff, clients, and invoices.',
    detail: 'Admins can manage employees, register clients, and approve or view all invoices under their branch.',
    route: ROUTES.ADMIN_DASHBOARD
  },
  { 
    title: 'Employee Operations', 
    desc: 'Create invoices and serve clients.',
    detail: 'Employees can create new invoices, auto-fill client car details, and track their daily activities.',
    route: ROUTES.EMPLOYEE_DASHBOARD
  },
  { 
    title: 'Smart Invoicing', 
    desc: 'How to use auto-fill for clients.',
    detail: 'Type the client name in the search box. Once selected, their Car Model and VIN will fill in automatically! No typing needed.',
    route: ROUTES.INVOICE_NEW
  },
  { 
    title: 'Global Inventory', 
    desc: 'Understand the shared warehouse & stock protection.',
    detail: 'All branches share the same master list. Deductions happen instantly on invoice save. If you try to use more parts than available, the system blocks the save.',
    route: ROUTES.INVENTORY
  },
  { 
    title: 'Client Portal', 
    desc: 'View personal service history.',
    detail: 'Clients can log in to view their past invoices and service records anytime without contacting staff.',
    route: ROUTES.CLIENT_DASHBOARD
  },
  { 
    title: 'Identity Control', 
    desc: 'Managing global user profiles.',
    detail: 'You can create Admins, Employees, and Clients here. Clients can also store car data like VIN and Model.',
    route: ROUTES.ADMIN_EMPLOYEES
  }
]

const SupportAssistant = () => {
  const { role } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTip, setSelectedTip] = useState(null)
  const [isBouncing, setIsBouncing] = useState(true)
  const [position, setPosition] = useState({ x: 32, y: 32 }) // bottom, left in pixels
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // Provide all site info universally
  const tips = HELP_CONTENT

  const handleMouseDown = (e) => {
    if (isOpen) return
    setIsDragging(true)
    setIsBouncing(false)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return
      // Calculate position relative to bottom-left
      const newX = e.clientX - dragOffset.x
      const newY = window.innerHeight - (e.clientY + (64 - dragOffset.y))
      setPosition({ x: Math.max(10, newX), y: Math.max(10, newY) })
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        if (!isOpen) setIsBouncing(true)
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, isOpen])

  return (
    <div 
      className="fixed z-[99999]"
      style={{ left: `${position.x}px`, bottom: `${position.y}px`, pointerEvents: 'auto' }}
    >
      {/* Help Panel */}
      {isOpen && (
        <div className="absolute bottom-24 left-0 w-80 bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white p-7 animate-fade-in origin-bottom-left overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          
          {selectedTip ? (
            <div className="relative z-10 animate-fade-in">
              <button 
                onClick={() => setSelectedTip(null)}
                className="text-xs font-black text-primary-600 uppercase tracking-widest flex items-center gap-1 mb-4 hover:translate-x-1 transition-transform"
              >
                ← العودة للقائمة
              </button>
              <h4 className="text-sm font-black text-slate-900 mb-2">{selectedTip.title}</h4>
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed mb-6">
                {selectedTip.detail}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => { navigate(selectedTip.route); setIsOpen(false); setSelectedTip(null); }}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all hover:scale-[1.02]"
                >
                  انتقل إلى الصفحة
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-pulse" />
                مركز المساعدة الذكي
              </h3>
              
              <div className="space-y-3">
                {tips.map((tip, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedTip(tip)}
                    className="w-full text-right group p-4 bg-slate-50 hover:bg-primary-50 rounded-2xl transition-all border border-transparent hover:border-primary-100 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-[11px] font-black text-primary-600 uppercase tracking-widest mb-1 group-hover:text-primary-700">{tip.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-500">{tip.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full mt-6 py-3 border-2 border-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 transition-all"
              >
                إغلاق المساعد
              </button>
            </>
          )}
        </div>
      )}

      {/* Floating Avatar */}
      <button
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsBouncing(false)}
        onMouseLeave={() => !isOpen && !isDragging && setIsBouncing(true)}
        onClick={() => !isDragging && setIsOpen(!isOpen)}
        className={`relative w-32 h-32 rounded-full shadow-2xl transition-all duration-300 group overflow-hidden border-2 border-white cursor-grab active:cursor-grabbing
          ${isBouncing && !isOpen && !isDragging ? 'animate-bounce-slow' : ''} 
          ${isOpen ? 'ring-4 ring-primary-500/20' : ''}
          ${isDragging ? 'scale-110 rotate-12 shadow-primary-500/50' : 'hover:scale-110'}
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-indigo-600 opacity-20 group-hover:opacity-40 transition-opacity" />
        <img 
          src="/support_assistant_avatar_1777752756515.png" 
          alt="Assistant" 
          className="w-full h-full object-cover"
        />
        
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-primary-400 rounded-full blur opacity-20 group-hover:opacity-50 transition-opacity animate-pulse" />
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}} />
    </div>
  )
}

export default SupportAssistant
