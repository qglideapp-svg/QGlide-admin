import { authenticatedFetch } from './apiClient';
import { SUPABASE_ANON_KEY } from './authService';

const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';

export const PARTNER_CATEGORIES = [
  { value: 'limousine', labelKey: 'partners.categoryLimousine' },
  { value: 'restaurant', labelKey: 'partners.categoryRestaurant' },
  { value: 'club', labelKey: 'partners.categoryClub' },
  { value: 'bar', labelKey: 'partners.categoryBar' },
];

export const PARTNER_STATUSES = [
  { value: 'pending_approval', labelKey: 'partners.statusPendingApproval' },
  { value: 'active', labelKey: 'partners.statusActive' },
  { value: 'suspended', labelKey: 'partners.statusSuspended' },
  { value: 'rejected', labelKey: 'partners.statusRejected' },
];

function parseErrorMessage(errorData, fallback) {
  if (!errorData || typeof errorData !== 'object') return fallback;
  const err = errorData.error ?? errorData.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && typeof err.message === 'string') return err.message;
  return fallback;
}

function normalizePartnerRecord(raw, index) {
  if (!raw || typeof raw !== 'object') return null;

  const id = raw.id ?? raw.partner_id ?? raw.user_id ?? `pt_${index}`;
  const email = raw.email ?? raw.login_email ?? '';
  const displayName =
    raw.trading_name ?? raw.display_name ?? raw.displayName ?? raw.name ?? '';
  const legalName = raw.legal_name ?? raw.legalName ?? raw.legal_entity_name ?? '';
  const partnerCode = raw.partner_code ?? raw.partnerCode ?? '';
  const category = raw.category ?? raw.partner_category ?? '';
  const status = raw.status ?? 'active';
  const statusReason = raw.status_reason ?? raw.statusReason ?? null;
  const municipality = raw.municipality ?? '';
  const commercialRegistrationNumber =
    raw.commercial_registration_number ?? raw.commercialRegistrationNumber ?? '';
  const portalUserId = raw.portal_user_id ?? raw.portalUserId ?? null;
  const hasPortalLogin = raw.has_portal_login ?? raw.hasPortalLogin ?? false;
  const createdRaw = raw.created_at ?? raw.createdAt ?? raw.created ?? null;
  const updatedRaw = raw.updated_at ?? raw.updatedAt ?? null;
  const approvedRaw = raw.approved_at ?? raw.approvedAt ?? null;

  const parseDate = (value) => {
    if (value == null) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  return {
    id: String(id),
    email: email ? String(email).toLowerCase() : '',
    displayName: String(displayName || '').trim() || '—',
    legalName: String(legalName || '').trim(),
    category: String(category || '').toLowerCase(),
    partnerCode: String(partnerCode || '').trim(),
    status: String(status || 'active').toLowerCase(),
    statusReason: statusReason ? String(statusReason) : null,
    municipality: String(municipality || '').trim(),
    commercialRegistrationNumber: String(commercialRegistrationNumber || '').trim(),
    portalUserId: portalUserId ? String(portalUserId) : null,
    hasPortalLogin: Boolean(hasPortalLogin),
    createdAt: parseDate(createdRaw) ?? new Date().toISOString(),
    updatedAt: parseDate(updatedRaw),
    approvedAt: parseDate(approvedRaw),
  };
}

function extractListPayload(data) {
  if (!data || typeof data !== 'object') {
    return { partners: [], totalCount: null, page: 1, limit: 50, totalPages: null };
  }

  const payload = data.data && typeof data.data === 'object' && !Array.isArray(data.data)
    ? data.data
    : data;

  const partners = extractPartnersArray(payload.partners != null ? payload : data);

  return {
    partners,
    totalCount: payload.total_count ?? payload.totalCount ?? null,
    page: payload.page ?? null,
    limit: payload.limit ?? null,
    totalPages: payload.total_pages ?? payload.totalPages ?? null,
  };
}

function extractPartnersArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.partners)) return data.partners;
  if (data.data && Array.isArray(data.data.partners)) return data.data.partners;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function extractPartnerFromResponse(data) {
  if (!data || typeof data !== 'object') return null;
  const candidate = data.partner ?? data.data?.partner ?? data.data ?? data;
  if (Array.isArray(candidate)) {
    return normalizePartnerRecord(candidate[0], 0);
  }
  return normalizePartnerRecord(candidate, 0);
}

