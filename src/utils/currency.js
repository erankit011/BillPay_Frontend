export const formatCurrency = (amount) => {
  const value = amount ? Number(amount) : 0;
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};
