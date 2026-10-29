/**
 * Currency Formatting Utilities
 * Standardizes monetary values to Indian Rupee (INR) representation using Intl.NumberFormat.
 */

/**
 * Format Currency Representation
 * Converts numeric amount to rounded INR currency string (e.g., ₹1,500)
 */
export const formatCurrency = (amount) => {
  const value = amount ? Number(amount) : 0;
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};
