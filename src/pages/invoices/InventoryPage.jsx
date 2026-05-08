import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useAuth } from '../../core/auth/AuthProvider'
import { inventorySchema } from '../../core/validation/schemas'
import { 
  fetchInventory, 
  addInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem,
  bulkAddInventoryItems 
} from '../../services/inventoryService'
import { fetchInventoryLogs } from '../../services/inventoryLogService'
import { formatCurrency } from '../../utils/invoiceUtils'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const InventoryItemForm = ({ item, onSave, onClose, profile }) => {
  const isNew = !item
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: item?.name ?? '',
      sku: item?.sku ?? '',
      quantity: item?.quantity ?? 0,
      unit_price: item?.unit_price ?? 0,
      condition: item?.condition ?? 'new',
      location: item?.location ?? '',
      service_center_id: profile?.service_center_id
    }
  })

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        quantity: parseInt(data.quantity),
        unit_price: parseFloat(data.unit_price),
      }

      if (isNew) {
        await addInventoryItem(payload, profile)
        toast.success('تم إضافة القطعة للمخزن العالمي.')
      } else {
        await updateInventoryItem(item.id, payload, profile)
        toast.success('تم تحديث بيانات القطعة.')
      }
      onSave()
    } catch (err) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1">اسم القطعة *</label>
          <input
            className={`input-field shadow-sm ${errors.name ? 'border-rose-400' : ''}`}
            {...register('name')}
          />
          {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1">الباركود / SKU</label>
          <input className="input-field shadow-sm" {...register('sku')} />
        </div>
        <div>
          <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1">الكمية المتوفرة *</label>
          <input
            type="number"
            className="input-field shadow-sm"
            {...register('quantity')}
          />
        </div>
        <div>
          <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1">سعر الوحدة *</label>
          <input
            type="number"
            step="0.01"
            className="input-field shadow-sm"
            {...register('unit_price')}
          />
        </div>
        <div>
          <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1">الحالة *</label>
          <select className="input-field shadow-sm" {...register('condition')}>
            <option value="new">جديد (New)</option>
            <option value="used">مستعمل (Used)</option>
          </select>
        </div>
        <div>
          <label className="input-label text-[10px] uppercase tracking-[0.2em] block mb-1">مكان التخزين</label>
          <input 
            placeholder="مثال: رف A1"
            className="input-field shadow-sm" 
            {...register('location')} 
          />
        </div>
      </div>
      <div className="flex justify-start gap-3 pt-6 border-t border-slate-50">
        <button type="submit" disabled={isSubmitting} className="btn-primary px-10 font-black tracking-widest text-xs">
          {isSubmitting ? 'جاري الحفظ...' : (isNew ? 'إضافة للمخزن' : 'تحديث البيانات')}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary px-8">إلغاء</button>
      </div>
    </form>
  )
}

