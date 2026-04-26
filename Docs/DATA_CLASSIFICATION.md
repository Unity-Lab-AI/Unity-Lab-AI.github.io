# DATA_CLASSIFICATION.md — Unity AI Lab Admin Portal

> **Created:** 2026-04-25 — fulfills AP-012
> **Scope:** all data handled by the admin portal backend, frontend, and proxy

---

## Classification tiers

| Tier | Definition | Storage requirements | Examples |
|---|---|---|---|
| **PUBLIC** | Safe for anyone on the internet | Anywhere, including the public GitHub repo | Marketing site content, open-source code, ADRs, this doc, threat model |
| **INTERNAL** | Routine operational info — admins only, low risk if leaked | Backend DB, signed URL access, audit-logged | Member presence, bot status, deploy event timestamps |
| **RESTRICTED** | Business-sensitive — admins only, real damage if leaked | Backend DB only, encrypted at rest, audit-logged on every read | Admin chat content, file uploads (default), bot intent payloads |
| **SECRET** | High-impact compromise material | Secrets manager only, never in code/repo/logs, rotated | OAuth client secret, GitHub App private key, JWT signing keys, bot signing private keys, DB credentials, R2 access keys |

---

## Data type → classification map

| Data type | Class | Where it lives | Access pattern |
|---|---|---|---|
| Site marketing content | PUBLIC | GitHub Pages (`Website/` repo) | World-readable |
| Admin portal source code | PUBLIC | GitHub Pages repo (`admin/`, `server/`, `proxy/`) | World-readable (open source) |
| ADRs + threat model + this doc | PUBLIC | `Docs/` in repo | World-readable |
| User identity (email, name, role) | INTERNAL | Backend DB `users` table | Self + other admins |
| Session state (JWT claims, IP, UA) | INTERNAL | Backend DB `sessions` | Self only (or OWNER for admin) |
| WebAuthn credential metadata (label, last-used) | INTERNAL | Backend DB `webauthn_credentials` | Self only |
| WebAuthn public key | INTERNAL | Backend DB | Self + auth verifier |
| Audit log (action, actor, target, timestamp) | INTERNAL | Backend DB `audit_log` (append-only) | OWNER read; nobody can modify |
| Room metadata (name, members, kind) | INTERNAL | Backend DB `rooms`, `room_members` | Members of that room |
| Chat messages (text content) | RESTRICTED | Backend DB `messages` | Members of that room only |
| Bot metadata (name, role, last-seen) | INTERNAL | Backend DB `bots` | Owner admin + other admins (read) |
| Bot signing public key | INTERNAL | Backend DB `bots.public_key` | Server uses to verify; not exposed to other clients |
| File metadata (filename, size, mime, sha256, uploader) | RESTRICTED | Backend DB `files` | Members of the file's room |
| File contents | RESTRICTED (default) → SECRET (case-by-case marked) | Object storage (R2 / S3) — private bucket | Signed URLs, 5-min TTL, audit-logged |
| Job queue payloads (repo write intents) | RESTRICTED | Backend DB `jobs` | Supervisors of relevant repo |
| Deploy event payloads (commits, actors, URLs) | INTERNAL | Backend DB `deploy_events` | All admins |
| OAuth ID token / access token (Google, transient) | SECRET | Server memory only — never persisted | Server only, single-flow lifetime |
| Session JWT (browser cookie) | SECRET (short-lived) | HttpOnly cookie on admin browser | Client browser only (HttpOnly), server validates |
| Bot enrollment token (one-shot) | SECRET | Backend DB `bots.enrollment_token_hash` (hashed); plaintext only in single download stream | Bound to single download → invalidated on first use |
| Bot refresh token | SECRET | Bot's local `.claude/.env` (NEVER committed); server-side hashed | Bot only |
| Bot access token (15min) | SECRET | Bot memory only, never persisted | Bot only |
| Bot signing private key (Ed25519) | SECRET | Bot's local `.claude/local-keys/` (NEVER committed) | Bot only — never sent to server |
| Server JWT signing key (Ed25519) | SECRET | Secrets manager → loaded into server memory at boot | Server only |
| Server CSRF cookie key | SECRET | Secrets manager | Server only |
| Google OAuth client secret | SECRET | Secrets manager | Server only |
| GitHub App private key (PEM) | SECRET | Secrets manager | Server only |
| GitHub webhook HMAC secret | SECRET | Secrets manager | Server only |
| R2 / S3 access key + secret | SECRET | Secrets manager | Server only |
| DB connection string (with password) | SECRET | Secrets manager | Server only |

---

## Data placement rules (HARD)

1. **Nothing classified RESTRICTED or SECRET ever lives in the public repo.** Period. Including in `.env.example` (use placeholder values), test fixtures, README examples, comments.
2. **Nothing classified SECRET ever appears in logs.** The logger redacts known secret patterns (Bearer, JWT, sk_, pk_, etc.) before writing.
3. **Nothing classified SECRET is ever sent to the client.** Server signs tokens client-side gets opaque value; private keys never leave the trust boundary they're generated in.
4. **`.claude/` is gitignored entirely.** Per-admin proxy.js downloads, bot keys, refresh tokens, env files all live in `.claude/` and never reach the public repo.
5. **Object storage (R2) is private by default.** No public-read buckets. All access via signed URL, 5-min TTL, audit-logged.

---

## Encryption

- **In transit:** TLS 1.3 only on all admin-portal traffic (Cloudflare termination + backend). HSTS preloaded.
- **At rest:**
  - DB: managed Postgres encrypts at rest by default (Neon/Supabase). For self-hosted SQLite, OS-level disk encryption (LUKS / BitLocker) is required.
  - R2: encrypted at rest by Cloudflare, plus optional client-side encryption for SECRET-tier files.
  - Secrets manager: provider-default encryption (Cloudflare/Doppler/1Password all use HSM-backed encryption).
- **Bot private keys:** generated client-side in proxy.js, stored in `.claude/local-keys/` with file permissions `0600`. Never transmitted.

---

*DATA_CLASSIFICATION.md — review every 6 months. New data types added by PR with explicit classification. Default class for unspecified data = RESTRICTED.*
