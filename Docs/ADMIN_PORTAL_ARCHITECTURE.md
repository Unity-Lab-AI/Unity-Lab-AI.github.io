# ADMIN_PORTAL_ARCHITECTURE.md — Unity AI Lab

> **Created:** 2026-04-25
> **Status:** PLANNING — code skeleton landing this session, full implementation tracked in `ADMIN_PORTAL_TODO.md` (265 tasks)

---

## Unified server model

Per user requirement: ONE Node server runs everything in both dev and prod. The marketing site, admin portal frontend, admin backend APIs, WebSocket, and visitor tracking all live in a single process.

```
┌─────────────────────────────────────────────────────────────────────┐
│   ONE NODE PROCESS (server/src/index.ts) — Hono + @hono/node-server │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  DEV MODE (npm run dev)                                     │   │
│   │  - Vite middleware mounted: HMR for marketing + admin       │   │
│   │  - Hono routes: /api/*, /ws, /webhooks/*                    │   │
│   │  - SQLite (server/data/dev.db) — auto-created               │   │
│   │  - DEV_AUTH_BYPASS=true → skip Google OAuth, dev fixture    │   │
│   │  - All on http://localhost:3000                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  PROD MODE (npm run start, on VPS)                          │   │
│   │  - Serves prebuilt dist/ as static                          │   │
│   │  - Hono routes: /api/*, /ws, /webhooks/*                    │   │
│   │  - Postgres (DATABASE_URL=...)                              │   │
│   │  - Real Google OAuth + WebAuthn                             │   │
│   │  - All on the VPS port (typically 8080 behind nginx/caddy)  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  GH PAGES STATIC DEPLOY (npm run build:static)              │   │
│   │  - Outputs marketing pages + admin frontend to dist/        │   │
│   │  - NO backend (GH Pages can't run Node)                     │   │
│   │  - Admin frontend's API_BASE_URL must point to a hosted     │   │
│   │    backend (e.g. https://admin.unityailab.com or VPS)       │   │
│   │  - Use case: marketing-only mirror; admin features unusable │   │
│   │    unless a backend is reachable                            │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Local dev flow (the user's stated requirement)

1. Admin clones the repo: `git clone Unity-Lab-AI/Unity-Lab-AI.github.io`
2. `npm install`
3. `cp server/.env.example server/.env` — local dev defaults work out of the box
4. `npm run dev`
5. Browser auto-opens `http://localhost:3000/admin/login`
6. Click "Dev Login as <admin>" — picks one of the 4 admins from a dropdown (DEV_AUTH_BYPASS=true)
7. Lands in admin dashboard
8. Click "Enroll Bot" → downloads `proxy.js` configured for `ws://localhost:3000/ws/bot`
9. Save proxy.js to `~/.claude/proxy/` (or wherever, per admin choice)
10. Admin updates `~/.claude/settings.local.json` to register the proxy as MCP server
11. Restart Claude Code via `start.bat`
12. Bot connects to localhost backend, appears as `online` in admin dashboard within 30s
13. Admin can post to BOT_BUS room from the portal; the local Claude Code instance receives the message via MCP

For across-the-web testing: same flow but `npm run dev` is replaced by deploying to a VPS, and the proxy.js connects to `wss://admin.unityailab.com/ws/bot` instead of localhost.

---

## Repository layout (inside existing `Website/` repo)

