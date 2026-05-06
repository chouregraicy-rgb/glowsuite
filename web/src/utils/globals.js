// ─── COUNTRIES — taxName, taxRate, dateFormat now inline in each entry ─────────
// FIX: handleCountryChange reads c.taxName etc directly — no more undefined
export const COUNTRIES = [
  { code:'IN', name:'India',          flag:'🇮🇳', dial:'+91',  currency:'INR', symbol:'₹',   timezone:'Asia/Kolkata',        taxName:'GST',       taxRate:18,  dateFormat:'DD/MM/YYYY' },
  { code:'US', name:'United States',  flag:'🇺🇸', dial:'+1',   currency:'USD', symbol:'$',   timezone:'America/New_York',    taxName:'Sales Tax', taxRate:8,   dateFormat:'MM/DD/YYYY' },
  { code:'GB', name:'United Kingdom', flag:'🇬🇧', dial:'+44',  currency:'GBP', symbol:'£',   timezone:'Europe/London',       taxName:'VAT',       taxRate:20,  dateFormat:'DD/MM/YYYY' },
  { code:'AE', name:'UAE',            flag:'🇦🇪', dial:'+971', currency:'AED', symbol:'د.إ', timezone:'Asia/Dubai',          taxName:'VAT',       taxRate:5,   dateFormat:'DD/MM/YYYY' },
  { code:'AU', name:'Australia',      flag:'🇦🇺', dial:'+61',  currency:'AUD', symbol:'A$',  timezone:'Australia/Sydney',    taxName:'GST',       taxRate:10,  dateFormat:'DD/MM/YYYY' },
  { code:'CA', name:'Canada',         flag:'🇨🇦', dial:'+1',   currency:'CAD', symbol:'CA$', timezone:'America/Toronto',     taxName:'HST/GST',   taxRate:13,  dateFormat:'MM/DD/YYYY' },
  { code:'SG', name:'Singapore',      flag:'🇸🇬', dial:'+65',  currency:'SGD', symbol:'S$',  timezone:'Asia/Singapore',      taxName:'GST',       taxRate:9,   dateFormat:'DD/MM/YYYY' },
  { code:'MY', name:'Malaysia',       flag:'🇲🇾', dial:'+60',  currency:'MYR', symbol:'RM',  timezone:'Asia/Kuala_Lumpur',   taxName:'SST',       taxRate:6,   dateFormat:'DD/MM/YYYY' },
  { code:'PH', name:'Philippines',    flag:'🇵🇭', dial:'+63',  currency:'PHP', symbol:'₱',   timezone:'Asia/Manila',         taxName:'VAT',       taxRate:12,  dateFormat:'DD/MM/YYYY' },
  { code:'NG', name:'Nigeria',        flag:'🇳🇬', dial:'+234', currency:'NGN', symbol:'₦',   timezone:'Africa/Lagos',        taxName:'VAT',       taxRate:7.5, dateFormat:'DD/MM/YYYY' },
  { code:'ZA', name:'South Africa',   flag:'🇿🇦', dial:'+27',  currency:'ZAR', symbol:'R',   timezone:'Africa/Johannesburg', taxName:'VAT',       taxRate:15,  dateFormat:'DD/MM/YYYY' },
  { code:'KE', name:'Kenya',          flag:'🇰🇪', dial:'+254', currency:'KES', symbol:'KSh', timezone:'Africa/Nairobi',      taxName:'VAT',       taxRate:16,  dateFormat:'DD/MM/YYYY' },
  { code:'SA', name:'Saudi Arabia',   flag:'🇸🇦', dial:'+966', currency:'SAR', symbol:'ر.س', timezone:'Asia/Riyadh',         taxName:'VAT',       taxRate:15,  dateFormat:'DD/MM/YYYY' },
  { code:'QA', name:'Qatar',          flag:'🇶🇦', dial:'+974', currency:'QAR', symbol:'ر.ق', timezone:'Asia/Qatar',          taxName:'VAT',       taxRate:0,   dateFormat:'DD/MM/YYYY' },
  { code:'DE', name:'Germany',        flag:'🇩🇪', dial:'+49',  currency:'EUR', symbol:'€',   timezone:'Europe/Berlin',       taxName:'MwSt',      taxRate:19,  dateFormat:'DD/MM/YYYY' },
  { code:'FR', name:'France',         flag:'🇫🇷', dial:'+33',  currency:'EUR', symbol:'€',   timezone:'Europe/Paris',        taxName:'TVA',       taxRate:20,  dateFormat:'DD/MM/YYYY' },
  { code:'NL', name:'Netherlands',    flag:'🇳🇱', dial:'+31',  currency:'EUR', symbol:'€',   timezone:'Europe/Amsterdam',    taxName:'BTW',       taxRate:21,  dateFormat:'DD/MM/YYYY' },
  { code:'PK', name:'Pakistan',       flag:'🇵🇰', dial:'+92',  currency:'PKR', symbol:'₨',   timezone:'Asia/Karachi',        taxName:'GST',       taxRate:17,  dateFormat:'DD/MM/YYYY' },
  { code:'BD', name:'Bangladesh',     flag:'🇧🇩', dial:'+880', currency:'BDT', symbol:'৳',   timezone:'Asia/Dhaka',          taxName:'VAT',       taxRate:15,  dateFormat:'DD/MM/YYYY' },
  { code:'LK', name:'Sri Lanka',      flag:'🇱🇰', dial:'+94',  currency:'LKR', symbol:'Rs',  timezone:'Asia/Colombo',        taxName:'VAT',       taxRate:18,  dateFormat:'DD/MM/YYYY' },
  { code:'NP', name:'Nepal',          flag:'🇳🇵', dial:'+977', currency:'NPR', symbol:'Rs',  timezone:'Asia/Kathmandu',      taxName:'VAT',       taxRate:13,  dateFormat:'DD/MM/YYYY' },
  { code:'ID', name:'Indonesia',      flag:'🇮🇩', dial:'+62',  currency:'IDR', symbol:'Rp',  timezone:'Asia/Jakarta',        taxName:'PPN',       taxRate:11,  dateFormat:'DD/MM/YYYY' },
  { code:'TH', name:'Thailand',       flag:'🇹🇭', dial:'+66',  currency:'THB', symbol:'฿',   timezone:'Asia/Bangkok',        taxName:'VAT',       taxRate:7,   dateFormat:'DD/MM/YYYY' },
  { code:'BR', name:'Brazil',         flag:'🇧🇷', dial:'+55',  currency:'BRL', symbol:'R$',  timezone:'America/Sao_Paulo',   taxName:'ICMS',      taxRate:12,  dateFormat:'DD/MM/YYYY' },
  { code:'MX', name:'Mexico',         flag:'🇲🇽', dial:'+52',  currency:'MXN', symbol:'MX$', timezone:'America/Mexico_City', taxName:'IVA',       taxRate:16,  dateFormat:'DD/MM/YYYY' },
  { code:'NZ', name:'New Zealand',    flag:'🇳🇿', dial:'+64',  currency:'NZD', symbol:'NZ$', timezone:'Pacific/Auckland',    taxName:'GST',       taxRate:15,  dateFormat:'DD/MM/YYYY' },
]

