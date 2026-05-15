import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Home, Building2, Users, FileText, Settings, X, LogOut, Package } from 'lucide-react'
import { useAuth } from '../core/auth/AuthProvider'
import { ROUTES, ROLES } from '../core/routing/routes'

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { profile, role, logout } = useAuth()

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
    }
  }, [isOpen])

  // Commands context
  const getCommands = () => {
    const commands = [
      { id: 'search', title: 'Global Search', icon: Search, action: () => navigate(ROUTES.SEARCH) },
      { id: 'password', title: 'Change Password', icon: Settings, action: () => navigate(ROUTES.CHANGE_PASSWORD) },
      { id: 'logout', title: 'Log out', icon: LogOut, action: () => { logout(); setIsOpen(false) } },
    ]

    if (role === ROLES.DEVELOPER || role === ROLES.ADMIN) {
      commands.push({ id: 'centers', title: 'Service Centers', icon: Building2, action: () => navigate(ROUTES.ADMIN_CENTERS) })
      commands.push({ id: 'invoices', title: 'All Invoices', icon: FileText, action: () => navigate(ROUTES.ADMIN_INVOICES) })
      commands.push({ id: 'users', title: 'Manage Users', icon: Users, action: () => navigate(role === ROLES.DEVELOPER ? ROUTES.DEVELOPER_USERS : ROUTES.ADMIN_EMPLOYEES) })
      commands.push({ id: 'inventory', title: 'Inventory', icon: Package, action: () => navigate(ROUTES.INVENTORY) })
    }

    if (role === ROLES.EMPLOYEE) {
      commands.push({ id: 'invoices', title: 'My Invoices', icon: FileText, action: () => navigate(ROUTES.EMPLOYEE_INVOICES) })
      commands.push({ id: 'clients', title: 'My Clients', icon: Users, action: () => navigate(ROUTES.EMPLOYEE_CLIENTS) })
      commands.push({ id: 'new_invoice', title: 'Create Invoice', icon: FileText, action: () => navigate(ROUTES.INVOICE_NEW) })
    }

    if (role === ROLES.CLIENT) {
      commands.push({ id: 'my_invoices', title: 'My Invoices', icon: FileText, action: () => navigate(ROUTES.CLIENT_INVOICES) })
    }

    if (role === ROLES.INVENTORY_MANAGER) {
      commands.push({ id: 'inventory', title: 'Manage Inventory', icon: Package, action: () => navigate(ROUTES.INVENTORY) })
    }

    return commands
  }

  const allCommands = getCommands()
  const filteredCommands = query === '' 
    ? allCommands 
    : allCommands.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))

  const handleSelect = (action) => {
    action()
    setIsOpen(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden flex flex-col"
          >
            {/* Input Header */}
            <div className="flex items-center px-4 py-4 border-b border-slate-100">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent border-none outline-none text-slate-900 text-lg placeholder:text-slate-400"
              />
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results Body */}
            <div className="max-h-80 overflow-y-auto p-2 scrollbar-hide">
              {filteredCommands.length === 0 ? (
                <div className="py-14 text-center">
                  <p className="text-sm font-semibold text-slate-400">No commands found.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCommands.map((command, idx) => {
                    const Icon = command.icon
                    return (
                      <button
                        key={command.id}
                        onClick={() => handleSelect(command.action)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-sm flex-1">{command.title}</span>
                        {idx === 0 && query === '' && (
                          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-[10px] bg-slate-100 border border-slate-200 rounded font-black text-slate-400 uppercase tracking-widest">
                            Suggested
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200">↑↓</kbd> to navigate
              </span>
              <span className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200">esc</kbd> to close
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default CommandPalette
