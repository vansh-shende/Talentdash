export const USD_TO_INR = 83.3; // Current conversion rate

export function convertValue(val: number | string | any, from: string, to: string): number {
  const num = Number(val || 0);
  if (from === to) return num;
  
  if (from === 'USD' && to === 'INR') {
    return num * USD_TO_INR;
  }
  if (from === 'INR' && to === 'USD') {
    return num / USD_TO_INR;
  }
  
  return num;
}

export function formatCurrencyValue(val: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(val);
}

export function getFormattedCompensation(amount: number | string | any, sourceCurrency: string, targetCurrency: string) {
  const converted = convertValue(amount, sourceCurrency, targetCurrency);
  return formatCurrencyValue(converted, targetCurrency);
}
