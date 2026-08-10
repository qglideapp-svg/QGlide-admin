export const getLocaleCode = (language) => (language === 'arabic' ? 'ar' : 'en');

export const normalizeApiKey = (value) => {
  if (value == null || value === '') return '';

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
};

export const formatNumber = (value, language, options = {}) => {
  const num = typeof value === 'number' ? value : Number.parseFloat(value);
  if (Number.isNaN(num)) return value == null ? '' : String(value);

  return new Intl.NumberFormat(getLocaleCode(language), options).format(num);
};

export const formatCurrency = (amount, language, currencyLabel = 'QAR') => {
  let numValue = amount;

  if (amount == null) numValue = 0;
  else if (typeof amount === 'object' && amount.value != null) numValue = amount.value;
  else if (typeof amount === 'string') numValue = Number.parseFloat(amount);

  const parsed = typeof numValue === 'number' ? numValue : Number.parseFloat(numValue);
  if (Number.isNaN(parsed)) return `${currencyLabel} 0`;

  const formatted = formatNumber(parsed, language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${currencyLabel} ${formatted}`;
};

export const formatDate = (value, language, options = {}) => {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(getLocaleCode(language), {
    dateStyle: 'medium',
    ...options,
  }).format(date);
};

export const formatDateTime = (value, language, options = {}) => {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(getLocaleCode(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(date);
};

export const formatTime = (value, language, options = {}) => {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(getLocaleCode(language), {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(date);
};

export const formatPercentage = (value, language) => {
  const num = typeof value === 'number' ? value : Number.parseFloat(value);
  if (Number.isNaN(num)) return String(value ?? '');

  return `${formatNumber(num, language, { maximumFractionDigits: 2 })}%`;
};

export const formatApiDate = (value, language, formatter = formatDateTime) => {
  if (value == null || value === '' || value === 'N/A') return '';

  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return formatter(value, language);
  }

  return String(value);
};
