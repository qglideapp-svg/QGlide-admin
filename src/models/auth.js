/**
 * @typedef {Object} LoginCredentials
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} AuthResponse
 * @property {boolean} ok
 * @property {string} token
 * @property {{ email: string }} user
 */

export const AuthModel = {
  /** @param {LoginCredentials} creds */
  validateCredentials(creds) {
    const emailValid = /.+@.+\..+/.test(creds.email);
    const passwordValid = typeof creds.password === 'string' && creds.password.length > 0;
    return emailValid && passwordValid;
  },
};
