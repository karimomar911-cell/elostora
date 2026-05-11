import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { fetchAllProfiles, updateProfile, createProfile, deleteProfileWithCleanup } from '../../services/profileService'
import { useAuth } from '../../context/AuthContext'
import { fetchServiceCenters } from '../../services/centerService'
import Modal          from '../../components/Modal'
import EmptyState     from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import ConfirmDialog  from '../../components/ConfirmDialog'
import { factoryResetSystem } from '../../services/resetService'

const ROLE_CONFIG = {
  developer: { badge: 'bg-slate-900 text-white', label: 'Systems Dev' },
  admin:     { badge: 'bg-indigo-50 text-indigo-600 border-indigo-100', label: 'Node Admin' },
  employee:  { badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Operator' },
  client:    { badge: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Client' },
}

import { adminCreateUser } from '../../services/authService'
import { upsertCar, fetchCarsByClient } from '../../services/carService'

const UserForm = ({ user, centers, onSave, onClose }) => {
  const { setProfile, profile: currentAuthProfile } = useAuth()
  const isNew = !user
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      email:             '',
      password:          '',
      full_name:         user?.full_name ?? '',
      phone:             user?.phone ?? '',
      role:              user?.role ?? 'client',
      service_center_id: user?.service_center_id ?? '',
      chassis_number:    '',
      plate_number:      '',
      car_model:         '',
    },
  })

  // Reset form when user prop changes (important if Modal stays mounted)
  useEffect(() => {
    if (user) {
      reset({
        full_name:         user.full_name ?? '',
        phone:             user.phone ?? '',
        role:              user.role ?? 'client',
        service_center_id: user.service_center_id ?? '',
        chassis_number:    user.chassis_number ?? '',
        car_model:         user.car_model ?? '',
      })
    }
  }, [user, reset])

  const selectedRole = watch('role')

  const onSubmit = async (data) => {
    try {
      if (isNew) {
        // Create user in Auth
        const { user: newAuthUser } = await adminCreateUser({
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
          service_center_id: data.service_center_id || null,
        })
        
        // Create profile row manually since no trigger exists
        if (newAuthUser) {
          await createProfile({
            id: newAuthUser.id,
            full_name: data.full_name,
            phone: data.phone,
            role: data.role,
            service_center_id: data.service_center_id || null,
            car_model:         data.car_model,
            chassis_number:    data.chassis_number,
          })

          // Register car if client
          if (data.role === 'client' && data.chassis_number) {
            await upsertCar({
              chassis_number: data.chassis_number,
              plate_number: data.plate_number,
              car_model: data.car_model,
              client_id: newAuthUser.id
            })
          }

        }
        toast.success('تم إنشاء المستخدم بنجاح.')
      } else {
        const updated = await updateProfile(user.id, {
          full_name:         data.full_name,
          phone:             data.phone,
          role:              data.role,
          service_center_id: data.service_center_id || null,
          car_model:         data.car_model,
          chassis_number:    data.chassis_number,
        })

        toast.success('تم تحديث بيانات المستخدم.')
      }
      
      // Small delay to ensure DB consistency before reload
      setTimeout(() => onSave(), 300)
    } catch (err) {
      toast.error(err.message || 'حدث خطأ أثناء المعالجة.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" dir="rtl">
      <div className="space-y-6">
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
            {errors.full_name && <p className="input-error">{errors.full_name.message}</p>}
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1">الدور الوظيفي *</label>
            <select
              className={`input-field shadow-sm ${errors.role ? 'border-rose-400' : ''}`}
              {...register('role', { required: 'الدور مطلوب.' })}
            >
              <option value="client">عميل</option>
              <option value="employee">موظف</option>
              <option value="inventory_manager">مسؤول مخزن</option>
              <option value="admin">مدير فرع</option>
              <option value="developer">مطور النظام</option>
            </select>
          </div>

          <div>
            <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1">الفرع التابع له</label>
            <select className="input-field" {...register('service_center_id')}>
              <option value="">— بدون فرع —</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedRole === 'client' && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
            <h3 className="text-xs font-black text-primary-600 mb-2">بيانات السيارة</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label text-[10px] uppercase block mb-1">رقم الشاسيه *</label>
                <input
                  type="text"
                  className={`input-field shadow-sm ${errors.chassis_number ? 'border-rose-400' : ''}`}
                  {...register('chassis_number', { required: 'رقم الشاسيه مطلوب' })}
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
        )}
      </div>

      <div className="flex justify-start gap-3 pt-6 border-t border-slate-50">
        <button type="submit" disabled={isSubmitting} className="btn-primary px-10 font-black tracking-widest text-xs">
          {isSubmitting ? 'جاري الحفظ...' : (isNew ? 'تسجيل جديد' : 'تحديث البيانات')}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary px-8">إلغاء</button>
      </div>
    </form>
  )
}