```
Website/
├── (existing marketing site files: index.html, about/, ai/, apps/, etc.)
├── admin/                          ← admin portal FRONTEND (deploys to /admin)
│   ├── index.html                  ← login page
│   ├── dashboard.html              ← main app shell
│   ├── styles/
│   │   ├── dark.css                ← shared dark theme (matches marketing site palette)
│   │   ├── login.css
│   │   └── dashboard.css
│   ├── js/
│   │   ├── config.js               ← runtime config: API_BASE_URL, WS_URL
│   │   ├── api.js                  ← fetch wrapper with CSRF + session
│   │   ├── auth.js                 ← OAuth + WebAuthn helpers
│   │   ├── ws-client.js            ← WebSocket client with reconnect
│   │   ├── chat.js                 ← chat UI logic
│   │   ├── files.js                ← file upload/download
│   │   └── bots.js                 ← bot management UI
│   └── README.md
│
├── server/                         ← admin BACKEND + unified Node entry (RUN by npm run dev/start)
│   ├── package.json                ← server deps (hono, drizzle, jsonwebtoken, etc.)
│   ├── tsconfig.json
│   ├── .env.example                ← documented env vars (NEVER .env.real)
│   ├── README.md
│   ├── src/
│   │   ├── index.ts                ← entry: starts Hono + @hono/node-server, mounts vite middleware in dev
│   │   ├── config/
│   │   │   ├── env.ts              ← env var loading + validation (zod)
│   │   │   └── admin_allowlist.ts  ← the 4 admin emails (sponge/gee/red/alfreddo)
│   │   ├── auth/
│   │   │   ├── oauth.ts            ← Google OAuth flow
│   │   │   ├── webauthn.ts         ← @simplewebauthn server-side
│   │   │   ├── session.ts          ← JWT issue/verify/revoke
│   │   │   └── dev_bypass.ts       ← DEV_AUTH_BYPASS shortcut
│   │   ├── db/
│   │   │   ├── connection.ts       ← drizzle + better-sqlite3 (dev) or pg (prod)
│   │   │   ├── schema.ts           ← drizzle schema definitions
│   │   │   └── migrate.ts          ← runs SQL migrations on boot
│   │   ├── middleware/
│   │   │   ├── security.ts         ← CSP, HSTS, X-Frame-Options, etc.
│   │   │   ├── session.ts          ← parse session JWT from cookie
│   │   │   ├── csrf.ts             ← double-submit CSRF
│   │   │   ├── rateLimit.ts        ← per-IP + per-user rate limiting
│   │   │   ├── audit.ts            ← emits audit_log entries
│   │   │   └── error.ts            ← error handler with structured response
│   │   ├── api/
│   │   │   ├── health.ts           ← /healthz, /readyz
│   │   │   ├── auth.ts             ← /api/auth/* (login, callback, logout, whoami)
│   │   │   ├── webauthn.ts         ← /api/webauthn/* (enroll, authenticate)
│   │   │   ├── me.ts               ← /api/me (current user)
│   │   │   ├── rooms.ts            ← /api/rooms/*
│   │   │   ├── messages.ts         ← /api/rooms/:id/messages/*
│   │   │   ├── files.ts            ← /api/files/* (sign-upload, sign-download, confirm)
│   │   │   ├── bots.ts             ← /api/bots/*
│   │   │   ├── jobs.ts             ← /api/jobs/* (queue, lease, complete)
│   │   │   ├── visitors.ts         ← /api/visitors (existing visitor tracking proxy)
│   │   │   └── webhooks.ts         ← /webhooks/github (HMAC-verified)
│   │   ├── ws/
│   │   │   ├── handler.ts          ← /ws upgrade handler (humans)
│   │   │   ├── bot_handler.ts      ← /ws/bot upgrade handler (bot proxies)
│   │   │   └── rooms.ts            ← in-process pub/sub for room broadcast
│   │   └── lib/
│   │       ├── jwt.ts              ← Ed25519 sign/verify
│   │       ├── crypto.ts           ← random tokens, HMAC, password hashing if ever needed
│   │       ├── logger.ts           ← pino with secret redaction
│   │       ├── errors.ts           ← typed error classes
│   │       └── ed25519.ts          ← @noble/ed25519 wrapper for bot signature verify
│   ├── migrations/                 ← SQL migrations (10 files per ADMIN_PORTAL_TODO.md AP-052..AP-066)
│   │   ├── 0001_users.sql
│   │   ├── 0002_sessions.sql
│   │   ├── 0003_webauthn_credentials.sql
│   │   ├── 0004_audit_log.sql
│   │   ├── 0005_rooms.sql
│   │   ├── 0006_messages.sql
│   │   ├── 0007_files.sql
│   │   ├── 0008_bots.sql
│   │   ├── 0009_jobs.sql
│   │   └── 0010_deploy_events.sql
│   └── tests/                      ← integration tests (Phase 5)
│
├── proxy/                          ← MCP proxy template (downloaded by admins, customized per-admin server-side)
│   ├── proxy.js                    ← MCP server that bridges local CLAUDE Code <-> portal WS
│   └── README.md
│
├── Docs/                           ← all the planning docs (PUBLIC — these are plans, not secrets)
│   ├── THREAT_MODEL.md
│   ├── DATA_CLASSIFICATION.md
│   ├── RETENTION_POLICY.md
│   ├── ACCOUNT_LIFECYCLE.md
│   ├── INCIDENT_RESPONSE.md
│   ├── ADMIN_PORTAL_ARCHITECTURE.md  ← this file
│   ├── adr/
│   │   ├── 001-hosting-stack.md
│   │   ├── 002-auth-provider.md
│   │   └── 003-database-choice.md
│   └── (existing API/SEO/cache docs)
│
├── .gitignore                      ← excludes server/.env, server/data/, server/local-keys/, .claude/
├── package.json                    ← updated to add server deps + new npm scripts
├── vite.config.js                  ← updated to coexist with Hono in middleware mode
└── (rest of repo unchanged)
```

---

## What's gitignored (NEVER on GitHub)

- `.claude/` — entire folder, all admin's local config
- `server/.env` and any real env file
- `server/data/` — local SQLite DB
- `server/local-keys/` — dev-mode generated keys
- `server/dist/` — build output
- `node_modules/`, `dist/` — standard

## What's committed (PUBLIC on GitHub)

