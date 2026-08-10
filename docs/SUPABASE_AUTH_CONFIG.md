# Supabase Auth Configuration (5-Day Session)

Configure the Supabase project `bvazoowmmiymbbhxoggo` before relying on the 5-day session lifecycle in production.

## Dashboard steps

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → project **bvazoowmmiymbbhxoggo**
2. Go to **Authentication** → **Settings** (or **JWT Settings**)
3. Apply these values:

| Setting | Value | Notes |
|---------|-------|-------|
| JWT expiry (access token) | `3600` (default) | Keep short-lived; the admin app refreshes automatically |
| Refresh token expiry | `432000` | 5 days in seconds |
| Refresh token rotation | Enabled (if available) | Recommended for security |

4. Save changes.

## Verification

After a fresh login in the admin app, check browser DevTools → **Application** → **Local Storage**:

- Key `authSession` should contain `accessToken`, `refreshToken`, `accessExpiresAt`, and `sessionExpiresAt`
- `sessionExpiresAt` should be approximately 5 days after login

## Rollout note

Existing users with only the legacy `authToken` key (no `authSession`) will be prompted to log in again once. This is expected.
