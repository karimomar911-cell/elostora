import { useCallback } from 'react'

/**
 * Custom hook for invoice-related calculations
 * Handles service price, spare parts, discount, and total calculations
 */
export const useInvoiceCalculations = () => {
  /**
   * Calculate total price for spare parts
   */
  const calculateSparepartsTotal = useCallback((spareParts = []) => {
    return spareParts.reduce((sum, part) => {
      const quantity = parseFloat(part.quantity) || 0
      const price = parseFloat(part.price) || 0
      return sum + (quantity * price)
    }, 0)
  }, [])

  /**
   * Calculate discount amount
   */
  const calculateDiscountAmount = useCallback((subtotal, discountPercent) => {
    const discount = parseFloat(discountPercent) || 0
    if (discount < 0 || discount > 100) return 0
    return (subtotal * discount) / 100
  }, [])

  /**
   * Calculate all totals at once
   */
  const calculateTotals = useCallback((servicePrice, spareParts, discountPercent) => {
    const service = parseFloat(servicePrice) || 0
    const spare_parts_total = calculateSparepartsTotal(spareParts)
    const subtotal = service + spare_parts_total
    const discount_amount = calculateDiscountAmount(subtotal, discountPercent)
    const final_price = Math.max(0, subtotal - discount_amount)

    return {
      service_price: service,
      spare_parts_total,
      subtotal,
      discount_percent: parseFloat(discountPercent) || 0,
      discount_amount,
      final_price,
      // Keep old names for backward compatibility
      total_price: spare_parts_total,
      discount: discount_amount,
    }
  }, [calculateSparepartsTotal, calculateDiscountAmount])

  return {
    calculateSparepartsTotal,
    calculateDiscountAmount,
    calculateTotals,
  }
}