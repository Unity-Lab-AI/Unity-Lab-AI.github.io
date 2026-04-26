/**
 * Admin allowlist — the ONLY emails permitted to authenticate to the portal.
 *
 * Per ADMIN_PORTAL_TODO.md AP-016. Modifications require:
 *   1. PR with peer review by another admin
 *   2. Signed commit
 *   3. Audit log entry post-merge
 *
 * The OAuth callback verifies BOTH:
 *   - the Google ID token's `hd` claim equals `unityailab.com`
 *   - the email is in this allowlist
 *
 * Removing an email here does NOT auto-revoke existing sessions — use the portal
 * suspend/remove flow per ACCOUNT_LIFECYCLE.md.
 */

export const ADMIN_ALLOWLIST = [
  'sponge@unityailab.com',
  'gee@unityailab.com',
  'red@unityailab.com',
  'alfreddo@unityailab.com',
] as const;

export type AdminEmail = (typeof ADMIN_ALLOWLIST)[number];

export function isAllowedAdmin(email: string | undefined | null): email is AdminEmail {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (ADMIN_ALLOWLIST as readonly string[]).includes(normalized);
}

/**
 * Display info per admin. Used by frontend dev-bypass picker.
 * Real names redacted in source — display picks "<handle>@unityailab.com".
 */
export const ADMIN_DISPLAY: Record<AdminEmail, { handle: string }> = {
  'sponge@unityailab.com': { handle: 'Sponge' },
  'gee@unityailab.com': { handle: 'Gee' },
  'red@unityailab.com': { handle: 'Red' },
  'alfreddo@unityailab.com': { handle: 'Alfreddo' },
};
