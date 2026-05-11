import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { adminCreateUser } from '../../services/authService'
import { fetchProfilesByCenter, createProfile, updateProfile } from '../../services/profileService'
import { fetchInvoicesByClient } from '../../services/invoiceService'
import { upsertCar, createCar, fetchCarsByClient, fetchCarByChassis } from '../../services/carService'
import Modal          from '../../components/Modal'
import EmptyState     from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

const ClientForm = ({ client, centerId, onSave, onClose }) => {
  const isNew = !client
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      full_name: client?.full_name ?? '',
      phone: client?.phone ?? '',
    }
  })

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
              {...register('email', { required: 'البريد الإلكتروني مطلوب.' })}
            />
          </div>
          <div>
            <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1">كلمة المرور المبدئية *</label>
            <input
              type="password"
              className={`input-field shadow-sm ${errors.password ? 'border-rose-400' : ''}`}
              {...register('password', { required: 'كلمة المرور مطلوبة.', minLength: 6 })}
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
            {...register('full_name', { required: 'الاسم مطلوب.' })}
          />
        </div>
        <div>
          <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1">رقم التليفون *</label>
          <input
            type="tel"
            className={`input-field shadow-sm ${errors.phone ? 'border-rose-400' : ''}`}
            {...register('phone', { required: 'رقم التليفون مطلوب.' })}
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
              {...register('chassis_number', { required: 'رقم الشاسيه مطلوب.' })}
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
        toast.error('Failed to load invoices.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [client.id])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
        <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
          <span className="text-yellow-700 font-bold text-xl">
            {client.full_name?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg">{client.full_name}</p>
          <p className="text-sm text-gray-400">
            Client since {new Date(client.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Invoice History ({invoices.length})
        </h3>
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : invoices.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No invoices yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {invoices.map(inv => (
              <div key={inv.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                <div>
                  <p className="font-medium text-gray-800">{inv.car_model ?? '—'}</p>
                  <p className="text-gray-400 text-xs">
                    {inv.service_date
                      ? new Date(inv.service_date).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
                <span className="font-semibold text-gray-900">
                  ${parseFloat(inv.final_price || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={onClose} className="btn-secondary">Close</button>
      </div>
    </div>
  )
}

const EmployeeClientsPage = () => {
  const { profile } = useAuth()
  const centerId = profile?.service_center_id

  const [clients, setClients]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing]   = useState(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch]     = useState('')

  const load = async () => {
    try {
      const all = await fetchProfilesByCenter(centerId)
      setClients(all.filter(p => p.role === 'client'))
    } catch {
      toast.error('Failed to load clients.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!centerId) { setLoading(false); return }
    load()
  }, [centerId])

  const filtered = clients.filter(c =>
    !search || c.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header flex justify-between items-end">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">
            {clients.length} client{clients.length !== 1 ? 's' : ''} in your center
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Client
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field max-w-xs"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState title="No clients found" message="No clients are assigned to your center yet." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(client => (
            <div
              key={client.id}
              className="card-hover flex items-center gap-4 group"
            >
              <div 
                className="flex flex-1 items-center gap-4 cursor-pointer min-w-0"
                onClick={() => setSelected(client)}
              >
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-700 font-bold text-lg">
                    {client.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-gray-900 truncate">{client.full_name ?? '—'}</p>
                  <p className="text-xs text-gray-400">
                    Since {new Date(client.created_at).toLocaleDateString()}
                  </p>
                  <span className="badge badge-yellow mt-1">Client</span>
                </div>
              </div>
              
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(client) }}
                className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              
              <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!selected || creating || !!editing}
        title={creating ? "تسجيل عميل جديد" : (editing ? "تعديل بيانات العميل" : "تفاصيل العميل")}
        onClose={() => { setSelected(null); setCreating(false); setEditing(null) }}
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

export default EmployeeClientsPage
