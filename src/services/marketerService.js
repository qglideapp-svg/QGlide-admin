import { getAuthToken, SUPABASE_ANON_KEY } from './authService';

const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';

function parseErrorMessage(errorData, fallback) {
  if (!errorData || typeof errorData !== 'object') return fallback;
  const err = errorData.error ?? errorData.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && typeof err.message === 'string') return err.message;
  return fallback;
}

function normalizeMarketerRecord(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id ?? raw.marketer_id ?? raw.user_id ?? `mk_${index}`;
  const email = raw.email ?? raw.login_email ?? '';
  const displayName =
    raw.display_name ?? raw.displayName ?? raw.full_name ?? raw.name ?? '';
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
    createdAt,
  };
}

function extractMarketersArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.marketers)) return data.marketers;
  if (data.data && Array.isArray(data.data.marketers)) return data.data.marketers;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.users)) return data.users;
  return [];
}

/**
 * List marketers (GET `admin-marketers-list`, same headers as curl: Bearer + apikey).
 * @param {{ page?: number, limit?: number }} opts
 */
export async function fetchMarketersList(opts = {}) {
  try {
    const token = getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found. Please login first.',
      };
    }

    const page = Math.max(1, parseInt(String(opts.page), 10) || 1);
    const limit = Math.max(1, parseInt(String(opts.limit), 10) || 50);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    const url = `${API_BASE_URL}/admin-marketers-list?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
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
    const rawList = extractMarketersArray(data);
    const seen = new Set();
    const marketers = [];
    rawList.forEach((row, i) => {
      const m = normalizeMarketerRecord(row, i);
      if (!m || !m.email) return;
      const key = m.email.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      marketers.push(m);
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
        marketers,
        page,
        limit,
        totalCount,
        totalPages,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to load marketers',
    };
  }
}

/**
 * Create a marketer account via Supabase edge function `admin-create-marketer`.
 */
export async function createMarketer({ displayName, email, password, confirmPassword }) {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-create-marketer`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...(displayName?.trim()
          ? { display_name: displayName.trim() }
          : {}),
        email,
        password,
        confirm_password: confirmPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ admin-create-marketer error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorData,
      });
      throw new Error(parseErrorMessage(errorData, `HTTP ${response.status}: ${response.statusText}`));
    }

    const data = await response.json().catch(() => ({}));
    console.log('✅ admin-create-marketer API response:', data);
    if (Object.keys(data).length > 0) {
      console.log('✅ admin-create-marketer API response (JSON):\n', JSON.stringify(data, null, 2));
    }
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to create marketer',
    };
  }
}

/**
 * Update marketer (`PATCH admin-update-marketer`).
 * Body matches API: marketer_id, display_name, email, password (use "" to leave unchanged).
 */
export async function updateMarketer(marketerId, { displayName, email, password, confirmPassword }) {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-update-marketer`;
    const hasNewPassword =
      typeof password === 'string' &&
      password.length > 0 &&
      typeof confirmPassword === 'string' &&
      password === confirmPassword;

    const body = {
      marketer_id: marketerId,
      display_name: (displayName || '').trim(),
      email,
      password: hasNewPassword ? password : '',
    };

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
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
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to update marketer',
    };
  }
}

/**
 * Delete marketer (POST `admin-delete-marketer`).
 * @param {string} marketerId
 * @param {string} reason
 */
export async function deleteMarketer(marketerId, reason) {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-delete-marketer`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        marketer_id: marketerId,
        reason: (reason || '').trim(),
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
      error: error.message || 'Failed to delete marketer',
    };
  }
}
