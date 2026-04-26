# Security Policy

> Per ADMIN_PORTAL_TODO.md AP-248.

## Reporting a Vulnerability

If you've found a security issue in this project, please report it privately to **security@unityailab.com**.

**Do not file a public GitHub issue for security vulnerabilities.**

Include in your report:
- A clear description of the issue
- Steps to reproduce (if applicable)
- The version / commit SHA you found it on
- Your assessment of impact (e.g. info disclosure, auth bypass, RCE, etc.)
- Any proof-of-concept code or screenshots

## Response SLA

| Severity | Acknowledgment | Initial fix or mitigation |
|---|---|---|
| **Critical** (RCE, auth bypass, data exfiltration) | Within 24 hours | Within 7 days |
| **High** (privilege escalation, sensitive info disclosure) | Within 72 hours | Within 14 days |
| **Medium** (XSS in admin-only context, IDOR with limited impact) | Within 7 days | Within 30 days |
| **Low** (informational, hardening suggestions) | Within 14 days | Best effort |

We will keep you informed of progress and credit you (with your consent) in the fix's release notes.

## Supported Versions

This project is in active development. Security fixes are applied to:

- `main` branch — always
- The most recent tagged release (`v0.x.y` or `v1.x.y`)

Older releases are not patched — upgrade to the latest version.

## In-Scope

- The admin portal backend (`server/`)
- The admin portal frontend (`admin/`)
- The MCP proxy template (`proxy/`)
- The `.claude/` template integration
- Documented APIs (`/api/*`, `/ws`, `/ws/bot`, `/webhooks/github`)

## Out-of-Scope

- The marketing site (`index.html`, `about/`, `ai/`, `apps/`, etc.) — separate scope; report directly to that codebase
- Self-XSS or social-engineering issues that require admin cooperation
- Issues in third-party dependencies — please report directly to the upstream project, then notify us so we can patch our pinned version
- Theoretical attacks without a viable exploitation path

## Hall of Fame

Researchers who responsibly disclose verified issues will be listed here (with consent).

_(no entries yet)_

## Cryptographic Material

This project uses:
- **Ed25519** (via `@noble/ed25519` + `jose`) — JWT signing, bot message signing
- **HMAC-SHA-256** — CSRF tokens, GitHub webhook verification, local-storage signed URLs
- **scrypt** (Node built-in) — password hashing
- **TLS 1.3** — required at the reverse proxy (Caddy / nginx / Cloudflare)

If you find a cryptographic implementation issue (timing oracle, key reuse, weak random, etc.), please prioritize the report.

## Coordinated Disclosure

We follow industry-standard coordinated disclosure:
1. You report → we acknowledge within the SLA above
2. We work on a fix; you optionally help validate
3. We release the fix
4. You may publish details after the fix has been deployed for at least 7 days (or sooner with our explicit go-ahead)

---

_Last updated: 2026-04-25_
