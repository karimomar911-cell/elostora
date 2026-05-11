import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useAuth } from '../../core/auth/AuthProvider'
import { invoiceSchema } from '../../core/validation/schemas'
import { createInvoice } from '../../services/invoiceService'
import { fetchProfilesByCenter, fetchAllProfiles } from '../../services/profileService'
import { calculateInvoiceTotals, formatCurrency } from '../../utils/invoiceUtils'
import { ROUTES } from '../../core/routing/routes'
import LoadingSpinner from '../../components/LoadingSpinner'
import { fetchInventory, deductInventoryStock } from '../../services/inventoryService'

const InvoiceFormPage = () => {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const centerId    = profile?.service_center_id
  const isDeveloper = profile?.role === 'developer'

  const [clients, setClients]   = useState([])
  const [inventory, setInventory] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [totals, setTotals]     = useState({
    service_price: 0, total_price: 0, discount: 0, final_price: 0,
  })

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id:          '',
      client_name:        '',
      car_model:          '',
      chassis_number:     '',
      service_date:       new Date().toISOString().split('T')[0],
      handover_date:      '',
      services_performed: '',
      service_price:      0,
      discount:           0,
      spare_parts:        [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'spare_parts' })

  // Watch for live total calculation
  const watchedValues = watch(['service_price', 'spare_parts', 'discount'])

  useEffect(() => {
    const [servicePrice, spareParts, discount] = watchedValues
    const calculated = calculateInvoiceTotals(servicePrice, spareParts, discount)
    setTotals(calculated)
  }, [JSON.stringify(watchedValues)])

  // Load clients and inventory
  useEffect(() => {
    if (!isDeveloper && !centerId) { 
      setLoadingClients(false)
      return 
    }
    const load = async () => {
      try {
        // Developers see all clients, admins/employees see only their center's clients
        const allClients = isDeveloper 
          ? await fetchAllProfiles()
          : await fetchProfilesByCenter(centerId)
        
        const allInventory = centerId 
          ? await fetchInventory(centerId)
          : []
        
        console.log('📋 All profiles:', allClients)
        const filteredClients = allClients.filter(p => p.role === 'client')
        console.log('✓ Filtered clients with role="client":', filteredClients)
        
        setClients(filteredClients)
        setInventory(allInventory)
        
        if (filteredClients.length === 0) {
          console.warn('⚠️ No clients found! Check:')
          console.warn('  - Clients created?')
          console.warn('  - All profiles:', allClients.map(p => ({ id: p.id, role: p.role, center: p.service_center_id, name: p.full_name })))
        }
      } catch (err) {
        console.error('Error loading data:', err)
        toast.error('Failed to load data.')
      } finally {
        setLoadingClients(false)
      }
    }
    load()
  }, [centerId, isDeveloper])

  const onClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    if (client) {
      setValue('client_name', client.full_name)
      if (client.car_model) setValue('car_model', client.car_model)
      if (client.chassis_number) setValue('chassis_number', client.chassis_number)
    }
  }

  const onPartSelect = (index, partId) => {
    const part = inventory.find(i => i.id === partId)
    if (part) {
      setValue(`spare_parts.${index}.name`, part.name)
      setValue(`spare_parts.${index}.unit_price`, part.unit_price)
      setValue(`spare_parts.${index}.inventory_id`, part.id)
    }
  }

  const onSubmit = async (data) => {
    const spareParts = data.spare_parts.map(p => ({
      name:       p.name,
      quantity:   parseFloat(p.quantity)   || 0,
      unit_price: parseFloat(p.unit_price) || 0,
      inventory_id: p.inventory_id || null
    }))

      // 1. Stock Validation Check
      for (const p of spareParts) {
        if (p.inventory_id) {
          const stockItem = inventory.find(i => i.id === p.inventory_id)
          if (stockItem && p.quantity > stockItem.quantity) {
            toast.error(`الكمية المطلوبة لـ (${stockItem.name}) تتجاوز المتوفر بالمخزن! المتوفر: ${stockItem.quantity}`)
            return
          }
        }
      }

      try {
        const calculated = calculateInvoiceTotals(
          data.service_price,
          data.spare_parts,
          data.discount
        )

        const payload = {
        service_center_id:  centerId,
        created_by:         profile.id,
        client_id:          data.client_id   || null,
        client_name:        data.client_name,
        car_model:          data.car_model,
        chassis_number:     data.chassis_number || null,
        service_date:       data.service_date   || null,
        handover_date:      data.handover_date  || null,
        services_performed: data.services_performed,
        spare_parts:        spareParts,
        service_price:      calculated.service_price,
        total_price:        calculated.total_price,
        discount:           calculated.discount,
        final_price:        calculated.final_price,
      }

      const res = await createInvoice(payload)
      const invoiceId = res?.id || 'Invoice'
      
      // Automatic Stock Deduction with Logging
      const deductionPromises = spareParts
        .filter(p => p.inventory_id && p.quantity > 0)
        .map(p => deductInventoryStock(p.inventory_id, p.quantity, profile, `Invoice #${invoiceId}`))
      
      if (deductionPromises.length > 0) {
        await Promise.all(deductionPromises)
      }

      toast.success('Invoice created and stock updated!')

      if (profile.role === 'admin') navigate(ROUTES.ADMIN_INVOICES)
      else navigate(ROUTES.EMPLOYEE_INVOICES)
    } catch (err) {
      toast.error(err.message || 'Failed to generate invoice.')
    }
  }

  const addSparePart = () => append({ name: '', quantity: 1, unit_price: '' })

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-primary-600 hover:border-primary-200 hover:shadow-sm transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
              <span className="w-8 h-[2px] bg-primary-600" />
              Document Generator
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">New Invoice</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* ── Left column — main fields ── */}
          <div className="xl:col-span-2 space-y-8">

            {/* Client info */}
            <div className="bg-white rounded-3xl shadow-premium border border-slate-100 p-8 space-y-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xs">01</span>
                Client Identity
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client selector */}
                <div className="group">
                  <label className="input-label">Select Registered Client</label>
                  {loadingClients ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400 p-3 bg-slate-50 rounded-xl">
                      <div className="w-4 h-4 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin" /> 
                      Syncing client list…
                    </div>
                  ) : clients.length === 0 ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-sm font-bold text-amber-900 mb-2">⚠️ No clients found</p>
                      <p className="text-xs text-amber-700">Make sure clients have been created in this service center. Check the Admin Clients page to register them first.</p>
                    </div>
                  ) : (
                    <select 
                      className="input-field group-hover:border-slate-300 transition-colors" 
                      {...register('client_id')}
                      onChange={(e) => {
                        register('client_id').onChange(e)
                        onClientSelect(e.target.value)
                      }}
                    >
                      <option value="">— Unregistered / Walk-in —</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="group">
                  <label className="input-label">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Alexander Pierce"
                    className={`input-field group-hover:border-slate-300 transition-colors ${errors.client_name ? 'border-rose-300 focus:ring-rose-200' : ''}`}
                    {...register('client_name')}
                  />
                  {errors.client_name && <p className="input-error">{errors.client_name.message}</p>}
                </div>
              </div>
            </div>

            {/* Vehicle info */}
            <div className="bg-white rounded-3xl shadow-premium border border-slate-100 p-8 space-y-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xs">02</span>
                Asset & Timeline
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="input-label">Chassis Number (VIN) *</label>
                  <input
                    type="text"
                    placeholder="Enter chassis number..."
                    className={`input-field group-hover:border-slate-300 transition-colors ${errors.chassis_number ? 'border-rose-300 focus:ring-rose-200' : ''}`}
                    {...register('chassis_number')}
                  />
                  {errors.chassis_number && <p className="input-error">{errors.chassis_number.message}</p>}
                </div>
                <div className="group">
                  <label className="input-label">Vehicle Model / Description *</label>
                  <input
                    type="text"
                    placeholder="e.g. Porsche 911 Carrera (2024)"
                    className={`input-field group-hover:border-slate-300 transition-colors ${errors.car_model ? 'border-rose-300 focus:ring-rose-200' : ''}`}
                    {...register('car_model')}
                  />
                  {errors.car_model && <p className="input-error">{errors.car_model.message}</p>}
                </div>

                <div className="group">
                  <label className="input-label">Service Commencement *</label>
                  <input
                    type="date"
                    className={`input-field group-hover:border-slate-300 transition-colors ${errors.service_date ? 'border-rose-300 focus:ring-rose-200' : ''}`}
                    {...register('service_date')}
                  />
                  {errors.service_date && <p className="input-error">{errors.service_date.message}</p>}
                </div>
                <div className="group">
                  <label className="input-label">Anticipated Handover</label>
                  <input
                    type="date"
                    className="input-field group-hover:border-slate-300 transition-colors"
                    {...register('handover_date')}
                  />
                </div>
              </div>

              <div className="group pt-2">
                <label className="input-label">Technical Services Rendered *</label>
                <textarea
                  rows={4}
                  placeholder="Detailed breakdown of mechanical and technical operations performed…"
                  className={`input-field resize-none group-hover:border-slate-300 transition-colors ${errors.services_performed ? 'border-rose-300 focus:ring-rose-200' : ''}`}
                  {...register('services_performed')}
                />
                {errors.services_performed && (
                  <p className="input-error">{errors.services_performed.message}</p>
                )}
              </div>
            </div>

            {/* Spare parts */}
            <div className="bg-white rounded-3xl shadow-premium border border-slate-100 p-8 space-y-6">
              <div className="flex items-center justify-between pb-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xs">03</span>
                  Inventory Logistics
                </h2>
                <button
                  type="button"
                  onClick={addSparePart}
                  className="btn-secondary py-2 text-xs font-black uppercase tracking-widest group"
                >
                  <svg className="w-4 h-4 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Entry
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <p className="text-slate-400 font-bold text-sm tracking-tight">No inventory components linked</p>
                  <button
                    type="button"
                    onClick={addSparePart}
                    className="text-primary-600 font-black text-xs uppercase tracking-widest mt-2 hover:text-primary-700 transition-colors"
                  >
                    + Add manual entry
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-6">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 relative group/row hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-white shadow-md border border-slate-100 text-slate-300 hover:text-rose-500 hover:scale-110 transition-all flex items-center justify-center z-10"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                          {/* Part Selection & Name */}
                          <div className="md:col-span-6 space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">
                              Link to Stock (Optional)
                            </label>
                            <select 
                              className="input-field bg-white border-slate-200 text-xs py-2.5"
                              onChange={(e) => onPartSelect(index, e.target.value)}
                              value={watch(`spare_parts.${index}.inventory_id`) || ''}
                            >
                              <option value="">— Manually Type or Select —</option>
                              {inventory.map(item => (
                                <option key={item.id} value={item.id}>
                                  {item.name} ({item.quantity} in stock)
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Part Name"
                              className={`input-field bg-white border-slate-200 ${errors.spare_parts?.[index]?.name ? 'border-rose-300' : ''}`}
                              {...register(`spare_parts.${index}.name`, { required: true })}
                            />
                            <input type="hidden" {...register(`spare_parts.${index}.inventory_id`)} />
                          </div>

                          {/* Quantity */}
                          <div className="md:col-span-3 space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1 text-center">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              className="input-field bg-white border-slate-200 text-center font-black"
                              {...register(`spare_parts.${index}.quantity`, { min: 1 })}
                            />
                          </div>

                          {/* Price */}
                          <div className="md:col-span-3 space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">
                              Unit Price
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className={`input-field bg-white border-slate-200 pl-9 font-black ${errors.spare_parts?.[index]?.unit_price ? 'border-rose-300' : ''}`}
                                {...register(`spare_parts.${index}.unit_price`, { required: true, min: 0 })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right column — pricing summary ── */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-premium border border-slate-100 p-8 space-y-8 sticky top-24">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3 pb-4 border-b border-slate-50">
                <span className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xs">04</span>
                Settlement
              </h2>

              <div className="space-y-5">
                <div className="group">
                  <label className="input-label">Technical Labor Fee ($) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`input-field pl-9 group-hover:border-slate-300 transition-colors ${errors.service_price ? 'border-rose-300' : ''}`}
                      {...register('service_price')}
                    />
                  </div>
                  {errors.service_price && <p className="input-error">{errors.service_price.message}</p>}
                </div>

                <div className="group">
                  <label className="input-label">Adjustment / Discount ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-field pl-9 group-hover:border-slate-300 transition-colors"
                      {...register('discount')}
                    />
                  </div>
                </div>
              </div>

              {/* Total breakdown */}
              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-4 relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary-500/20 blur-3xl rounded-full" />
                
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Mechanical Labor</span>
                    <span className="text-white">{formatCurrency(totals.service_price)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Component Total</span>
                    <span className="text-white">{formatCurrency(totals.total_price - totals.service_price)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-rose-400 text-xs font-bold uppercase tracking-wider">
                      <span>Adjustment</span>
                      <span>- {formatCurrency(totals.discount)}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] mb-1 text-center">Grand Total Settlement</p>
                    <p className="text-4xl font-black tracking-tighter text-center">{formatCurrency(totals.final_price)}</p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="space-y-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-4 text-base font-black tracking-tight shadow-primary-500/20 shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                      Generating Document…
                    </>
                  ) : 'Finalize & Generate Invoice'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn-secondary w-full py-3.5"
                >
                  Discard Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default InvoiceFormPage
