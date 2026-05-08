import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useAuth } from '../../core/auth/AuthProvider'
import { employeeSchema } from '../../core/validation/schemas'
import { fetchProfilesByCenter, updateProfile, createProfile } from '../../services/profileService'
import { adminCreateUser } from '../../services/authService'
import Modal          from '../../components/Modal'
import EmptyState     from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'

const EmployeeForm = ({ employee, centerId, onSave, onClose }) => {
  const isNew = !employee
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: { 
      full_name: employee?.full_name ?? '',
      phone: employee?.phone ?? '',
      role: employee?.role ?? 'employee',
      email: employee?.email ?? '', // Note: email usually comes from auth, but this form handles it for creation
      service_center_id: centerId
    },
  })

  const onSubmit = async (data) => {
    try {
      if (isNew) {
        const { user: newAuthUser } = await adminCreateUser({
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
          service_center_id: centerId,
        })
        
        if (newAuthUser) {
          await createProfile({
            id: newAuthUser.id,
            full_name: data.full_name,
            phone: data.phone,
            role: data.role,
            service_center_id: centerId,
            car_model: data.car_model,
            chassis_number: data.chassis_number
          })
        }
        toast.success('تم تسجيل الحساب بنجاح.')
      } else {
        await updateProfile(employee.id, { 
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
          car_model: data.car_model,
          chassis_number: data.chassis_number
        })
        toast.success('تم تحديث البيانات.')
      }
      onSave()
    } catch (err) {
      toast.error(err.message || 'حدث خطأ في التسجيل.')
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
      <div>
        <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1">الدور الوظيفي *</label>
        <select
          className="input-field shadow-sm"
          {...register('role', { required: true })}
        >
          <option value="client">عميل (Client)</option>
          <option value="employee">موظف (فني/عامل)</option>
          <option value="inventory_manager">مسؤول مخزن</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
        <div>
          <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1 font-bold text-primary-600">موديل السيارة</label>
          <input
            type="text"
            placeholder="مثال: مرسيدس E200"
            className="input-field shadow-sm border-primary-50"
            {...register('car_model')}
          />
        </div>
        <div>
          <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1 font-bold text-primary-600">رقم الشاسيه (VIN)</label>
          <input
            type="text"
            placeholder="أدخل رقم الشاسيه..."
            className="input-field shadow-sm border-primary-50"
            {...register('chassis_number')}
          />
        </div>
      </div>
      <div className="flex justify-start gap-3 pt-4 border-t border-slate-50">
        <button type="submit" disabled={isSubmitting} className="btn-primary px-8 font-black uppercase tracking-widest text-[11px]">
          {isSubmitting ? 'جاري الحفظ...' : (isNew ? 'تسجيل حساب جديد' : 'حفظ التعديلات')}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary px-6">إلغاء</button>
      </div>
    </form>
  )
}

const EmployeesPage = () => {
  const { profile } = useAuth()
  const centerId = profile?.service_center_id

  const [employees, setEmployees] = useState([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(null)
  const [creating, setCreating]   = useState(false)
  const [search, setSearch]       = useState('')

  const load = async () => {
    if (!centerId) { setLoading(false); return }
    try {
      const all = await fetchProfilesByCenter(centerId)
      setEmployees(all.filter(p => ['employee', 'inventory_manager', 'client'].includes(p.role)))
    } catch (err) {
      toast.error('Manifest load failure.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [centerId])

  const filtered = employees.filter(e =>
    !search || e.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
            <span className="w-8 h-[2px] bg-primary-600" />
            Human Resources
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Personnel Directory</h1>
          <p className="text-slate-400 mt-2 font-semibold flex items-center gap-2">
            Managing <span className="text-slate-900 font-black">{employees.length}</span> active operators in the node network.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group min-w-[240px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search directory..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 py-2.5 text-sm shadow-sm bg-white border-slate-100"
            />
          </div>
          <button onClick={() => setCreating(true)} className="btn-primary px-6 group flex items-center shrink-0">
            <svg className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            <span className="font-black uppercase tracking-widest text-[11px]">Add Operator</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Personnel Data</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center shadow-premium">
          <EmptyState title="Zero matches detected" message="No operators match your current parameters. Try adjusting the search." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(emp => (
            <div key={emp.id} className="bg-white rounded-[2rem] p-6 shadow-premium border border-slate-100 flex items-center gap-5 group hover:border-primary-100 transition-all duration-300">
              {/* Profile Orb */}
              <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-lg text-white font-black text-xl transition-transform group-hover:scale-105">
                {emp.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black text-slate-900 tracking-tight truncate leading-tight group-hover:text-primary-600 transition-colors">{emp.full_name ?? 'Undefined Operator'}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Active since {new Date(emp.created_at).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2 mt-3">
                   <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">Status: Active</span>
                   <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${emp.role === 'inventory_manager' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                     {emp.role === 'inventory_manager' ? 'Inventory' : 'Technical'}
                   </span>
                </div>
              </div>
              
              <button
                onClick={() => setEditing(emp)}
                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center justify-center shadow-sm border border-slate-100 group-hover:border-primary-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing || creating} title={creating ? "Register New Operator" : "Personnel Configuration"} onClose={() => { setEditing(null); setCreating(false) }}>
        {(editing || creating) && (
          <EmployeeForm
            employee={editing}
            centerId={centerId}
            onSave={() => { setEditing(null); setCreating(false); load() }}
            onClose={() => { setEditing(null); setCreating(false) }}
          />
        )}
      </Modal>
    </div>
  )
}

export default EmployeesPage