export const TAX_NAMES = {
  IN: { name: 'GST', rate: 18 },
  AU: { name: 'GST', rate: 10 },
  NZ: { name: 'GST', rate: 15 },
  CA: { name: 'HST/GST', rate: 13 },
  US: { name: 'Sales Tax', rate: 0 }, // varies by state
  GB: { name: 'VAT', rate: 20 },
  DE: { name: 'MwSt', rate: 19 },
  FR: { name: 'TVA', rate: 20 },
  NL: { name: 'BTW', rate: 21 },
  AE: { name: 'VAT', rate: 5 },
  SA: { name: 'VAT', rate: 15 },
  SG: { name: 'GST', rate: 9 },
  MY: { name: 'SST', rate: 6 },
  ZA: { name: 'VAT', rate: 15 },
  NG: { name: 'VAT', rate: 7.5 },
  DEFAULT: { name: 'Tax', rate: 0 },
}

export const DATE_FORMATS = {
  IN: 'DD/MM/YYYY', PK: 'DD/MM/YYYY', BD: 'DD/MM/YYYY',
  GB: 'DD/MM/YYYY', AU: 'DD/MM/YYYY', NZ: 'DD/MM/YYYY',
  US: 'MM/DD/YYYY', CA: 'MM/DD/YYYY',
  DEFAULT: 'DD/MM/YYYY',
}

export const PAYMENT_GATEWAYS = {
  IN: ['Razorpay', 'Stripe', 'Cash', 'UPI', 'Card'],
  US: ['Stripe', 'PayPal', 'Square', 'Cash', 'Card'],
  GB: ['Stripe', 'PayPal', 'Cash', 'Card'],
  AE: ['Stripe', 'Cash', 'Card'],
  DEFAULT: ['Stripe', 'PayPal', 'Cash', 'Card'],
}

export const SALON_TYPES = [
  { id: 'hair', label: 'Hair Salon', icon: '✂️' },
  { id: 'spa', label: 'Spa & Wellness', icon: '🧖' },
  { id: 'nail', label: 'Nail Studio', icon: '💅' },
  { id: 'bridal', label: 'Bridal Studio', icon: '👑' },
  { id: 'barber', label: 'Barbershop', icon: '💈' },
  { id: 'beauty', label: 'Beauty Salon', icon: '💄' },
  { id: 'medspa', label: 'Med Spa', icon: '🏥' },
  { id: 'full', label: 'Full Service Salon', icon: '⭐' },
]

export function getCountry(code) {
  return COUNTRIES.find(c => c.code === code) || COUNTRIES[0]
}

export function formatCurrency(amount, currencySymbol) {
  return `${currencySymbol}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