/**
 * List partners (GET `admin-partners-list`).
 * Supports search, category, status, page, and limit query params.
 */
export async function fetchPartnersList(opts = {}) {
  try {
    const page = Math.max(1, parseInt(String(opts.page), 10) || 1);
    const limit = Math.max(1, parseInt(String(opts.limit), 10) || 50);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    const search = String(opts.search ?? '').trim();
    if (search) params.set('search', search);

    const category = String(opts.category ?? '').trim().toLowerCase();
    if (category) params.set('category', category);

    const status = String(opts.status ?? '').trim().toLowerCase();
    if (status) params.set('status', status);

    const url = `${API_BASE_URL}/admin-partners-list?${params.toString()}`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: parseErrorMessage(data, `HTTP ${response.status}: ${response.statusText}`),
      };
    }

    if (data.success === false) {
      return {
        success: false,
        error: parseErrorMessage(data, 'Failed to load partners'),
      };
    }

    const listPayload = extractListPayload(data);
    const seen = new Set();
    const partners = [];

    listPayload.partners.forEach((row, i) => {
      const partner = normalizePartnerRecord(row, i);
      if (!partner?.id) return;
      if (seen.has(partner.id)) return;
      seen.add(partner.id);
      partners.push(partner);
    });

    const totalCount = listPayload.totalCount ?? partners.length;
    const totalPages =
      listPayload.totalPages ??
      (totalCount != null ? Math.ceil(totalCount / limit) : null);

    return {
      success: true,
      data: {
        partners,
        page: listPayload.page ?? page,
        limit: listPayload.limit ?? limit,
        totalCount,
        totalPages,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to load partners',
    };
  }
}

/**
 * Create partner portal login (POST `admin-partners-create`).
 */
export async function createPartner({
  category,
  displayName,
  legalName,
  email,
  password,
  confirmPassword,
}) {
  try {
    const url = `${API_BASE_URL}/admin-partners-create`;

    const body = {
      category: String(category || 'restaurant').toLowerCase(),
      trading_name: String(displayName || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      password,
      confirm_password: confirmPassword,
    };

    const legal = String(legalName || '').trim();
    if (legal) {
      body.legal_name = legal;
    }

    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(parseErrorMessage(errorData, `HTTP ${response.status}: ${response.statusText}`));
    }

    const data = await response.json().catch(() => ({}));
    const partner = extractPartnerFromResponse(data);

    return {
      success: true,
      data: partner ?? {
        id: data.partner_id ?? data.id ?? `pt_${Date.now()}`,
        email: body.email,
        displayName: body.trading_name || '—',
        legalName: legal,
        category: body.category,
        partnerCode: data.partner_code ?? data.partnerCode ?? '',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to create partner',
    };
  }
}

/**
 * Update partner (POST `admin-partners-update`).
 */
export async function updatePartner(partnerId, {
  category,
  displayName,
  legalName,
  email,
  password,
  confirmPassword,
}) {
  try {
    const url = `${API_BASE_URL}/admin-partners-update`;
    const hasNewPassword =
      typeof password === 'string' &&
      password.length > 0 &&
      typeof confirmPassword === 'string' &&
      password === confirmPassword;

    const body = {
      partner_id: partnerId,
      category: String(category || 'restaurant').toLowerCase(),
      trading_name: String(displayName || '').trim(),
      legal_name: String(legalName || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      password: hasNewPassword ? password : '',
    };

    if (hasNewPassword) {
      body.confirm_password = confirmPassword;
    }

    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(parseErrorMessage(errorData, `HTTP ${response.status}: ${response.statusText}`));
    }

    const data = await response.json().catch(() => ({}));
    const partner = extractPartnerFromResponse(data);

    return {
      success: true,
      data: partner ?? {
        id: partnerId,
        email: body.email,
        displayName: body.trading_name || '—',
        legalName: body.legal_name,
        category: body.category,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to update partner',
    };
  }
}

/**
 * Delete partner (POST `admin-partners-delete`).
 */
export async function deletePartner(partnerId, reason) {
  try {
    const url = `${API_BASE_URL}/admin-partners-delete`;

    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        partner_id: partnerId,
        reason: String(reason || '').trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(parseErrorMessage(errorData, `HTTP ${response.status}: ${response.statusText}`));
    }

    const data = await response.json().catch(() => ({}));
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to delete partner',
    };
  }
}
