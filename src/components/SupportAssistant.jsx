import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../routes/routes'
import { useAuth } from '../core/auth/AuthProvider'
import { generateAssistantResponse, isGeminiConfigured } from '../services/geminiService'
import toast from 'react-hot-toast'

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
  const [position, setPosition] = useState({ x: 32, y: 32 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // Chat state
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickHelp, setShowQuickHelp] = useState(true)
  const [modelDetected, setModelDetected] = useState(null)
  const messagesEndRef = useRef(null)
  
  const hasGemini = isGeminiConfigured()
  const tips = HELP_CONTENT

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !hasGemini) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setShowQuickHelp(false)

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await generateAssistantResponse(userMessage, messages)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
      // On first successful response, model is detected
      if (!modelDetected) {
        setModelDetected(true)
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error(err.message || 'Failed to get response from AI assistant')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleQuickTip = (tip) => {
    navigate(tip.route)
    setIsOpen(false)
    setMessages([])
    setShowQuickHelp(true)
  }

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
      {/* Chat Panel */}
      {isOpen && (
        <div className="absolute bottom-24 left-0 w-96 h-[600px] bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white p-6 animate-fade-in origin-bottom-left flex flex-col overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          
          {/* Header */}
          <div className="relative z-10 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-pulse" />
                مساعد ذكي AI
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {!hasGemini && (
              <p className="text-[10px] font-bold text-amber-600 mt-2">⚠️ Gemini API key not configured</p>
            )}
            {hasGemini && isLoading && messages.length === 0 && (
              <p className="text-[10px] font-bold text-blue-600 mt-2">🔍 Detecting available model...</p>
            )}
            {hasGemini && modelDetected && (
              <p className="text-[10px] font-bold text-emerald-600 mt-2">✓ Model ready</p>
            )}
          </div>

          {/* Messages Area */}
          <div className="relative z-10 flex-1 overflow-y-auto py-4 space-y-3 pr-2 custom-scrollbar">
            {showQuickHelp && messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-500 text-center mb-4">Quick Help Topics</p>
                {tips.slice(0, 5).map((tip, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleQuickTip(tip)}
                    className="w-full text-right p-3 bg-slate-50 hover:bg-primary-50 rounded-xl transition-all border border-transparent hover:border-primary-100 text-[10px]"
                  >
                    <h4 className="font-black text-primary-600 mb-1">{tip.title}</h4>
                    <p className="font-bold text-slate-400">{tip.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs px-4 py-2.5 rounded-2xl text-[11px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-900 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-none bg-slate-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {hasGemini ? (
            <div className="relative z-10 pt-4 border-t border-slate-100">
              <div className="flex gap-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  placeholder="اسأل عن أي شيء..."
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  rows="2"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="px-3 py-2.5 bg-primary-600 text-white rounded-xl font-black text-xs hover:bg-primary-700 disabled:opacity-50 transition-all self-end"
                >
                  ارسل
                </button>
              </div>
            </div>
          ) : (
            <div className="relative z-10 pt-4 border-t border-slate-100 text-center text-[10px] text-amber-600 font-bold">
              Configure your Gemini API key in .env.local to enable AI chat
            </div>
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

