import { getAuthToken, SUPABASE_ANON_KEY } from './authService';

const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';

function parseErrorMessage(errorData, fallback) {
  if (!errorData || typeof errorData !== 'object') return fallback;
  const err = errorData.error ?? errorData.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && typeof err.message === 'string') return err.message;
  return fallback;
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
    const token = getAuthToken();

    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-create-influencer`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
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