- All marketing site files (existing)
- `admin/` frontend code (HTML/CSS/JS — open source, no secrets)
- `server/` backend code (TypeScript — open source, no secrets, secrets come from env)
- `proxy/proxy.js` template (server customizes per-admin at download time)
- `Docs/` (plans, threat model, ADRs — these are docs, not secrets)
- `ADMIN_PORTAL_TODO.md`, `LOCAL_TESTING.md`, `NOW.md`, `TODO.md`, etc.

## What's secret-managed (NEVER committed, NEVER logged)

- `JWT_SIGNING_KEY` (Ed25519 private)
- `CSRF_COOKIE_KEY`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_WEBHOOK_HMAC_SECRET`
- `R2_ACCESS_KEY` / `R2_SECRET_KEY`
- `DATABASE_URL` (production includes password)
- `SESSION_COOKIE_SECRET`

In dev, all of these are auto-generated on first boot to `server/local-keys/` (gitignored). In prod, loaded from secrets manager (Cloudflare Secrets / Doppler / 1Password Connect).

---

## API surface (HTTP)

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/healthz` | GET | none | Liveness |
| `/readyz` | GET | none | Readiness (DB + secrets ready) |
| `/api/auth/login` | GET | none | Initiate Google OAuth (or dev bypass) |
| `/api/auth/google/callback` | GET | none | OAuth callback handler |
| `/api/auth/logout` | POST | session | Revoke session |
| `/api/auth/whoami` | GET | session | Current user info |
| `/api/webauthn/enroll/start` | POST | session | Begin WebAuthn enrollment |
| `/api/webauthn/enroll/finish` | POST | session | Complete enrollment |
| `/api/webauthn/auth/start` | POST | session | Begin WebAuthn auth (for re-auth) |
| `/api/webauthn/auth/finish` | POST | session | Complete auth |
| `/api/me` | GET | session | Current user + role + bot count |
| `/api/rooms` | GET | session | List rooms user is in |
| `/api/rooms` | POST | session+OWNER | Create room |
| `/api/rooms/:id` | GET | session+member | Room details |
| `/api/rooms/:id/messages` | GET | session+member | Paginated messages |
| `/api/rooms/:id/messages` | POST | session+member | Post message |
| `/api/files/sign-upload` | POST | session+member | Get signed upload URL (R2 or local) |
| `/api/files/confirm` | POST | session+member | Confirm upload + create file row |
| `/api/files/:id/sign-download` | GET | session+access | Get signed download URL |
| `/api/bots` | GET | session | List bots visible to user |
| `/api/bots` | POST | session+webauthn-reauth | Enroll new bot |
| `/api/bots/:id/proxy.js` | GET | session+ownership | Download per-admin proxy.js |
| `/api/bots/:id/revoke` | POST | session+owner-or-OWNER | Revoke bot |
| `/api/jobs` | GET | session | List jobs (filtered by role) |
| `/api/jobs` | POST | session+SUPERVISOR | Queue new job |
| `/api/jobs/:id/lease` | POST | bot-token | Worker bot claims job |
| `/api/jobs/:id/complete` | POST | bot-token+lease | Worker reports completion |
| `/api/visitors` | POST | none (existing public endpoint) | Visitor tracking (proxy to existing service or self-host) |
| `/webhooks/github` | POST | HMAC | GitHub webhook receiver |
| `/ws` | WS upgrade | session | Human WebSocket (chat, presence, deploy events) |
| `/ws/bot` | WS upgrade | bot-token | Bot WebSocket (BOT_BUS messages, intent, status) |
| `/admin/*` | GET | (static) | Admin frontend SPA shell |
| `/*` | GET | (static) | Marketing site files |

---

## Three deployment modes

| Mode | Command | What runs | Where it works |
|---|---|---|---|
| **Local dev** | `npm run dev` | Hono + Vite middleware, SQLite, dev auth bypass | Localhost only |
| **VPS prod** | `npm run start` | Hono serves built static + APIs + WS, Postgres, real OAuth | Single VPS or Workers |
| **GH Pages static** | `npm run build:static && commit dist/` | Built static frontend only — admin features need a separate backend reachable via API_BASE_URL | Public mirror; admin needs hosted backend |

The third mode is degraded — it's a marketing-mirror with an admin login button that only works if `admin/js/config.js` API_BASE_URL points at a live backend somewhere. Useful for "the marketing site stays alive even if the admin portal goes down."

---

## Cross-references

- Implementation tasks: `ADMIN_PORTAL_TODO.md` (AP-001 through AP-265)
- Threat model: `Docs/THREAT_MODEL.md`
- Data classification: `Docs/DATA_CLASSIFICATION.md`
- Retention policy: `Docs/RETENTION_POLICY.md`
- Account lifecycle: `Docs/ACCOUNT_LIFECYCLE.md`
- Incident response: `Docs/INCIDENT_RESPONSE.md`
- ADRs: `Docs/adr/`
- Existing local-test docs: `LOCAL_TESTING.md`

---

*ADMIN_PORTAL_ARCHITECTURE.md — review on every major architectural change. Update ADRs separately for individual decisions.*
