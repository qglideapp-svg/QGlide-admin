export const PARTNER_CATEGORIES = [
  { value: 'limousine', labelKey: 'partners.categoryLimousine' },
  { value: 'restaurant', labelKey: 'partners.categoryRestaurant' },
  { value: 'club', labelKey: 'partners.categoryClub' },
  { value: 'bar', labelKey: 'partners.categoryBar' },
];

const STORAGE_KEY = 'qglide_admin_partners';

const CATEGORY_CODE_PREFIX = {
  limousine: 'LIM',
  restaurant: 'RST',
  club: 'CLB',
  bar: 'BAR',
};

const SEED_PARTNERS = [
  {
    id: 'pt_seed_1',
    email: 'fleet@dohalimo.qa',
    displayName: 'Doha Premium Limousine',
    legalName: 'Doha Premium Limousine W.L.L.',
    category: 'limousine',
    partnerCode: 'QG-LIM-DOHA-4821',
    status: 'active',
    createdAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'pt_seed_2',
    email: 'manager@alwadi.restaurant',
    displayName: 'Al Wadi Restaurant',
    legalName: 'Al Wadi Hospitality LLC',
    category: 'restaurant',
    partnerCode: 'QG-RST-9F4KD',
    status: 'active',
    createdAt: '2026-02-03T11:30:00.000Z',
  },
  {
    id: 'pt_seed_3',
    email: 'ops@skylineclub.qa',
    displayName: 'Skyline Club Doha',
    legalName: 'Skyline Entertainment W.L.L.',
    category: 'club',
    partnerCode: 'QG-CLB-K7M2',
    status: 'active',
    createdAt: '2026-02-18T20:15:00.000Z',
  },
  {
    id: 'pt_seed_4',
    email: 'contact@marinabar.qa',
    displayName: 'Marina Bar & Lounge',
    legalName: 'Marina Bar Trading',
    category: 'bar',
    partnerCode: 'QG-BAR-3Q8XN',
    status: 'active',
    createdAt: '2026-03-01T16:45:00.000Z',
  },
];

function clonePartners(partners) {
  return partners.map((partner) => ({ ...partner }));
}

function readStoredPartners() {
  if (typeof window === 'undefined') {
    return clonePartners(SEED_PARTNERS);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PARTNERS));
      return clonePartners(SEED_PARTNERS);
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PARTNERS));
      return clonePartners(SEED_PARTNERS);
    }

    return parsed.map((partner, index) => normalizePartnerRecord(partner, index)).filter(Boolean);
  } catch {
    return clonePartners(SEED_PARTNERS);
  }
}

function writeStoredPartners(partners) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(partners));
  }
}

function normalizePartnerRecord(raw, index) {
  if (!raw || typeof raw !== 'object') return null;

  return {
    id: String(raw.id ?? `pt_${index}`),
    email: String(raw.email || '').toLowerCase(),
    displayName: String(raw.displayName || raw.trading_name || '').trim() || '—',
    legalName: String(raw.legalName || raw.legal_entity_name || '').trim(),
    category: String(raw.category || '').toLowerCase(),
    partnerCode: String(raw.partnerCode || raw.partner_code || '').trim(),
    status: String(raw.status || 'active').toLowerCase(),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

function generatePartnerCode(category) {
  const prefix = CATEGORY_CODE_PREFIX[category] || 'PTR';
  const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `QG-${prefix}-${suffix}`;
}

function simulateDelay(ms = 180) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchPartnersList() {
  await simulateDelay();
  const partners = readStoredPartners();

  return {
    success: true,
    data: {
      partners,
      page: 1,
      limit: partners.length,
      totalCount: partners.length,
      totalPages: 1,
    },
  };
}

export async function createPartner({
  category,
  displayName,
  legalName,
  email,
}) {
  await simulateDelay();

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return { success: false, error: 'Email is required.' };
  }

  const partners = readStoredPartners();
  if (partners.some((partner) => partner.email === normalizedEmail)) {
    return { success: false, error: 'A partner with this email already exists.' };
  }

  const partner = {
    id: `pt_${Date.now()}`,
    email: normalizedEmail,
    displayName: String(displayName || '').trim() || '—',
    legalName: String(legalName || '').trim(),
    category: String(category || 'restaurant').toLowerCase(),
    partnerCode: generatePartnerCode(category),
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  writeStoredPartners([partner, ...partners]);
  return { success: true, data: partner };
}

export async function updatePartner(partnerId, {
  category,
  displayName,
  legalName,
  email,
}) {
  await simulateDelay();

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const partners = readStoredPartners();
  const index = partners.findIndex((partner) => partner.id === partnerId);

  if (index === -1) {
    return { success: false, error: 'Partner not found.' };
  }

  if (partners.some((partner, i) => i !== index && partner.email === normalizedEmail)) {
    return { success: false, error: 'A partner with this email already exists.' };
  }

  const current = partners[index];
  const nextCategory = String(category || current.category).toLowerCase();
  const categoryChanged = nextCategory !== current.category;

  partners[index] = {
    ...current,
    email: normalizedEmail,
    displayName: String(displayName || '').trim() || '—',
    legalName: String(legalName || '').trim(),
    category: nextCategory,
    partnerCode: categoryChanged ? generatePartnerCode(nextCategory) : current.partnerCode,
  };

  writeStoredPartners(partners);
  return { success: true, data: partners[index] };
}

export async function deletePartner(partnerId) {
  await simulateDelay();

  const partners = readStoredPartners();
  const nextPartners = partners.filter((partner) => partner.id !== partnerId);

  if (nextPartners.length === partners.length) {
    return { success: false, error: 'Partner not found.' };
  }

  writeStoredPartners(nextPartners);
  return { success: true, data: { partner_id: partnerId } };
}

export function resetPartnersToSeed() {
  writeStoredPartners(clonePartners(SEED_PARTNERS));
}
