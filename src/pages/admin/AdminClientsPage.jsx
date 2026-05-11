import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useAuth } from '../../core/auth/AuthProvider'
import { clientSchema } from '../../core/validation/schemas'
import { adminCreateUser } from '../../services/authService'
import { fetchProfilesByCenter, createProfile, updateProfile } from '../../services/profileService'
import { fetchInvoicesByClient } from '../../services/invoiceService'
import { upsertCar, createCar, fetchCarsByClient, fetchCarByChassis } from '../../services/carService'
import Modal          from '../../components/Modal'
import EmptyState     from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'

const ClientForm = ({ client, centerId, onSave, onClose }) => {
  const isNew = !client
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      full_name: client?.full_name ?? '',
      phone: client?.phone ?? '',
    }
  })

  // Load car data if editing
  useEffect(() => {
    if (!isNew) {
      const loadCar = async () => {
        try {
          const cars = await fetchCarsByClient(client.id)
          if (cars && cars.length > 0) {
            const firstCar = cars[0]
            setValue('chassis_number', firstCar.chassis_number)
            setValue('plate_number', firstCar.plate_number)
            setValue('car_model', firstCar.car_model)
          }
        } catch (err) {
          console.error('Failed to load car data:', err)
        }
      }
      loadCar()
    }
  }, [isNew, client, setValue])

  const onSubmit = async (data) => {
    try {
      const chassisNumber = data.chassis_number?.trim()
      let clientId = client?.id

      if (chassisNumber) {
        const existingCar = await fetchCarByChassis(chassisNumber)
        if (existingCar && existingCar.client_id !== clientId) {
          const ownerName = existingCar.profiles?.full_name || existingCar.client_id
          throw new Error(`رقم الشاسيه ${chassisNumber} موجود بالفعل لدى العميل ${ownerName}.`)
        }
      }

      if (isNew) {
        // Check if email already exists in the system
        const existingProfiles = await fetchProfilesByCenter(centerId)
        const emailExists = existingProfiles.some(p => p.email === data.email && p.role === 'client')
        
        let newAuthUser = null
        if (!emailExists) {
          // Create new auth user only if email doesn't exist
          const authResult = await adminCreateUser({
            email: data.email,
            password: data.password,
            full_name: data.full_name,
            phone: data.phone,
            role: 'client',
            service_center_id: centerId,
          })
          newAuthUser = authResult.user
        } else {
          // Email exists, find the existing user
          const existingUser = existingProfiles.find(p => p.email === data.email && p.role === 'client')
          if (existingUser) {
            clientId = existingUser.id
            console.log(`ℹ️ استخدام المستخدم الموجود: ${existingUser.full_name}`)
          } else {
            throw new Error('المستخدم موجود لكن لم يتمكن من العثور عليه')
          }
        }
        
        if (newAuthUser) {
          clientId = newAuthUser.id
          await createProfile({
            id: clientId,
            full_name: data.full_name,
            phone: data.phone,
            role: 'client',
            service_center_id: centerId,
            email: data.email,
          })
        }
      } else {
        await updateProfile(client.id, {
          full_name: data.full_name,
          phone: data.phone,
        })
      }

      if (clientId && chassisNumber) {
        if (isNew) {
          await createCar({
            chassis_number: chassisNumber,
            plate_number: data.plate_number,
            car_model: data.car_model,
            client_id: clientId
          })
        } else {
          await upsertCar({
            chassis_number: chassisNumber,
            plate_number: data.plate_number,
            car_model: data.car_model,
            client_id: clientId
          })
        }
      }

      toast.success(isNew ? 'تم تسجيل العميل بنجاح.' : 'تم تحديث بيانات العميل.')
      onSave()
    } catch (err) {
      const message = err.message || ''
      if (message.includes('already registered') || message.includes('already exists') || message.includes('duplicate')) {
        toast.error('هذا البريد الإلكتروني مرتبط بعميل موجود بالفعل. جرب إضافة شاسيه مختلف أو بريد إلكتروني جديد.')
      } else if (message.includes('رقم الشاسيه')) {
        // Chassis number error - pass it through
        toast.error(message)
      } else {
        toast.error(message || 'حدث خطأ أثناء العملية.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
      {isNew && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1">البريد الإلكتروني *</label>
            <input
              type="email"
              className={`input-field shadow-sm ${errors.email ? 'border-rose-400' : ''}`}
              {...register('email')}
            />
          </div>
          <div>
            <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1">كلمة المرور المبدئية *</label>
            <input
              type="password"
              className={`input-field shadow-sm ${errors.password ? 'border-rose-400' : ''}`}
              {...register('password')}
            />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1">الاسم بالكامل *</label>
          <input
            type="text"
            className={`input-field shadow-sm ${errors.full_name ? 'border-rose-400' : ''}`}
            {...register('full_name')}
          />
        </div>
        <div>
          <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1">رقم التليفون *</label>
          <input
            type="tel"
            className={`input-field shadow-sm ${errors.phone ? 'border-rose-400' : ''}`}
            {...register('phone')}
          />
        </div>
      </div>

      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
        <h3 className="text-xs font-black text-primary-600 mb-2">بيانات السيارة</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label text-[10px] uppercase block mb-1">رقم الشاسيه *</label>
            <input
              type="text"
              className={`input-field shadow-sm ${errors.chassis_number ? 'border-rose-400' : ''}`}
              {...register('chassis_number')}
            />
          </div>
          <div>
            <label className="input-label text-[10px] uppercase block mb-1">رقم اللوحة</label>
            <input
              type="text"
              className="input-field shadow-sm"
              {...register('plate_number')}
            />
          </div>
        </div>
        <div>
          <label className="input-label text-[10px] uppercase block mb-1">نوع السيارة</label>
          <input
            type="text"
            className="input-field shadow-sm"
            {...register('car_model')}
          />
        </div>
      </div>

      <div className="flex justify-start gap-3 pt-6 border-t border-slate-50">
        <button type="submit" disabled={isSubmitting} className="btn-primary px-10 font-black tracking-widest text-xs">
          {isSubmitting ? 'جاري الحفظ...' : (isNew ? 'تسجيل عميل جديد' : 'حفظ التعديلات')}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary px-8">إلغاء</button>
      </div>
    </form>
  )
}

const ClientDetailModal = ({ client, onClose }) => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchInvoicesByClient(client.id)
        setInvoices(data)
      } catch {
        toast.error('Manifest load failure for client records.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [client.id])

  return (
    <div className="space-y-8">
      {/* Identity Profile */}
      <div className="flex items-center gap-6 p-6 bg-slate-900 rounded-[2rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
        <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10 backdrop-blur-md shadow-inner">
          <span className="text-white font-black text-3xl">
            {client.full_name?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
        </div>
        <div className="relative z-10">
          <p className="text-2xl font-black text-white tracking-tighter leading-tight">{client.full_name}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">Client</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Established: {new Date(client.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Operation Logs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Technical Ledger History</h3>
          <span className="text-[10px] font-black text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">{invoices.length} entries</span>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <LoadingSpinner size="sm" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Retrieving Logs</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-slate-50 rounded-3xl p-12 text-center border border-slate-100">
             <p className="text-xs font-bold text-slate-400">Zero operation logs detected for this identity.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[1.5rem] hover:border-primary-100 transition-all shadow-sm group">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                   </div>
                   <div>
                      <p className="text-sm font-black text-slate-900 tracking-tight leading-tight">{inv.car_model ?? 'Unknown Asset'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        {inv.service_date ? new Date(inv.service_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-sm font-black text-slate-900 tracking-tighter">${parseFloat(inv.final_price || 0).toLocaleString()}</p>
                   <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Settled</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-50">
        <button onClick={onClose} className="btn-secondary px-8">Close Manifest</button>
      </div>
    </div>
  )
}

const AdminClientsPage = () => {
  const { profile } = useAuth()
  const centerId = profile?.service_center_id

  const [clients, setClients]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing]   = useState(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch]     = useState('')

  const load = async () => {
    if (!centerId) { setLoading(false); return }
    try {
      const all = await fetchProfilesByCenter(centerId)
      setClients(all.filter(p => p.role === 'client'))
    } catch (err) {
      toast.error('Identity database sync failure.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [centerId])

  const filtered = clients.filter(c =>
    !search || c.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
            <span className="w-8 h-[2px] bg-primary-600" />
            Client Management
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Identity Database</h1>
          <p className="text-slate-400 mt-2 font-semibold flex items-center gap-2">
            Overseeing <span className="text-slate-900 font-black">{clients.length}</span> verified customer accounts.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group min-w-[240px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Scan identities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 py-2.5 text-sm shadow-sm bg-white border-slate-100"
            />
          </div>
          <button onClick={() => setCreating(true)} className="btn-primary px-6 group flex items-center shrink-0">
            <svg className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            <span className="font-black uppercase tracking-widest text-[11px]">Add Client</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Identity Stream</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center shadow-premium">
          <EmptyState title="Null response" message="Adjust your parameters. No identities matching those specifications were found." />
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-premium border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Identity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(client => (
                  <tr key={client.id} className="hover:bg-slate-50/30 transition-all group/row">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-lg text-white font-black text-lg group-hover/row:scale-110 transition-transform">
                          {client.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                           <span className="text-base font-black text-slate-900 tracking-tight block leading-tight">{client.full_name ?? 'Undefined identity'}</span>
                           <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest mt-1 inline-block">Verified Client</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                         {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right flex justify-end gap-2">
                      <button
                        onClick={() => setSelected(client)}
                        className="btn-secondary py-2 px-5 text-xs font-black uppercase tracking-widest border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
                      >
                        السجل
                      </button>
                      <button
                        onClick={() => setEditing(client)}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center justify-center shadow-sm border border-slate-100"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!selected || creating || !!editing}
        title={creating ? "تسجيل عميل جديد" : (editing ? "تعديل بيانات العميل" : "تحليل الهوية")}
        onClose={() => { setSelected(null); setCreating(false); setEditing(null) }}
        size="md"
      >
        {(creating || editing) && (
          <ClientForm 
            client={editing} 
            centerId={centerId} 
            onSave={() => { setCreating(false); setEditing(null); load() }} 
            onClose={() => { setCreating(false); setEditing(null) }} 
          />
        )}
        {selected && (
          <ClientDetailModal client={selected} onClose={() => setSelected(null)} />
        )}
      </Modal>
    </div>
  )
}

export default AdminClientsPage
