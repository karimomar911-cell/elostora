import { Link } from 'react-router-dom'
import { ROUTES } from '../core/routing/routes'

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6 relative overflow-hidden">
    {/* Animated background elements */}
    <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary-600/20 blur-[120px] rounded-full animate-pulse" />
    <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-indigo-600/20 blur-[100px] rounded-full animate-pulse delay-700" />

    <div className="max-w-md w-full relative z-10 text-center">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl mb-8 group hover:scale-110 transition-transform duration-500">
        <svg className="w-12 h-12 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <h1 className="text-7xl font-black text-white tracking-tighter mb-4 animate-fade-in-up">404</h1>
      <h2 className="text-2xl font-bold text-slate-100 mb-4 tracking-tight">Signal Lost in Void</h2>
      <p className="text-slate-400 font-medium mb-10 leading-relaxed">
        The requested coordinate does not exist in the current system hierarchy. It may have been relocated or purged.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to="/" 
          className="btn-primary py-4 px-8 flex-1 group"
        >
          <span className="relative z-10 font-black uppercase tracking-widest text-xs">Return to Node</span>
          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <button 
          onClick={() => window.history.back()}
          className="btn-secondary py-4 px-8 flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
        >
          <span className="font-black uppercase tracking-widest text-xs">Previous State</span>
        </button>
      </div>
    </div>
  </div>
)

export default NotFoundPage
