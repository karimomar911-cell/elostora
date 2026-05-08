// ─────────────────────────────────────────────
// Invoice calculation helpers
// ─────────────────────────────────────────────

// Calculate totals from spare parts array + service price + discount
export const calculateInvoiceTotals = (servicePriceRaw, spareParts = [], discountRaw = 0) => {
  const servicePrice  = parseFloat(servicePriceRaw) || 0
  const discount      = parseFloat(discountRaw)     || 0

  const partsTotal = spareParts.reduce((sum, part) => {
    const qty   = parseFloat(part.quantity)   || 0
    const price = parseFloat(part.unit_price) || 0
    return sum + qty * price
  }, 0)

  const totalPrice = servicePrice + partsTotal
  const finalPrice = Math.max(0, totalPrice - discount)

  return {
    service_price: servicePrice,
    total_price:   totalPrice,
    discount,
    final_price:   finalPrice,
  }
}

// Format currency
export const formatCurrency = (value) =>
  `$${parseFloat(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

// Format date for display
export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ─────────────────────────────────────────────
// PDF Export using jsPDF
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// PDF Export using html2pdf.js (Supports Arabic & CSS)
// ─────────────────────────────────────────────
export const exportInvoicePDF = async (invoice, centerName = 'Service Center') => {
  const element = document.createElement('div')
  
  // Create a printable container
  const printWindow = window.open('', '_blank')
  const spareParts = Array.isArray(invoice.spare_parts) ? invoice.spare_parts : []
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice - ${invoice.client_name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; font-family: 'Cairo', sans-serif; margin: 0; padding: 0; }
          body { padding: 40px; direction: rtl; color: #1e293b; line-height: 1.5; }
          .header { border-bottom: 4px solid #2563eb; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; direction: ltr; }
          .invoice-title { color: #2563eb; font-size: 32px; font-weight: 900; }
          .center-info { color: #64748b; font-weight: 700; font-size: 16px; margin-top: 5px; }
          .meta-info { text-align: right; }
          .meta-info p { font-size: 14px; color: #94a3b8; font-weight: 700; }
          .meta-info .inv-id { color: #1e293b; font-size: 18px; font-weight: 900; margin-top: 5px; }
          
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .box { background: #f8fafc; padding: 25px; border-radius: 20px; }
          .box h3 { font-size: 12px; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
          .label { color: #64748b; font-weight: 700; }
          .val { color: #0f172a; font-weight: 900; }
          
          .section-label { font-size: 16px; font-weight: 900; margin: 40px 0 15px 0; color: #1e293b; border-right: 6px solid #2563eb; padding-right: 15px; }
          .text-block { padding: 25px; background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; font-size: 15px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #1e293b; color: #fff; padding: 15px; text-align: right; font-size: 13px; }
          td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          
          .footer { margin-top: 60px; display: flex; justify-content: flex-start; }
          .summary { width: 320px; background: #0f172a; color: #fff; padding: 30px; border-radius: 30px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
          .sum-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; color: #94a3b8; }
          .grand-total { margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; }
          .total-val { font-size: 28px; font-weight: 900; }
          
          @media print {
            body { padding: 0; }
            .summary { box-shadow: none; border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="invoice-title">SERVICE INVOICE</h1>
            <p class="center-info">${centerName}</p>
          </div>
          <div class="meta-info">
            <p>التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
            <p class="inv-id">#${invoice.id?.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <h3>بيانات العميل والسيارة</h3>
            <div class="row"><span class="label">العميل:</span> <span class="val">${invoice.client_name ?? '—'}</span></div>
            <div class="row"><span class="label">السيارة:</span> <span class="val">${invoice.car_model ?? '—'}</span></div>
            <div class="row"><span class="label">تاريخ الخدمة:</span> <span class="val">${formatDate(invoice.service_date)}</span></div>
          </div>
          <div class="box">
            <h3>بيانات الخدمة</h3>
            <div class="row"><span class="label">المسؤول:</span> <span class="val">${invoice.profiles?.full_name ?? '—'}</span></div>
            <div class="row"><span class="label">المركز:</span> <span class="val">${invoice.service_centers?.name ?? centerName}</span></div>
          </div>
        </div>

        <div class="section-label">الخدمات المنجزة</div>
        <div class="text-block">${invoice.services_performed || 'لا يوجد وصف متاح'}</div>

        ${spareParts.length > 0 ? `
          <div class="section-label">قطع الغيار المستبدلة</div>
          <table>
            <thead>
              <tr>
                <th style="border-radius: 15px 0 0 0;">القطعة</th>
                <th style="text-align: center;">الكمية</th>
                <th style="text-align: center;">السعر</th>
                <th style="text-align: left; border-radius: 0 15px 0 0;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${spareParts.map(part => `
                <tr>
                  <td style="font-weight: 700;">${part.name}</td>
                  <td style="text-align: center;">${part.quantity}</td>
                  <td style="text-align: center;">${formatCurrency(part.unit_price)}</td>
                  <td style="text-align: left; font-weight: 900;">${formatCurrency(part.quantity * part.unit_price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="footer">
          <div class="summary">
            <div class="sum-row"><span>قيمة الخدمة:</span> <span>${formatCurrency(invoice.service_price)}</span></div>
            <div class="sum-row"><span>إجمالي القطع:</span> <span>${formatCurrency(invoice.total_price - invoice.service_price)}</span></div>
            ${parseFloat(invoice.discount || 0) > 0 ? `
              <div class="sum-row" style="color: #fb7185;"><span>الخصم:</span> <span>- ${formatCurrency(invoice.discount)}</span></div>
            ` : ''}
            <div class="grand-total">
              <span style="font-size: 11px; font-weight: 900; color: #3b82f6;">الإجمالي النهائي</span>
              <span class="total-val">${formatCurrency(invoice.final_price)}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 100px; text-align: center; color: #94a3b8; font-size: 12px; font-weight: 700;">
          شكراً لثقتكم بنا. تم استخراج هذا المستند إلكترونياً.
        </div>
      </body>
    </html>
  `)
  
  printWindow.document.close()
  
  // Give time for font to load before opening print dialog
  setTimeout(() => {
    printWindow.focus()
    printWindow.print()
    // Optional: close the window after printing
    // printWindow.close()
  }, 1000)
}

