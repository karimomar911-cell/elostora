import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '../core/validation/schemas'
import { useAuth } from '../core/auth/AuthProvider'
import toast from 'react-hot-toast'
import { compressImageFile } from '../utils/imageHelpers'

const EyeIcon = ({ open }) =>
  open ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
           -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
           a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243
           M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29
           m7.532 7.532l3.29 3.29M3 3l3.59 3.59
           m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7
           a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )

const LoginPage = () => {
  const { login, loading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError]   = useState('')

  // Developer Branding State
  const [brandName, setBrandName] = useState('FranchiseHQ')
  const [brandLogo, setBrandLogo] = useState(null)
  const [brandBackground, setBrandBackground] = useState(null)
  const [heroTitle1, setHeroTitle1] = useState('Unlock your')
  const [heroTitle2, setHeroTitle2] = useState('Digital Hub.')
  const [heroSub, setHeroSub] = useState('Experience seamless access to your entire unified operational ecosystem.')
  
  const [formTitle, setFormTitle] = useState('Welcome back')
  const [formSubtitle, setFormSubtitle] = useState('Please enter your credentials to sign in.')

  const [isDevMode, setIsDevMode] = useState(false)
  const [showPwdPrompt, setShowPwdPrompt] = useState(false)
  const [devPwd, setDevPwd] = useState('')
  const [pwdError, setPwdError] = useState(false)
  const fileInputRef = useRef(null)
  const backgroundInputRef = useRef(null)

  const handlePwdSubmit = () => {
    if (devPwd === (import.meta.env.VITE_DEV_PASSWORD || 'admin')) {
      setIsDevMode(true)
      setShowPwdPrompt(false)
      setPwdError(false)
      setDevPwd('')
    } else {
      setPwdError(true)
    }
  }

  useEffect(() => {
    // Load branding from localStorage on mount
    const savedName = localStorage.getItem('dev_brand_name')
    const savedLogo = localStorage.getItem('dev_brand_logo')
    const savedHeroTitle1 = localStorage.getItem('dev_hero_title1')
    const savedHeroTitle2 = localStorage.getItem('dev_hero_title2')
    const savedHeroSub = localStorage.getItem('dev_hero_sub')
    const savedFormTitle = localStorage.getItem('dev_form_title')
    const savedFormSubtitle = localStorage.getItem('dev_form_subtitle')
    const savedBackground = localStorage.getItem('dev_brand_background')
    
    if (savedName) setBrandName(savedName)
    if (savedLogo) setBrandLogo(savedLogo)
    if (savedBackground) setBrandBackground(savedBackground)
    if (savedHeroTitle1) setHeroTitle1(savedHeroTitle1)
    if (savedHeroTitle2) setHeroTitle2(savedHeroTitle2)
    if (savedHeroSub) setHeroSub(savedHeroSub)
    if (savedFormTitle) setFormTitle(savedFormTitle)
    if (savedFormSubtitle) setFormSubtitle(savedFormSubtitle)
  }, [])

  const handleBrandNameChange = (e) => {
    const val = e.target.value
    setBrandName(val)
    localStorage.setItem('dev_brand_name', val)
  }

  const handleHeroTitle1Change = (e) => {
    const val = e.target.value
    setHeroTitle1(val)
    localStorage.setItem('dev_hero_title1', val)
  }

  const handleHeroTitle2Change = (e) => {
    const val = e.target.value
    setHeroTitle2(val)
    localStorage.setItem('dev_hero_title2', val)
  }

  const handleHeroSubChange = (e) => {
    const val = e.target.value
    setHeroSub(val)
    localStorage.setItem('dev_hero_sub', val)
  }

  const handleFormTitleChange = (e) => {
    const val = e.target.value
    setFormTitle(val)
    localStorage.setItem('dev_form_title', val)
  }

  const handleFormSubtitleChange = (e) => {
    const val = e.target.value
    setFormSubtitle(val)
    localStorage.setItem('dev_form_subtitle', val)
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 512, maxHeight: 512, initialQuality: 0.8 })
      setBrandLogo(dataUrl)
      localStorage.setItem('dev_brand_logo', dataUrl)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Unable to process the logo. Use a smaller image.')
    }
  }

  const handleBackgroundUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 1024, maxHeight: 1024, initialQuality: 0.75 })
      setBrandBackground(dataUrl)
      localStorage.setItem('dev_brand_background', dataUrl)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Unable to process the background image. Use a smaller image.')
    }
  }

  const resetBranding = () => {
    setBrandName('FranchiseHQ')
    setBrandLogo(null)
    setBrandBackground(null)
    setHeroTitle1('Unlock your')
    setHeroTitle2('Digital Hub.')
    setHeroSub('Experience seamless access to your entire unified operational ecosystem.')
    setFormTitle('Welcome back')
    setFormSubtitle('Please enter your credentials to sign in.')
    
    localStorage.removeItem('dev_brand_name')
    localStorage.removeItem('dev_brand_logo')
    localStorage.removeItem('dev_brand_background')
    localStorage.removeItem('dev_hero_title1')
    localStorage.removeItem('dev_hero_title2')
    localStorage.removeItem('dev_hero_sub')
    localStorage.removeItem('dev_form_title')
    localStorage.removeItem('dev_form_subtitle')
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ 
    resolver: zodResolver(loginSchema),
    mode: 'onBlur' 
  })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await login(data)
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.')
    }
  }

  const busy = isSubmitting || loading

  return (
    <div
      className="min-h-screen relative flex items-center justify-center overflow-hidden font-sans p-4 sm:p-8"
      style={brandBackground ? { backgroundImage: `url(${brandBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : { backgroundColor: '#030712' }}
    >
      {/* ── Background Abstract Effects ── */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/30 blur-[140px] rounded-full animate-float mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/20 blur-[130px] rounded-full animate-float animate-delay-300 mix-blend-screen pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-blue-500/20 blur-[100px] rounded-full animate-float animate-delay-200 mix-blend-screen pointer-events-none" />
      
      {/* ── Main Login Card (Glassmorphism) ── */}
      <div className="relative z-10 w-full max-w-[1000px] flex flex-col md:flex-row bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] overflow-hidden animate-scale-in">
        
        {/* ── Left Panel: Branding & Creative Visual ── */}
        <div className="w-full md:w-5/12 bg-white/[0.02] border-b md:border-b-0 md:border-r border-white/10 p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden">
          {/* subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            {/* Dynamic Logo */}
            <div className="flex flex-col items-start gap-5 animate-fade-in">
              <span className="text-white font-extrabold text-6xl lg:text-8xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                {brandName || 'Brand Name'}
              </span>
              {brandLogo ? (
                <img src={brandLogo} alt="Brand Logo" className="w-[28rem] h-[28rem] rounded-[2rem] object-contain shadow-2xl shadow-black/50 bg-white/10 p-3" />
              ) : (
                <div className="w-[28rem] h-[28rem] bg-gradient-to-br from-indigo-500 to-fuchsia-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                  <svg className="w-28 h-28 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5
                         m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5
                         a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
            </div>

            <div className="mt-16 sm:mt-24">
              <h1 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                {heroTitle1}<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
                  {heroTitle2}
                </span>
              </h1>
              <p className="text-slate-400/80 text-lg leading-relaxed font-medium max-w-sm">
                {heroSub}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-16 sm:mt-24">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1,2,3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050510] bg-gradient-to-br from-slate-700 to-slate-800" />
                ))}
              </div>
              <span className="text-sm font-medium text-slate-400">Join 10,000+ users</span>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Form ── */}
        <div className="w-full md:w-7/12 p-10 lg:p-14 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl font-black text-white tracking-tight">{formTitle}</h2>
              <p className="text-slate-400 mt-2 font-medium">{formSubtitle}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {serverError && (
                <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-fade-in">
                  <svg className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94
                         a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-sm text-rose-300 font-semibold">{serverError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-300 ml-1">Work Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  disabled={busy}
                  className={`w-full px-4 py-3.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white/10 transition-all placeholder:text-slate-500 ${errors.email ? 'border-rose-500/50 focus:ring-rose-500/50' : ''}`}
                  {...register('email')}
                />
                {errors.email && <p className="text-xs font-medium text-rose-400 ml-1 mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-300 ml-1">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    disabled={busy}
                    className={`w-full px-4 py-3.5 pr-12 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white/10 transition-all placeholder:text-slate-500 ${errors.password ? 'border-rose-500/50 focus:ring-rose-500/50' : ''}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-400 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {errors.password && <p className="text-xs font-medium text-rose-400 ml-1 mt-1">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between pt-2 pb-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-4 h-4">
                    <input type="checkbox" className="peer appearance-none w-4 h-4 rounded border border-white/20 bg-white/5 checked:bg-indigo-500 checked:border-indigo-500 transition-all cursor-pointer focus:ring-2 focus:ring-indigo-500/50 focus:outline-none" />
                    <svg className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Remember me</span>
                </label>
                <button type="button" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={busy} className="w-full py-4 bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {busy ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Developer Tools (Only available in development) ── */}
      {import.meta.env.DEV && (
        <>
          <button 
            onClick={() => {
              if (isDevMode) {
                setIsDevMode(false)
                setShowPwdPrompt(false)
              } else {
                setShowPwdPrompt(true)
              }
            }}
            className="fixed bottom-6 right-6 w-12 h-12 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all z-50 shadow-xl group"
            title="Developer Customization"
          >
            <svg className={`w-5 h-5 transition-transform duration-500 ${isDevMode || showPwdPrompt ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {(isDevMode || showPwdPrompt) && (
            <div className="fixed bottom-24 right-6 w-80 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl z-50 animate-fade-in">
              {showPwdPrompt && !isDevMode ? (
                <div>
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Developer Access
                  </h3>
                  <div className="space-y-3">
                    <input 
                      type="password"
                      value={devPwd}
                      onChange={(e) => { setDevPwd(e.target.value); setPwdError(false); }}
                      placeholder="Enter Developer Password"
                      className={`w-full bg-black/30 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 ${pwdError ? 'border-rose-500 focus:ring-rose-500/50' : 'border-white/10 focus:border-indigo-500'}`}
                      onKeyDown={(e) => e.key === 'Enter' && handlePwdSubmit()}
                    />
                    {pwdError && <p className="text-xs text-rose-400 mt-1">Incorrect password</p>}
                    <button 
                      type="button"
                      onClick={handlePwdSubmit}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 text-white text-sm font-bold rounded-lg shadow-lg transition-all"
                    >
                      Unlock Setup
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    Branding Setup
                  </h3>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Brand Name</label>
                  <input 
                    type="text" 
                    value={brandName}
                    onChange={handleBrandNameChange}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Enter Brand Name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Headline 1</label>
                    <input 
                      type="text" 
                      value={heroTitle1}
                      onChange={handleHeroTitle1Change}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Unlock your"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Headline 2 (Gradient)</label>
                    <input 
                      type="text" 
                      value={heroTitle2}
                      onChange={handleHeroTitle2Change}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Digital Hub."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Subheadline</label>
                  <textarea 
                    value={heroSub}
                    onChange={handleHeroSubChange}
                    rows={3}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                    placeholder="Enter description text"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Form Title</label>
                    <input 
                      type="text" 
                      value={formTitle}
                      onChange={handleFormTitleChange}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Welcome back"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Form Subtitle</label>
                    <input 
                      type="text" 
                      value={formSubtitle}
                      onChange={handleFormSubtitleChange}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Please enter..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Brand Logo (Image)</label>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                    >
                      Upload Logo
                    </button>
                    {brandLogo && (
                      <button 
                        onClick={resetBranding}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                        title="Reset to default"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Background Image</label>
                  <input
                    type="file"
                    ref={backgroundInputRef}
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => backgroundInputRef.current?.click()}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                    >
                      Upload Background
                    </button>
                    {brandBackground && (
                      <button
                        onClick={() => {
                          setBrandBackground(null)
                          localStorage.removeItem('dev_brand_background')
                        }}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                        title="Clear background"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )}

    </div>
  )
}

export default LoginPage
