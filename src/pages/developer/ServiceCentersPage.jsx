import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { fetchServiceCenters, createServiceCenter, updateServiceCenter, deleteServiceCenter, uploadLogo } from '../../services/centerService'
import { useAuth }           from '../../core/auth/AuthProvider'
import Modal                 from '../../components/Modal'
import ConfirmDialog         from '../../components/ConfirmDialog'
import EmptyState            from '../../components/EmptyState'
import LoadingSpinner         from '../../components/LoadingSpinner'

const CenterForm = ({ center, onSave, onClose }) => {
  const { user, loadProfile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState(center?.logo_url ?? null)
  const fileRef = useRef()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: center?.name ?? '' },
  })

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data) => {
    try {
      let logoUrl = center?.logo_url ?? null
      const file  = fileRef.current?.files?.[0]

      if (center) {
        if (file) {
          setUploading(true)
          logoUrl = await uploadLogo(file, center.id)
          setUploading(false)
        }
        await updateServiceCenter(center.id, { name: data.name, logo_url: logoUrl })
        toast.success('Node configuration updated.')
      } else {
        const created = await createServiceCenter({ name: data.name })
        if (file) {
          setUploading(true)
          logoUrl = await uploadLogo(file, created.id)
          setUploading(false)
          await updateServiceCenter(created.id, { logo_url: logoUrl })
        }
        toast.success('New node established.')
      }
      
      // Refresh global profile to update Sidebar/Topbar branding
      if (user?.id) await loadProfile(user.id)
      
      onSave()
    } catch (err) {
      setUploading(false)
      toast.error(err.message || 'Transmission failure.')
    }
  }

  const busy = isSubmitting || uploading

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <label className="input-label text-[10px] uppercase tracking-[0.2em]">Node Identifier *</label>
        <input
          type="text"
          className={`input-field shadow-sm ${errors.name ? 'border-rose-400' : ''}`}
          placeholder="e.g. Global Tech Center"
          {...register('name', { required: 'Identifier is mandatory.' })}
        />
        {errors.name && <p className="input-error">{errors.name.message}</p>}
      </div>

      <div>
        <label className="input-label text-[10px] uppercase tracking-[0.2em]">Visual Signature (Logo)</label>
        <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-3xl border border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
            {logoPreview ? (
              <img src={logoPreview} alt="Signature" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14 m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            )}
          </div>
          <div className="flex-1">
            <input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} className="hidden" id="logo-upload" />
            <label htmlFor="logo-upload" className="btn-secondary py-2 px-4 text-xs font-black uppercase tracking-widest cursor-pointer inline-block mb-2">
              {uploading ? 'Processing Signature...' : 'Select Signature'}
            </label>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Format: PNG, JPG (Max 2MB)</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
        <button type="button" onClick={onClose} disabled={busy} className="btn-secondary px-8">Abort</button>
        <button type="submit" disabled={busy} className="btn-primary px-10 font-black uppercase tracking-widest text-xs">
          {busy ? 'Syncing Node...' : center ? 'Update Node' : 'Establish Node'}
        </button>
      </div>
    </form>
  )
}

const ServiceCentersPage = () => {
  const [centers, setCenters]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]   = useState(false)

  const load = async () => {
    try {
      const data = await fetchServiceCenters()
      setCenters(data)
    } catch (err) {
      toast.error('Global directory sync failure.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit   = (c) => { setEditing(c);   setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const handleSaved = () => { closeModal(); load() }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteServiceCenter(deleteTarget.id)
      toast.success('Node terminated.')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Decommissioning failed.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
            <span className="w-8 h-[2px] bg-primary-600" />
            Infrastructure Control
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Node Network</h1>
          <p className="text-slate-400 mt-2 font-semibold flex items-center gap-2">
            Overseeing <span className="text-slate-900 font-black">{centers.length}</span> active service centers in the system.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary px-8 group">
          <svg className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          <span className="font-black uppercase tracking-widest text-[11px]">Add New Node</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Global Infrastructure</p>
        </div>
      ) : centers.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center shadow-premium">
          <EmptyState title="No nodes detected" message="Your network is empty. Initialize the first service center to begin operations." action={<button onClick={openCreate} className="btn-primary mt-6">Establish Initial Node</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {centers.map((center) => (
            <div key={center.id} className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-slate-100 group hover:border-primary-100 transition-all duration-500">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-500">
                  {center.logo_url ? (
                    <img src={center.logo_url} alt={center.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 font-black text-3xl group-hover:text-primary-600 transition-colors">
                      {center.name?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-2">
                  <p className="text-xl font-black text-slate-900 tracking-tight truncate leading-tight group-hover:text-primary-600 transition-colors">{center.name}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                    Node established: {new Date(center.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                     <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">Status: Operational</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-slate-50">
                <button onClick={() => openEdit(center)} className="flex-1 btn-secondary py-3 text-[10px] font-black uppercase tracking-widest border-slate-100">Configure</button>
                <button onClick={() => setDeleteTarget(center)} className="w-12 h-12 rounded-xl bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center border border-slate-100 hover:border-rose-100">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="Node System Configuration" onClose={closeModal}>
        <CenterForm center={editing} onSave={handleSaved} onClose={closeModal} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Terminate Node"
        message={`Warning: You are about to decommission "${deleteTarget?.name}". This protocol is irreversible. Continue?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}

export default ServiceCentersPage
