import {
  clearAuthSession,
  getValidAccessToken,
  refreshAccessToken,
} from './authService';

export class AuthError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'AuthError';
  }
}

export async function authenticatedFetch(url, options = {}) {
  const token = await getValidAccessToken();
  if (!token) {
    throw new AuthError('Session expired');
  }

  const makeRequest = (accessToken) =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

  let response = await makeRequest(token);

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      clearAuthSession();
      window.location.href = '/login';
      throw new AuthError('Session expired');
    }

    const newToken = await getValidAccessToken();
    if (!newToken) {
      clearAuthSession();
      window.location.href = '/login';
      throw new AuthError('Session expired');
    }

    response = await makeRequest(newToken);
  }

  return response;
}
