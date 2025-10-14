export async function login({ email, password }) {
  // TODO: wire real API
  // Simulate success and return token shape
  return { ok: true, token: 'mock-token', user: { email } };
}
