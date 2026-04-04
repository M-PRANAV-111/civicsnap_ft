const STATUS_KEY_MAP = {
  Pending: 'pending',
  'In Progress': 'inProgress',
  Resolved: 'resolved',
  Rejected: 'rejected',
};

const CATEGORY_KEY_MAP = {
  'Municipal / GHMC': 'municipalGhmc',
  Police: 'police',
  'Traffic Police': 'trafficPolice',
  Revenue: 'revenue',
  Endowments: 'endowments',
  'Water Supply': 'waterSupply',
  Electricity: 'electricity',
  Health: 'health',
  Education: 'education',
  'Rural Development': 'ruralDevelopment',
};

const ROLE_KEY_MAP = {
  citizen: 'citizen',
  officer: 'officer',
  admin: 'admin',
  user: 'user',
};

const LOCALE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
};

function extractLanguage(i18nOrLanguage) {
  if (typeof i18nOrLanguage === 'string') {
    return i18nOrLanguage.split('-')[0];
  }

  const value = i18nOrLanguage?.resolvedLanguage || i18nOrLanguage?.language || 'en';
  return String(value).split('-')[0];
}

export function getLocaleTag(i18nOrLanguage) {
  return LOCALE_MAP[extractLanguage(i18nOrLanguage)] || 'en-IN';
}

export function formatLocalizedDate(iso, i18nOrLanguage, options = {}) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(getLocaleTag(i18nOrLanguage), options);
}

export function formatLocalizedDateTime(iso, i18nOrLanguage, options = {}) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(getLocaleTag(i18nOrLanguage), options);
}

export function getStatusTranslationKey(status) {
  return STATUS_KEY_MAP[status] || 'pending';
}

export function translateStatus(t, status) {
  return t(`statuses.${getStatusTranslationKey(status)}`, { defaultValue: status });
}

export function getCategoryTranslationKey(category) {
  return CATEGORY_KEY_MAP[category] || null;
}

export function translateCategory(t, category) {
  const key = getCategoryTranslationKey(category);
  if (!key) return category;
  return t(`categories.${key}`, { defaultValue: category });
}

export function translateRole(t, role) {
  const key = ROLE_KEY_MAP[String(role || '').toLowerCase()] || 'user';
  return t(`roles.${key}`, { defaultValue: role });
}
