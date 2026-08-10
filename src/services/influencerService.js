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

function normalizeInfluencerRecord(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id ?? raw.influencer_id ?? raw.user_id ?? `inf_${index}`;
  const email = raw.email ?? raw.login_email ?? '';
  const displayName =
    raw.display_name ?? raw.displayName ?? raw.full_name ?? raw.name ?? '';
  const phone = raw.phone ?? raw.phone_number ?? '';
  const createdRaw = raw.created_at ?? raw.createdAt ?? raw.created ?? null;
  let createdAt = new Date().toISOString();
  if (createdRaw != null) {
    const d = new Date(createdRaw);
    if (!Number.isNaN(d.getTime())) createdAt = d.toISOString();
  }
  return {
    id: String(id),
    email: String(email).toLowerCase(),
    displayName: String(displayName || '').trim() || '—',
    phone: String(phone || '').trim() || '—',
    createdAt,
  };
}

function extractInfluencersArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.influencers)) return data.influencers;
  if (data.data && Array.isArray(data.data.influencers)) return data.data.influencers;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.users)) return data.users;
  return [];
}

/**
 * List influencers (GET `admin-influencers-list`).
 * @param {{ page?: number, limit?: number }} opts
 */
export async function fetchInfluencersList(opts = {}) {
  try {
    const page = Math.max(1, parseInt(String(opts.page), 10) || 1);
    const limit = Math.max(1, parseInt(String(opts.limit), 10) || 50);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    const url = `${API_BASE_URL}/admin-influencers-list?${params.toString()}`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: parseErrorMessage(errorData, `HTTP ${response.status}: ${response.statusText}`),
      };
    }

    const data = await response.json().catch(() => ({}));
    const rawList = extractInfluencersArray(data);
    const seen = new Set();
    const influencers = [];
    rawList.forEach((row, i) => {
      const inf = normalizeInfluencerRecord(row, i);
      if (!inf || !inf.email) return;
      const key = inf.email.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      influencers.push(inf);
    });

    const totalCount =
      data.total_count ??
      data.totalCount ??
      data.total ??
      data.count ??
      data.data?.total_count ??
      data.data?.totalCount ??
      null;
    const totalPages =
      data.total_pages ??
      data.totalPages ??
      data.data?.total_pages ??
      data.data?.totalPages ??
      (totalCount != null ? Math.ceil(totalCount / limit) : null);

    return {
      success: true,
      data: {
        influencers,
        page,
        limit,
        totalCount,
        totalPages,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to load influencers',
    };
  }
}

/**
 * Create an influencer account via Supabase edge function `admin-create-influencer`.
 */
export async function createInfluencer({
  email,
  password,
  confirm_password,
  display_name,
  phone,
}) {
  try {
    const url = `${API_BASE_URL}/admin-create-influencer`;

    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        confirm_password,
        display_name,
        phone,
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
      error: error.message || 'Failed to create influencer',
    };
  }
}
