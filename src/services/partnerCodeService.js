import { authenticatedFetch } from './apiClient';
import { SUPABASE_ANON_KEY } from './authService';

const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';

function parseErrorMessage(errorData, fallback) {
  if (!errorData || typeof errorData !== 'object') return fallback;
  const err = errorData.error ?? errorData.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && typeof err.message === 'string') return err.message;
  return fallback;
}

function parseDate(value) {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function normalizePartnerCodeRecord(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;

  const id = raw.id ?? raw.code_id ?? raw.partner_code_id ?? `code_${index}`;
  const codeType = raw.code_type ?? raw.codeType ?? raw.type ?? 'primary';
  const codeValue =
    raw.code ??
    raw.alphanumeric_code ??
    raw.alphanumericCode ??
    raw.partner_code ??
    raw.partnerCode ??
    '';

  return {
    id: String(id),
    codeType: String(codeType).toLowerCase(),
    code: String(codeValue || '').trim(),
    label: String(raw.label ?? '').trim(),
    parentCodeId: raw.parent_code_id ?? raw.parentCodeId ?? null,
    branchId: raw.branch_id ?? raw.branchId ?? null,
    validUntil: parseDate(raw.valid_until ?? raw.validUntil),
    isActive: Boolean(raw.is_active ?? raw.isActive ?? raw.active ?? false),
    qrCodeUrl: raw.qr_code_url ?? raw.qrCodeUrl ?? null,
    createdAt: parseDate(raw.created_at ?? raw.createdAt),
  };
}

function extractCodesArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.codes)) return data.codes;
  if (data.data && Array.isArray(data.data.codes)) return data.data.codes;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.code) return [data.code];
  if (data.data?.code) return [data.data.code];
  return [];
}

function extractCodeFromGenerateResponse(data) {
  if (!data || typeof data !== 'object') return null;
  const candidate = data.code ?? data.data?.code ?? data.data ?? data;
  if (Array.isArray(candidate)) {
    return normalizePartnerCodeRecord(candidate[0], 0);
  }
  return normalizePartnerCodeRecord(candidate, 0);
}

/**
 * List partner codes (GET `admin-partner-codes-list`).
 */
export async function fetchPartnerCodes(partnerId) {
  try {
    const params = new URLSearchParams({ partner_id: String(partnerId) });
    const url = `${API_BASE_URL}/admin-partner-codes-list?${params.toString()}`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: { apikey: SUPABASE_ANON_KEY },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      if (response.status === 404) {
        return { success: true, data: { codes: [] } };
      }
      return {
        success: false,
        error: parseErrorMessage(data, `HTTP ${response.status}: ${response.statusText}`),
        data: { codes: [] },
      };
    }

    const rawList = extractCodesArray(data);
    const codes = rawList.map(normalizePartnerCodeRecord).filter(Boolean);

    return { success: true, data: { codes } };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to load partner codes',
      data: { codes: [] },
    };
  }
}

/**
 * Generate partner code (POST `admin-partner-codes-generate`).
 */
export async function generatePartnerCode({
  partnerId,
  codeType = 'primary',
  parentCodeId,
  branchId,
  label,
  validUntil,
  activate = true,
}) {
  try {
    const url = `${API_BASE_URL}/admin-partner-codes-generate`;
    const normalizedType = codeType === 'sub_code' ? 'sub_code' : 'primary';

    const body = {
      partner_id: String(partnerId),
      code_type: normalizedType,
      activate: Boolean(activate),
    };

    if (validUntil) {
      body.valid_until = validUntil;
    }

    if (normalizedType === 'sub_code') {
      body.parent_code_id = String(parentCodeId || '');
      if (branchId?.trim()) body.branch_id = branchId.trim();
      if (label?.trim()) body.label = label.trim();
    }

    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      throw new Error(parseErrorMessage(data, `HTTP ${response.status}: ${response.statusText}`));
    }

    const code = extractCodeFromGenerateResponse(data);

    return {
      success: true,
      data: code ?? data.data ?? data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to generate partner code',
    };
  }
}

export function defaultValidUntilIso() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  d.setMonth(11);
  d.setDate(31);
  d.setHours(23, 59, 59, 0);
  return d.toISOString();
}

export function toValidUntilIso(dateInputValue) {
  if (!dateInputValue) return null;
  const d = new Date(`${dateInputValue}T23:59:59`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function toDateInputValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}
