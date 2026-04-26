/**
 * WebAuthn (FIDO2) — second factor.
 * Stub for Phase 1. Full impl tracked in ADMIN_PORTAL_TODO.md AP-038 through AP-043.
 * Library: @simplewebauthn/server
 *
 * The real implementation:
 * - generateRegistrationOptions / verifyRegistrationResponse (enrollment)
 * - generateAuthenticationOptions / verifyAuthenticationResponse (login + re-auth)
 * - Stores credential ID + COSE public key + counter in webauthn_credentials table
 * - Counter clone-detection on every auth (counter must increase)
 */

export const WEBAUTHN_NOT_WIRED = true;

export function webauthnPlaceholder(): never {
  throw new Error(
    'WebAuthn not yet wired. Tracked in ADMIN_PORTAL_TODO.md AP-038 through AP-043. ' +
    'In dev mode, WebAuthn is bypassed when DEV_AUTH_BYPASS=true.',
  );
}
