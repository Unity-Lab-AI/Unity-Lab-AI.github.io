# NOW.md — Current Session Snapshot

**Session:** 2026-04-25
**Latest:** /super-review → ADMIN_PORTAL_TODO.md (265 tasks) → "start building" → Phase 0 + Phase 1 skeleton + Phase 2 frontend + Phase 3 proxy template ALL shipped this session
**Branch:** `main` tracking `origin/main` — working tree has many new files (untracked) + edits to `package.json` / `vite.config.js` / `.gitignore` / `TODO.md`. NOTHING COMMITTED. NOTHING PUSHED.
**LAW LOCKED:** never push to main without explicit user instruction + triple confirm.

---

## What this session shipped

### Inside `Website/` (new directories)
- `admin/` — admin portal frontend (login + dashboard, dark theme matching site, CSRF-aware fetch wrapper, WS client with reconnect, full dashboard controller)
- `server/` — unified Node + Hono backend (one process serves marketing + admin frontend + API + WS + visitor counter)
- `proxy/` — MCP proxy template (server customises per-bot at download)
- `Docs/` (existing) — added 6 new files: THREAT_MODEL, DATA_CLASSIFICATION, RETENTION_POLICY, ACCOUNT_LIFECYCLE, INCIDENT_RESPONSE, ADMIN_PORTAL_ARCHITECTURE + 3 ADRs

### Inside `Website/server/` (~30 files)
- `package.json`, `tsconfig.json`, `.env.example`, `README.md`
- `src/index.ts` — unified Hono server entry
- `src/config/` — env validation + admin allowlist (4 emails)
- `src/db/` — connection + migration runner (SQLite-only path; Postgres queued)
- `src/lib/` — jwt (Ed25519), crypto, logger (pino + redaction), errors
- `src/middleware/` — security headers, session JWT parse, CSRF, rate limit, audit emit, error handler
- `src/auth/` — session lifecycle (with rememberMe), dev-bypass, OAuth stub, WebAuthn stub, password (scrypt + strength + lockout)
- `src/api/` — health, auth, me, rooms, messages, files (stubs), bots, jobs (stubs), visitors, webhooks (HMAC verify)
- `src/ws/` — humans handler (session-cookie auth) + bot handler (stub) + room broadcast registry
- `migrations/` — 11 SQL files (10 from TODO + 1 added for password)

### Mid-session user-requested additions
- **"remember me" for browser return-users:** `rememberMe: true` extends session cookie to 30 days
- **Optional password login** (browser-only fallback): scrypt-hashed, 12+ chars, mixed case + digit, common-password blocklist, 5-fail-then-1h lockout
- **Visitor counter inlined:** `/api/visitors` POST/GET handled by the unified server (no more proxy to external service)

### Repo wiring
- `package.json` — added all server deps + new scripts (`npm run dev` now boots unified server)
- `vite.config.js` — added admin/index.html + admin/dashboard.html to MPA entry points
- `.gitignore` — server/.env, server/data/, server/local-keys/, server/dist/, server/*.db*

### `.claude/` integration
- New memory: `feedback_admin_portal_awareness.md` (in template + appdata)
- Memory index updated
- Per LAW: `.claude/` stays 100% gitignored

---

## How to verify the build (you do this — needs npm install)

```cmd
cd C:\Users\gfour\Desktop\Website
npm install
copy server\.env.example server\.env
npm run dev
```

Then in your browser:
1. Open `http://localhost:3000/` — marketing site loads (existing)
2. Open `http://localhost:3000/admin/` — login page loads with 3 tabs
3. Click the **Dev** tab → pick one of the 4 admins → you land on the dashboard
4. Click `+` next to "Rooms" → create one
5. Send a message
6. Click `+` next to "Bots" → enroll one → grab the proxy.js download URL

Expected behaviors:
- Cookie persists across browser refresh (12h default; 30 days if you tick "Remember me")
- WS connects on dashboard load, disconnects on logout
- Activity feed shows WS connect/disconnect events
- Health check at `http://localhost:3000/healthz` returns `{status:"ok"}`
- Readiness at `http://localhost:3000/readyz` returns `{ready:true, checks:{db,jwt_key,csrf_secret}}`

---

## Known gaps in this skeleton (queued for next sessions)

| Task | Status | What's stubbed |
|---|---|---|
| AP-029..037 | stub | Google OAuth — endpoints throw 501 with task IDs. Use Dev tab in dev mode. |
| AP-038..043 | stub | WebAuthn — placeholder file. Dashboard button is disabled. |
| AP-114, AP-151 | stub | Bot WS path closes with `bot_ws_not_yet_wired`. proxy.js connects but stdio bridging is TODO. |
| AP-117..126 | stub | File upload/download endpoints return 501. UI buttons hidden in this round. |
| AP-179 | partial | Webhook HMAC verify works but payload parsing into deploy_events is TODO. |

All gaps have task IDs so the next session knows exactly where to pick up.

---

## Files changed (uncommitted)

```
Modified:
  TODO.md                        ← added admin portal cross-ref earlier this session
  package.json                   ← server deps + scripts
  vite.config.js                 ← admin entry points
  .gitignore                     ← server secrets exclusion
  .claude/memory-templates/MEMORY.md  ← admin awareness entry
  ADMIN_PORTAL_TODO.md           ← Phase 0 + DB tasks marked complete with details
  NOW.md                         ← this file (replaced)

Untracked (new):
  admin/                         ← entire frontend
  server/                        ← entire backend
  proxy/                         ← MCP proxy template
  Docs/THREAT_MODEL.md
  Docs/DATA_CLASSIFICATION.md
  Docs/RETENTION_POLICY.md
  Docs/ACCOUNT_LIFECYCLE.md
  Docs/INCIDENT_RESPONSE.md
  Docs/ADMIN_PORTAL_ARCHITECTURE.md
  Docs/adr/001-hosting-stack.md
  Docs/adr/002-auth-provider.md
  Docs/adr/003-database-choice.md
  .claude/memory-templates/feedback_admin_portal_awareness.md  (gitignored)
```

---

## Tasks completed this session (status flipped in ADMIN_PORTAL_TODO.md)

- AP-005 [~] hosting decided — ADR-001
- AP-006 [~] DB decided — ADR-003
- AP-011..016 [✓] Phase 0 docs + admin allowlist
- AP-051..062 [✓] All 10 migrations
- ADR-002 written (auth provider)
- All Phase 1 backend skeleton + Phase 2 frontend skeleton + Phase 3 proxy template implemented at the SCAFFOLDING level (with stubs marked for Phase N completion).

Full session log appended at the bottom of `ADMIN_PORTAL_TODO.md`.

---

*NOW.md — overwritten 2026-04-25 ~02:00 local. Next session: run `npm install` + `npm run dev`, verify boot, then start picking off Phase 1 stubs (Google OAuth = AP-029..037).*
