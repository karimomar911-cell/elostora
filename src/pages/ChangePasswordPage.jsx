import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { changePasswordSchema } from '../core/validation/schemas'
import { useAuth } from '../core/auth/AuthProvider'
import { updatePassword } from '../services/authService'

const ChangePasswordPage = () => {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [showNew, setShowNew]           = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ 
    resolver: zodResolver(changePasswordSchema),
    mode: 'onBlur' 
  })

  const newPassword = watch('newPassword')

  const onSubmit = async (data) => {
    try {
      await updatePassword(data.newPassword)
      toast.success('Security protocols updated. Re-authentication required.')
      reset()
      setTimeout(() => logout(), 1500)
    } catch (err) {
      toast.error(err.message || 'Identity verification failed. Please retry.')
    }
  }

  const EyeToggle = ({ show, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-300 hover:text-primary-500 transition-colors"
      tabIndex={-1}
    >
      {show ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7 -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7 a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243 M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29 m7.532 7.532l3.29 3.29M3 3l3.59 3.59 m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7 a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
      )}
    </button>
  )

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
            <span className="w-8 h-[2px] bg-primary-600" />
            Security Shield
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Identity Management</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-premium border border-slate-100 p-8 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-lg text-white font-black text-2xl">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 tracking-tight">{profile?.full_name ?? 'Undefined User'}</p>
              <p className="text-xs font-black text-primary-500 uppercase tracking-widest mt-0.5">{profile?.role ?? 'Unauthorized'}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-premium border border-slate-100 p-8 space-y-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight border-b border-slate-50 pb-4">Cryptographic Update</h2>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
              <div>
                <label className="input-label">Current Matrix *</label>
                <div className="relative group">
                  <input
                    type="password"
                    placeholder="Input current sequence"
                    className={`input-field group-hover:border-slate-300 transition-colors ${errors.currentPassword ? 'border-rose-300' : ''}`}
                    {...register('currentPassword')}
                  />
                </div>
                {errors.currentPassword && <p className="input-error">{errors.currentPassword.message}</p>}
              </div>

              <div>
                <label className="input-label">New Credential Matrix *</label>
                <div className="relative group">
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="Input new sequence"
                    className={`input-field pr-12 group-hover:border-slate-300 transition-colors ${errors.newPassword ? 'border-rose-300' : ''}`}
                    {...register('newPassword')}
                  />
                  <EyeToggle show={showNew} onToggle={() => setShowNew(v => !v)} />
                </div>
                {errors.newPassword && <p className="input-error">{errors.newPassword.message}</p>}
              </div>

              <div>
                <label className="input-label">Validate Sequence *</label>
                <div className="relative group">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-input sequence"
                    className={`input-field pr-12 group-hover:border-slate-300 transition-colors ${errors.confirmPassword ? 'border-rose-300' : ''}`}
                    {...register('confirmPassword')}
                  />
                  <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
                </div>
                {errors.confirmPassword && <p className="input-error">{errors.confirmPassword.message}</p>}
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => navigate(-1)} disabled={isSubmitting} className="btn-secondary flex-1 py-3.5">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 py-3.5 font-black uppercase tracking-widest text-xs">
                  {isSubmitting ? 'Syncing...' : 'Update Shield'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Requirements & Info */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 blur-3xl rounded-full -mr-16 -mt-16" />
            <h3 className="text-sm font-black text-primary-400 uppercase tracking-[0.2em] mb-6">Complexity Requirements</h3>
            <ul className="space-y-4">
              {[
                { rule: (newPassword?.length ?? 0) >= 8, label: 'Minimum 8 Characters' },
                { rule: /[A-Z]/.test(newPassword ?? ''), label: 'Uppercase Character' },
                { rule: /[a-z]/.test(newPassword ?? ''), label: 'Lowercase Character' },
                { rule: /\d/.test(newPassword ?? ''),    label: 'Numerical Digit' },
                { rule: !!newPassword && newPassword === watch('confirmPassword'), label: 'Sequence Congruence' },
              ].map(({ rule, label }) => (
                <li key={label} className="flex items-center gap-4 group">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-500 ${rule ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/10'}`}>
                    {rule && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`text-xs font-bold tracking-tight transition-colors ${rule ? 'text-white' : 'text-slate-500'}`}>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200/50 rounded-3xl p-6 flex items-start gap-4">
            <div className="p-2 rounded-xl bg-white shadow-sm text-amber-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <p className="text-xs font-black text-amber-900 uppercase tracking-widest mb-1">Notice</p>
              <p className="text-xs font-semibold text-amber-700/80 leading-relaxed">Updating security credentials will terminate all active sessions. You must re-authenticate with the new matrix immediately.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordPage
