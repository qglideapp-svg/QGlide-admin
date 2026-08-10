const SUPABASE_AUTH_BASE = 'https://bvazoowmmiymbbhxoggo.supabase.co/auth/v1';
const SUPABASE_LOGIN_URL = `${SUPABASE_AUTH_BASE}/token?grant_type=password`;
const SUPABASE_REFRESH_URL = `${SUPABASE_AUTH_BASE}/token?grant_type=refresh_token`;
const ADMIN_LOGIN_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1/admin-login';
const MARKETERS_LIST_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1/admin-marketers-list';

/** Supabase anon (public) key — required on many edge function requests as `apikey`. */
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2YXpvb3dtbWl5bWJiaHhvZ2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTQzMjQsImV4cCI6MjA3NTI3MDMyNH0.9vdJHTTnW38CctYwD9GZOvoX_SEu58FLu81mbjQFBdk';

export const SESSION_LIFETIME_MS = 5 * 24 * 60 * 60 * 1000;
const REFRESH_BUFFER_MS = 5 * 60 * 1000;
const AUTH_SESSION_KEY = 'authSession';
const LEGACY_AUTH_TOKEN_KEY = 'authToken';
const NON_ADMIN_ROLES = new Set(['marketer', 'influencer', 'driver', 'user', 'rider', 'passenger']);

let refreshPromise = null;

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
};

const collectRoleValues = (source) => {
  if (!source || typeof source !== 'object') return [];

  return [
    source.role,
    source.user_role,
    source.user_type,
    source.account_type,
    source.type,
    source.app_metadata?.role,
    source.app_metadata?.user_type,
    source.app_metadata?.account_type,
    source.user_metadata?.role,
    source.user_metadata?.user_type,
    source.user_metadata?.account_type,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
};

export const isAdminAuthPayload = (authPayload) => {
  if (!authPayload?.access_token) return false;

  const roles = [
    ...collectRoleValues(authPayload.user),
    ...collectRoleValues(decodeJwtPayload(authPayload.access_token)),
  ];

  if (roles.some((role) => NON_ADMIN_ROLES.has(role))) {
    return false;
  }

  return true;
};

const normalizeAuthPayload = (data) => {
  if (!data || typeof data !== 'object') return null;

  const sources = [
    data,
    data.data,
    data.session,
    data.data?.session,
    data.auth,
    data.data?.auth,
  ].filter(Boolean);

  for (const source of sources) {
    const accessToken = source.access_token || source.accessToken;
    if (!accessToken) continue;

    return {
      access_token: accessToken,
      refresh_token: source.refresh_token || source.refreshToken,
      expires_in: source.expires_in ?? source.expiresIn,
      expires_at: source.expires_at ?? source.expiresAt,
      user: source.user || data.user || data.data?.user,
    };
  }

  return null;
};

const requestSupabasePasswordLogin = async (email, password) => {
  const response = await fetch(SUPABASE_LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error_description || data.msg || data.message || 'Login failed');
  }

  const authPayload = normalizeAuthPayload(data);
  if (!authPayload) {
    throw new Error('Login failed');
  }

  return authPayload;
};

const requestAdminLogin = async (email, password) => {
  const response = await fetch(ADMIN_LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || data.error_description || 'Login failed');
  }

  const authPayload = normalizeAuthPayload(data);
  if (!authPayload) {
    throw new Error('Login failed');
  }

  return authPayload;
};

const extractMarketerEmails = (data) => {
  const rawList = Array.isArray(data)
    ? data
    : Array.isArray(data?.marketers)
      ? data.marketers
      : Array.isArray(data?.data?.marketers)
        ? data.data.marketers
        : Array.isArray(data?.data)
          ? data.data
          : [];

  return rawList
    .map((entry) => String(entry?.email || entry?.login_email || '').trim().toLowerCase())
    .filter(Boolean);
};