const InventoryPage = () => {
  const { profile, role } = useAuth()
  const [items, setItems] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')

  const centerId = profile?.service_center_id
  const canManage = ['developer', 'admin', 'inventory_manager'].includes(role)

  const load = async () => {
    try {
      const data = await fetchInventory()
      setItems(data)
    } catch (err) {
      console.error('Inventory Load Error:', err)
      toast.error(`فشل تحميل المخزن: ${err.message || 'خطأ غير معروف'}`)
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    try {
      const data = await fetchInventoryLogs()
      setLogs(data)
      setIsLogOpen(true)
    } catch (err) {
      console.error('Log Load Error:', err)
      toast.error(`فشل تحميل السجل: ${err.message || 'خطأ غير معروف'}`)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    try {
      await deleteInventoryItem(deleteTarget.id)
      toast.success('تم حذف القطعة بنجاح.')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error('فشل في الحذف.')
    }
  }

  const [templateUri, setTemplateUri] = useState('')

  useEffect(() => {
    // Generate the template as a real Excel Blob for maximum compatibility
    const prepareTemplate = () => {
      try {
        const XLSX = window.XLSX
        if (!XLSX) return

        const templateData = [
          {
            'اسم القطعة (Name)': 'تيل فرامل أمامي',
            'الباركود (SKU)': 'BRK-001',
            'الكمية (Quantity)': 10,
            'السعر (Price)': 1500.00,
            'الحالة (Condition)': 'new',
            'مكان التخزين (Location)': 'Shelf A1'
          }
        ]
        const ws = XLSX.utils.json_to_sheet(templateData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        
        // Write to array buffer then to blob
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        setTemplateUri(URL.createObjectURL(blob))
      } catch (err) {
        console.error('Template gen error:', err)
      }
    }
    
    // Give library time to load
    const timer = setTimeout(prepareTemplate, 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const toastId = toast.loading('جاري تحليل الملف...')
      try {
        const dataBuffer = evt.target.result
        const wb = window.XLSX.read(dataBuffer, { type: 'array' }) // 'array' works for both Excel and CSV
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = window.XLSX.utils.sheet_to_json(ws, { header: 1 })
        
        if (data.length < 2) {
          toast.error('لم نتمكن من العثور على بيانات صالحة في الملف.', { id: toastId })
          return
        }

        const headers = data[0].map(h => h?.toString().toLowerCase().trim() || '')
        const findIndex = (terms) => headers.findIndex(h => terms.some(t => h.includes(t.toLowerCase())))

        const idx = {
          name: findIndex(['name', 'اسم', 'item', 'قطعة', 'صنف']),
          sku: findIndex(['sku', 'باركود', 'كود', 'code', 'رقم']),
          qty: findIndex(['qty', 'quantity', 'كمية', 'عدد', 'stock']),
          price: findIndex(['price', 'سعر', 'cost', 'ثمن', 'value']),
          cond: findIndex(['cond', 'حالة', 'نوع', 'حاله']),
          loc: findIndex(['loc', 'مكان', 'موقع', 'رف', 'shelf'])
        }

        if (idx.name === -1) {
          toast.error('لم نتمكن من العثور على عمود "الاسم" أو "Name".', { id: toastId })
          return
        }

        const itemsToImport = data.slice(1).map(row => {
          const name = row[idx.name]
          if (!name) return null

          const condStr = (idx.cond !== -1 ? row[idx.cond] : 'new')?.toString().toLowerCase() || 'new'
          
          return {
            name: name.toString().trim(),
            sku: idx.sku !== -1 ? row[idx.sku]?.toString().trim() : '',
            quantity: idx.qty !== -1 ? (parseInt(row[idx.qty]) || 0) : 0,
            unit_price: idx.price !== -1 ? (parseFloat(row[idx.price]) || 0) : 0,
            condition: condStr.includes('used') || condStr.includes('مستعمل') ? 'used' : 'new',
            location: idx.loc !== -1 ? row[idx.loc]?.toString().trim() : '',
            service_center_id: centerId
          }
        }).filter(item => item !== null)

        if (itemsToImport.length === 0) {
          toast.error('لا توجد بيانات صالحة للاستيراد.', { id: toastId })
          return
        }

        await bulkAddInventoryItems(itemsToImport, profile)
        toast.success(`تم استيراد ${itemsToImport.length} قطعة بنجاح!`, { id: toastId })
        load()
      } catch (err) {
        console.error('Full Import Error:', err)
        toast.error(`خطأ: ${err.message || 'فشل في قراءة الملف'}`, { id: toastId })
      }
    }
    
    reader.onerror = (err) => {
      toast.error('حدث خطأ أثناء قراءة الملف من جهازك.')
      console.error('File Reader Error:', err)
    }

    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="animate-fade-in space-y-8" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
            إدارة المخزون والقطع
            <span className="w-8 h-[2px] bg-primary-600" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">المخزن</h1>
          <p className="text-slate-500 mt-2 font-semibold">
            {items.length} قطعة مسجلة في النظام
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <a 
              href={templateUri} 
              download="Inventory_Template.xlsx"
              className={`btn-secondary px-6 group flex items-center border-dashed border-2 ${!templateUri ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => { if(!templateUri) { e.preventDefault(); toast.error('جاري تجهيز الملف...') } }}
            >
              <svg className="w-5 h-5 ml-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              تحميل نموذج
            </a>
            <button onClick={loadLogs} className="btn-secondary px-6 group flex items-center bg-indigo-50 border-indigo-100 hover:bg-indigo-100 transition-colors">
              <svg className="w-5 h-5 ml-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              سجل الحركات
            </button>
            <label className="btn-secondary px-6 cursor-pointer group flex items-center bg-emerald-50 border-emerald-100 hover:bg-emerald-100 transition-colors">
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelUpload} />
              <svg className="w-5 h-5 ml-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              استيراد إكسيل
            </label>
            <button onClick={() => setCreating(true)} className="btn-primary group">
              <svg className="w-5 h-5 ml-2 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              إضافة قطعة
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <div className="relative w-full max-w-md group">
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="بحث في المخزن..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pr-11 text-right"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="لا توجد قطع" message="لم يتم العثور على أي قطع في المخزن." />
      ) : (
        <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">القطعة</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">الحالة</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">المكان</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">SKU / باركود</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">الكمية</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">سعر الوحدة</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 font-black text-slate-900">{item.name}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${item.condition === 'used' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                        {item.condition === 'used' ? 'مستعمل' : 'جديد'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-500 font-bold">{item.location || '—'}</td>
                    <td className="px-8 py-5 text-sm text-slate-500 font-mono">{item.sku || '—'}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${item.quantity < 5 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                        {item.quantity} متوفر
                      </span>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-700">{formatCurrency(item.unit_price)}</td>
                    <td className="px-8 py-5 text-left flex justify-start gap-2">
                      {canManage && (
                        <>
                          <button onClick={() => setEditing(item)} className="p-2 text-slate-400 hover:text-primary-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => setDeleteTarget(item)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!editing || creating}
        title={creating ? "إضافة قطعة للمخزن" : "تعديل بيانات القطعة"}
        onClose={() => { setEditing(null); setCreating(false) }}
      >
        <InventoryItemForm
          item={editing}
          profile={profile}
          onSave={() => { setEditing(null); setCreating(false); load() }}
          onClose={() => { setEditing(null); setCreating(false) }}
        />
      </Modal>

      <Modal
        open={isLogOpen}
        title="سجل حركات المخزن (Transaction History)"
        onClose={() => setIsLogOpen(false)}
        maxWidth="max-w-6xl"
      >
        <div className="space-y-4" dir="rtl">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
            <p className="text-sm font-bold text-slate-600">إجمالي الحركات المسجلة: <span className="text-slate-900">{logs.length}</span></p>
            <button onClick={loadLogs} className="text-primary-600 text-xs font-black uppercase tracking-widest hover:underline">تحديث السجل</button>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-100 shadow-sm">
            <table className="w-full text-right border-collapse bg-white">
              <thead className="sticky top-0 z-10 bg-slate-900 text-white">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">التاريخ</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">القطعة</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">نوع الحركة</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">الكمية</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">بواسطة</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">الفرع / المرجعية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr><td colSpan="6" className="py-12 text-center text-slate-400 font-bold">لا توجد حركات مسجلة بعد.</td></tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString('ar-EG')}</td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900">{log.item_name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${log.type === 'received' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                          {log.type === 'received' ? 'إضافة (GR)' : 'سحب (GI)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">{log.quantity}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600 whitespace-nowrap">{log.performer_name}</td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-500 leading-normal">
                        <div className="font-black text-primary-700">{log.center_name}</div>
                        <div className="text-[9px] text-slate-300 font-mono tracking-tighter">{log.reference_id}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}" من المخزن؟`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default InventoryPage