const UsersPage = () => {
  const [users, setUsers]         = useState([])
  const [centers, setCenters]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(null)
  const [creating, setCreating]   = useState(false)
  const [filterRole, setFilterRole] = useState('all')
  const [search, setSearch]       = useState('')

  const [isResetting, setIsResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleSingleDelete = async () => {
    if (!deleteTarget) return
    
    if (deleteTarget.id === user.id) {
      toast.error('Protocol Violation: You cannot terminate your own active identity.')
      setDeleteTarget(null)
      return
    }

    setDeleting(true)
    try {
      await deleteProfileWithCleanup(deleteTarget.id)
      toast.success('Identity successfully purged. Data preserved in history.')
      setDeleteTarget(null)
      load()
    } catch (err) {
      console.error('Delete error:', err)
      toast.error(err.message || "Protocol Failure: System security policy blocked this operation.")
    } finally {
      setDeleting(false)
    }
  }

  const { user } = useAuth()

  const handleFactoryReset = async () => {
    setIsResetting(true)
    try {
      await factoryResetSystem(user?.id)
      toast.success('System purged successfully. Refreshing...')
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsResetting(false)
      setShowResetConfirm(false)
    }
  }

  const load = async () => {
    try {
      const [usersData, centersData] = await Promise.all([
        fetchAllProfiles(),
        fetchServiceCenters(),
      ])
      setUsers(usersData)
      setCenters(centersData)
    } catch (err) {
      toast.error('Identity manifest load failure.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = users.filter((u) => {
    const matchRole = filterRole === 'all' || u.role === filterRole
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
            <span className="w-8 h-[2px] bg-primary-600" />
            System Hierarchy
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Identity Master-List</h1>
          <p className="text-slate-400 mt-2 font-semibold flex items-center gap-2">
            Managing <span className="text-slate-900 font-black">{users.length}</span> profiles across the unified network.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowResetConfirm(true)} 
            className="btn-secondary px-6 bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white transition-all group"
          >
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            <span className="font-black uppercase tracking-widest text-[10px]">Factory Settings</span>
          </button>
          <button onClick={() => setCreating(true)} className="btn-primary px-8 group">
            <svg className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            <span className="font-black uppercase tracking-widest text-[11px]">Add Identity</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-2 bg-slate-50/50 rounded-3xl border border-slate-100 backdrop-blur-sm shadow-inner w-full sm:w-fit">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            placeholder="Scan identities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 py-2 text-xs shadow-sm bg-white border-none w-full sm:min-w-[240px]"
          />
        </div>
        
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="input-field py-2 text-xs font-black uppercase tracking-widest border-none bg-white shadow-sm cursor-pointer"
        >
          <option value="all">Global Scope</option>
          <option value="developer">Developers</option>
          <option value="admin">Administrators</option>
          <option value="employee">Operations</option>
          <option value="client">Clients</option>
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Unified Identity Stream</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center shadow-premium">
          <EmptyState title="Null result" message="No identities found in the current scope. Try broadening your parameters." />
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-premium border border-slate-100 overflow-hidden group">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator Identity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Level</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Node</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/30 transition-all group/row">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-lg text-white font-black text-lg group-hover/row:scale-110 transition-transform">
                          {user.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <span className="text-base font-black text-slate-900 tracking-tight leading-tight block">{user.full_name ?? 'Undefined Operator'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${ROLE_CONFIG[user.role]?.badge ?? 'bg-slate-50 text-slate-400'}`}>
                        {ROLE_CONFIG[user.role]?.label ?? user.role}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${user.service_centers?.name ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                         <span className="text-xs font-bold text-slate-500 tracking-tight">{user.service_centers?.name ?? 'Headquarters'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditing(user)}
                          className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center justify-center shadow-sm border border-slate-100 group-hover/row:border-primary-100"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center shadow-sm border border-slate-100 group-hover/row:border-rose-100"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!editing || creating} title={creating ? "Establish Identity" : "Identity Access Configuration"} onClose={() => { setEditing(null); setCreating(false) }}>
        {(editing || creating) && (
          <UserForm
            user={editing}
            centers={centers}
            onSave={() => { setEditing(null); setCreating(false); load() }}
            onClose={() => { setEditing(null); setCreating(false) }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={showResetConfirm}
        title="⚠️ WARNING: NUCLEAR OPTION ⚠️"
        message="This will PERMANENTLY ERASE all Inventory, Invoices, Service Centers, and Users from the database. This action cannot be undone. Are you absolutely sure?"
        onConfirm={handleFactoryReset}
        onCancel={() => setShowResetConfirm(false)}
        confirmText={isResetting ? "Purging System..." : "Yes, WIPE ALL DATA"}
        danger={true}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Protocol: Terminate Identity"
        message={`Are you sure you want to permanently delete "${deleteTarget?.full_name}"? This action cannot be reversed.`}
        onConfirm={handleSingleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        danger={true}
      />
    </div>
  )
}

export default UsersPage