const isRegisteredMarketerAccount = async (accessToken, email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return false;

  try {
    const response = await fetch(`${MARKETERS_LIST_URL}?page=1&limit=500`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json().catch(() => ({}));
    return extractMarketerEmails(data).includes(normalizedEmail);
  } catch {
    return false;
  }
};

const parseSession = (raw) => {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const computeAccessExpiresAt = (authResponse) => {
  if (authResponse.expires_at) {
    return authResponse.expires_at * 1000;
  }

  if (authResponse.expires_in) {
    return Date.now() + authResponse.expires_in * 1000;
  }

  return Date.now() + 3600 * 1000;
};

const persistSession = (session) => {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(LEGACY_AUTH_TOKEN_KEY, session.accessToken);
};

export const storeAuthSession = (authResponse) => {
  const now = Date.now();
  const session = {
    accessToken: authResponse.access_token,
    refreshToken: authResponse.refresh_token,
    accessExpiresAt: computeAccessExpiresAt(authResponse),
    sessionExpiresAt: now + SESSION_LIFETIME_MS,
  };

  persistSession(session);
  return session;
};

export const getAuthSession = () => {
  const session = parseSession(localStorage.getItem(AUTH_SESSION_KEY));
  if (session?.accessToken) {
    return session;
  }

  const legacyToken = localStorage.getItem(LEGACY_AUTH_TOKEN_KEY);
  if (legacyToken) {
    return null;
  }

  return null;
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
  refreshPromise = null;
};

export const isSessionExpired = (session = getAuthSession()) => {
  if (!session) return true;
  return Date.now() >= session.sessionExpiresAt;
};

export const isAccessTokenExpired = (session = getAuthSession()) => {
  if (!session) return true;
  return Date.now() >= session.accessExpiresAt - REFRESH_BUFFER_MS;
};

export const loginUser = async (email, password) => {
  try {
    let authPayload = null;
    let adminLoginError = null;

    try {
      authPayload = await requestAdminLogin(email, password);
    } catch (error) {
      adminLoginError = error;
      try {
        authPayload = await requestSupabasePasswordLogin(email, password);
      } catch (supabaseError) {
        throw adminLoginError || supabaseError;
      }
    }

    if (!isAdminAuthPayload(authPayload)) {
      throw new Error('Access denied. Admin credentials only.');
    }

    const loginEmail = authPayload.user?.email || email;
    if (await isRegisteredMarketerAccount(authPayload.access_token, loginEmail)) {
      throw new Error('Access denied. Admin credentials only.');
    }

    return { success: true, data: authPayload };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const refreshAccessToken = async () => {
  const session = getAuthSession();
  if (!session?.refreshToken || isSessionExpired(session)) {
    clearAuthSession();
    return false;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(SUPABASE_REFRESH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      });

      if (!response.ok) {
        clearAuthSession();
        return false;
      }

      const data = await response.json();
      const refreshedSession = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || session.refreshToken,
        accessExpiresAt: computeAccessExpiresAt(data),
        sessionExpiresAt: session.sessionExpiresAt,
      };

      persistSession(refreshedSession);
      return true;
    } catch {
      clearAuthSession();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const ensureValidSession = async () => {
  const session = getAuthSession();
  if (!session) {
    if (localStorage.getItem(LEGACY_AUTH_TOKEN_KEY)) {
      clearAuthSession();
    }
    return false;
  }

  const roles = collectRoleValues(decodeJwtPayload(session.accessToken));
  if (roles.some((role) => NON_ADMIN_ROLES.has(role))) {
    clearAuthSession();
    return false;
  }

  if (isSessionExpired(session)) {
    clearAuthSession();
    return false;
  }

  if (isAccessTokenExpired(session)) {
    return refreshAccessToken();
  }

  return true;
};

export const getValidAccessToken = async () => {
  const isValid = await ensureValidSession();
  if (!isValid) {
    return null;
  }

  return getAuthSession()?.accessToken || null;
};

/** @deprecated Use getValidAccessToken or storeAuthSession instead */
export const storeAuthToken = (token) => {
  localStorage.setItem(LEGACY_AUTH_TOKEN_KEY, token);
};

/** @deprecated Use getValidAccessToken instead */
export const getAuthToken = () => {
  return getAuthSession()?.accessToken || localStorage.getItem(LEGACY_AUTH_TOKEN_KEY);
};

export const logoutUser = async () => {
  const token = getAuthSession()?.accessToken || localStorage.getItem(LEGACY_AUTH_TOKEN_KEY);

  try {
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch('https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1/admin-logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Logout failed');
    }

    clearAuthSession();
    return { success: true };
  } catch (error) {
    console.error('Logout API Error:', error);
    clearAuthSession();
    return { success: false, error: error.message };
  }
};

/** @deprecated Use clearAuthSession instead */
export const clearAuthToken = () => {
  clearAuthSession();
};
