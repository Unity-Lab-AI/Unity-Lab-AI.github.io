/**
 * Google OAuth 2.0 (OpenID Connect) flow.
 * Stub: full implementation tracked in ADMIN_PORTAL_TODO.md AP-029 through AP-037.
 * Real flow uses `openid-client` library — initialized lazily because dev mode
 * doesn't need it (DEV_AUTH_BYPASS=true skips Google entirely).
 */

import type { AppEnv } from '../config/env.js';
import { isAllowedAdmin } from '../config/admin_allowlist.js';

interface InitiateResult {
  url: string;
  state: string;
  nonce: string;
}

/**
 * Phase 1 stub. Production implementation will:
 * 1. Generate state + nonce + PKCE verifier
 * 2. Construct Google authorization URL with hd=unityailab.com, prompt=select_account
 * 3. Store state/nonce/verifier in short-TTL backing store
 * 4. Return the URL
 */
export async function initiateGoogleOAuth(_env: AppEnv): Promise<InitiateResult> {
  throw new Error(
    'Google OAuth not yet wired. Tracked in ADMIN_PORTAL_TODO.md AP-029 through AP-037. ' +
    'For local dev, set DEV_AUTH_BYPASS=true in server/.env and use the dev login picker.',
  );
}

/**
 * Phase 1 stub. Production implementation will:
 * 1. Validate state matches stored value
 * 2. Exchange code for tokens (with PKCE)
 * 3. Verify ID token signature against Google JWKS
 * 4. Verify claims: iss, aud, exp, hd === unityailab.com, email_verified, nonce
 * 5. Verify email ∈ ADMIN_ALLOWLIST
 * 6. Return profile info
 */
export async function handleGoogleCallback(_env: AppEnv, _code: string, _state: string): Promise<{ email: string; name: string }> {
  throw new Error('Google OAuth callback not yet wired. See ADMIN_PORTAL_TODO.md AP-033.');
}

/** Used internally to gate any callback path */
export function verifyEmailAllowed(email: string): boolean {
  return isAllowedAdmin(email);
}
