# ADR-002: Auth provider

**Status:** Accepted (2026-04-25)
**Context:** AP-003, AP-028, AP-029

## Decision

**Google Workspace SSO via OAuth 2.0** with `hd=unityailab.com` claim verification + email allowlist (`sponge@`, `gee@`, `red@`, `alfreddo@unityailab.com`) + mandatory **WebAuthn / FIDO2** second factor (no SMS, no TOTP fallback). Library: `openid-client` for OAuth, `@simplewebauthn/server` for WebAuthn.

In **dev mode** only, `DEV_AUTH_BYPASS=true` enables a local "Dev Login" picker that issues a session JWT for any of the 4 admin emails without contacting Google or requiring WebAuthn. This env var is rejected in production startup (boot fails fast if NODE_ENV=production AND DEV_AUTH_BYPASS=true).

## Alternatives considered

| Option | Rejected because |
|---|---|
| **Local username + password** | Forbidden — credential stuffing target, password rotation overhead, no upside for a 4-person team |
| **Magic link email** | Phishable, slower UX, still needs OAuth-equivalent verification of unityailab.com domain |
| **Microsoft Entra ID (Azure AD)** | Wrong directory — admin emails are on `unityailab.com` which is presumably Google Workspace |
| **Auth0 / Clerk / Supabase Auth** | Vendor lock-in, monthly cost, third-party trust boundary added unnecessarily for 4 users |
| **Self-hosted IdP (Keycloak / Authentik)** | Operational burden disproportionate to 4-user scale |
| **Skip 2FA** | Phishing succeeds at >30% rate against named targets; 4 admins are now publicly listed = high spear-phish risk |
| **TOTP / SMS as primary 2FA** | Both phishable; WebAuthn is phishing-resistant by design |

## Consequences

- **Positive:** No password storage; phishing-resistant 2FA; trust boundary is Google's (already a critical dependency for email anyway); cheap (free for 4 users).
- **Negative:** Hard dependency on Google Workspace remaining usable; if Google account locked out, admin can't log in to portal until restored. Mitigated by 2-credential WebAuthn minimum + recovery flow via second admin (ACCOUNT_LIFECYCLE.md).
- **Required physical hardware:** each admin needs ≥2 hardware security keys (YubiKey 5 series ~$50, or equivalent). One-time cost, ~$400 total for the team.

## References

- `Docs/THREAT_MODEL.md` IR-1, IR-3
- `Docs/ACCOUNT_LIFECYCLE.md`
- ADMIN_PORTAL_TODO.md AP-003, AP-004, AP-028 through AP-043
