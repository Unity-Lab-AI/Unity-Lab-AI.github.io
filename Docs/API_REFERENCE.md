# API_REFERENCE.md — Unity AI Lab Admin Portal

> Per ADMIN_PORTAL_TODO.md AP-244. All endpoints on the unified server (default `http://localhost:3000` in dev, `https://admin.unityailab.com` in prod).

## Authentication

| Mechanism | Used by | Where |
|---|---|---|
| **Session cookie** | Browsers + `.claude/setup` wizard | `Cookie: session=<JWT>` (HttpOnly, Secure in prod, SameSite=Strict) |
| **Bot token** | Per-admin proxy.js bot | `Authorization: Bearer <bot_id>.<random>` |
| **CSRF token** | Browsers (state-changing requests only) | `X-CSRF-Token: <value>` (echo of `csrf=` cookie) |
| **Webhook HMAC** | GitHub webhooks | `X-Hub-Signature-256: sha256=<hex>` |

State-changing endpoints reject if CSRF check fails (except webhooks + WS upgrade + OAuth callback).

---

## Health

### `GET /healthz` — Liveness
No auth.
**200:** `{ "status": "ok", "time": "<iso>", "mode": "development|production" }`

### `GET /readyz` — Readiness
No auth.
**200:** `{ "ready": true, "checks": { "db": true, "jwt_key": true, "csrf_secret": true } }`
**503:** if any check failed.

---

## Auth

### `GET /api/auth/dev/admins`
Lists the 4 admin emails for the dev-bypass picker. **Only available when `DEV_AUTH_BYPASS=true`.**
**200:** `{ "admins": [{"email":"sponge@unityailab.com","handle":"Sponge"}, ...] }`
**404 `dev_bypass_disabled`** in prod.

### `POST /api/auth/dev/login`
Dev-only login as a chosen admin without a password.
**Body:** `{ "email": "<admin email>", "remember_me": true }`
**200:** `{ "ok": true, "user": {...} }` + `Set-Cookie: session=...`
**404** in prod, **400** if email not in allowlist.

### `POST /api/auth/password/login`
Password login (browser path).
**Body:** `{ "email": "...", "password": "...", "remember_me": true }`
**200:** `{ "ok": true, "user": {...} }` + session cookie.
**401 `invalid_credentials` / `no_password_set` / `locked_until:<ts>`**.

### `POST /api/auth/password/set`
Set/change password. Requires session.
**Body:** `{ "password": "<min 12 chars, mixed case + digit>" }`
**200:** `{ "ok": true }`
**400 `weak_password`** with `reason`.

### `GET /api/auth/password/status`
Whether the current user has a password set. Requires session.
**200:** `{ "password_set": true|false }`

### `POST /api/auth/password/reset` *(OWNER only)*
Mint a one-shot 24h reset URL for another admin.
**Body:** `{ "email": "<target admin>" }`
**200:** `{ "url": "...", "target_email": "...", "expires_at": "..." }`

### `GET /api/auth/password/reset/:token/check`
Validate token + return target email. No auth.
**200:** `{ "valid": true, "email": "..." }` or `{ "valid": false, "reason": "..." }`

### `POST /api/auth/password/reset/:token/consume`
Set new password using a reset token + log in. No prior auth.
**Body:** `{ "password": "...", "remember_me": true }`
**200:** `{ "ok": true, "user": {...} }` + session cookie.

### `POST /api/auth/claim`
Universal admin claim flow — used by `.claude/setup` wizard.
**Body:** `{ "email": "...", "password": "...", "remember_me": true }`
**200:** `{ "ok": true, "bootstrap": true|false, "user": {...} }` + session cookie.
**403 `claim_window_closed`** unless `ADMIN_CLAIM_OPEN=true` OR DB is empty (bootstrap).
**409 `already_claimed`** if email already has an ACTIVE user.

### `GET /api/auth/claim/status`
Claim window status + unclaimed admin list. No auth.
**200:** `{ "claim_allowed": bool, "bootstrap_mode": bool, "window_open": bool, "dev_bypass": bool, "unclaimed_admins": [...] }`

### `POST /api/auth/claim/window` *(OWNER only)*
Open or close the claim window.
**Body:** `{ "open": true|false }`
**200:** `{ "ok": true, "window_open": bool, "reminder": "Edit server/.env to make persistent" }`

### `POST /api/auth/handoff`
Mint a one-shot 60s URL to hand off the current session to a browser.
Used by `.claude/setup` wizard to open the dashboard already authenticated. Requires session.
**200:** `{ "url": "...", "expires_in_sec": 60 }`

### `GET /api/auth/handoff/:token`
Consume a handoff token → set session cookie → 302 → `/admin/dashboard.html`. No auth.

### `POST /api/auth/logout`
Revoke server-side session + clear cookie. Requires session.
**200:** `{ "ok": true }`

### `GET /api/auth/whoami`
Current user info. Requires session.
**200:** `{ "authenticated": true, "user": {"id","email","role"} }`
**401 `auth_required`** if no session.

---

## Me

### `GET /api/me`
Current user with bot + room counts. Requires session.
**200:** `{ "user": {...}, "stats": { "bot_count": N, "room_count": N } }`

---

## Rooms

### `GET /api/rooms`
List rooms the user is a member of. Requires session.
**200:** `{ "rooms": [{ id, name, kind, description, created_at, member_role }, ...] }`

### `POST /api/rooms` *(OWNER only)*
Create a room.
**Body:** `{ "name": "...", "kind": "CHANNEL"|"BOT_BUS"|"DIRECT", "description": "..." }`
**200:** `{ "id", "name", "kind" }`. Creator auto-joins as ADMIN.

### `POST /api/rooms/:id/clear` *(system OWNER or room ADMIN)*
Soft-delete every non-deleted message in the room (sets `messages.deleted_at`). Room itself stays. Broadcasts `{ op: 'room_cleared', room_id, cleared_count, by_user_id }` over WS so other admins' chat panes refresh.
**200:** `{ "ok": true, "cleared_count": <int> }`

### `POST /api/rooms/:id/delete` *(system OWNER or room ADMIN)*
Soft-delete the room (sets `rooms.archived_at`). The room disappears from `GET /api/rooms` for every member; messages and members rows stay in DB for audit. Broadcasts `{ op: 'room_deleted', room_id, by_user_id }` over WS.
**200:** `{ "ok": true }`

---

## Messages

### `GET /api/rooms/:id/messages?limit=50&before_seq=N`
Paginated messages. Requires session + room membership.
**200:** `{ "messages": [...], "has_more": bool }`. Newest first by `seq desc`.

### `POST /api/rooms/:id/messages`
Post a TEXT message. Requires session + room membership (not READONLY).
**Body:** `{ "body": "max 8000 chars", "reply_to": "<msg_id>" }`
**200:** `{ "message": {...} }` + WS broadcast to room.

---

## Files

### `POST /api/files/sign-upload`
Get a signed PUT URL. Requires session + room membership (not READONLY).
**Body:** `{ "filename": "...", "size": N, "mime": "...", "room_id": "...", "sha256": "<hex>" }`
**200:** `{ "file_id", "upload_url", "method": "PUT", "headers": {...}, "expires_in": 300 }`
**400** for missing fields, mime not allowed, mime blocked.
**413 `too_large`** if size > 100MB.

### `POST /api/files/confirm`
Confirm upload after PUT to signed URL. Requires session.
**Body:** `{ "file_id": "...", "sha256_actual": "<hex>" }`
**200:** `{ "ok": true, "file": {...} }` + posts FILE message in room.
**422** for size/sha256 mismatch.

### `GET /api/files/:id/sign-download`
Get a signed GET URL. Requires session + access to file's room.
**200:** `{ "download_url", "expires_in", "filename", "mime", "size" }`

### `POST /api/files/:id/delete`
Soft-delete. Requires uploader OR room ADMIN OR portal OWNER.
**200:** `{ "ok": true }`

---

## Bots

### `GET /api/bots`
List bots visible to current user (own only; OWNER sees all). Requires session.
**200:** `{ "bots": [...] }`

### `POST /api/bots`
Create + return one-shot enrollment token. Requires session. Max 5 bots per admin.
**Body:** `{ "name": "...", "role": "WORKER"|"SUPERVISOR"|"LOGISTIC"|"OBSERVER" }`
**200:** `{ "bot_id", "enrollment_token", "enrollment_expires_at", "proxy_download_url" }`

### `GET /api/bots/:id/proxy.js`
Download per-admin customised proxy.js. Requires session + bot ownership.
**200:** `Content-Type: application/javascript` + `Content-Disposition: attachment`. Re-issues fresh enrollment token if bot not yet enrolled.

### `POST /api/bots/:id/enroll`
Bot first-run enrollment. No prior auth (uses enrollment_token).
**Body:** `{ "enrollment_token": "...", "public_key": "<64 hex chars Ed25519>" }`
**200:** `{ "access_token", "refresh_token", "access_expires_at", "refresh_expires_at" }`
**409 `already_enrolled`**, **410 `enrollment_expired`**, **401 `invalid_enrollment_token`**

### `POST /api/bots/:id/refresh`
Bot token rotation. No session (uses refresh_token).
**Body:** `{ "refresh_token": "..." }`
**200:** new token pair. Old refresh invalidated.
**401 `token_reuse_detected`** → bot REVOKED.

### `POST /api/bots/:id/revoke`
Revoke a bot. Requires session + ownership OR OWNER role.
**200:** `{ "ok": true }`

---

## Jobs

### `GET /api/jobs?status=...&limit=N`
List jobs. Requires session.
**200:** `{ "jobs": [...] }`

### `POST /api/jobs`
Create a job. SUPERVISOR/OWNER → status `QUEUED`. WORKER/OBSERVER → `PENDING_APPROVAL`.
**Body:** `{ "kind": "PR"|"MERGE"|"REVERT", "target_repo", "target_branch", "payload": {...}, "depends_on": [...] }`
**Direct PUSH to `main` is BLOCKED with 403.**
**200:** `{ "job_id", "status" }`

### `POST /api/jobs/:id/approve` *(SUPERVISOR/OWNER)*
Flip PENDING_APPROVAL → QUEUED.
**200:** `{ "ok": true }`

### `POST /api/jobs/:id/reject` *(SUPERVISOR/OWNER)*
Flip PENDING_APPROVAL → CANCELLED.
**Body:** `{ "reason": "..." }`
**200:** `{ "ok": true }`

### `POST /api/jobs/lease/next`
Claim the next leasable QUEUED job (deps satisfied). Requires session OR bot token.
**200:** `{ "job": {...} }` or `{ "job": null, "message": "no leasable jobs" }`

### `POST /api/jobs/:id/heartbeat`
Extend lease 5 more min. Requires lease-holder.
**200:** `{ "ok": true, "lease_expires_at": "..." }`

### `POST /api/jobs/:id/complete`
Report status. Requires lease-holder.
**Body:** `{ "status": "RUNNING"|"COMPLETED"|"FAILED", "result": {...} }`
**200:** `{ "ok": true }`

### `POST /api/jobs/:id/cancel`
Cancel a non-terminal job. Requires OWNER OR original supervisor.
**200:** `{ "ok": true }`

---

## Deploy events

### `GET /api/deploys?limit=50`
List recent GitHub deploy events. Requires session.
**200:** `{ "events": [...] }`

---

## Visitors (legacy, marketing site)

### `POST /api/visitors`
Increment visitor counter. No auth.
**200:** `{ "ok": true, "count": N }`

### `GET /api/visitors`
**200:** `{ "count": N }`

---

## Webhooks

### `POST /webhooks/github`
GitHub webhook receiver. HMAC-verified via `X-Hub-Signature-256`.
Handles: `push`, `deployment_status`, `workflow_run`. Inserts into `deploy_events` + WS broadcast.
**200:** `{ "ok": true, "event": "<type>", "processed": bool }`
**401 `invalid_signature`** on HMAC mismatch.

---

## WebSocket

See `Docs/WS_PROTOCOL.md` for the full protocol.

- `GET /ws` (upgrade) — humans, session-cookie auth
- `GET /ws/bot` (upgrade) — bots, `Authorization: Bearer <bot_id>.<random>` auth

---

## Error envelope

All API errors:
```json
{
  "error": "<machine_code>",
  "message": "<human description, optional>",
  "details": <any, optional>
}
```

Common codes:
- `auth_required` (401) — no session
- `forbidden` (403) — session present but role insufficient
- `forbidden_owner_only` (403)
- `not_found` (404)
- `conflict` (409) — `already_claimed`, `already_enrolled`, `bot_limit_reached`
- `validation` (400) — `invalid_json`, `missing_fields`, `weak_password`, `mime_not_allowed`
- `rate_limited` (429) — backoff via `Retry-After` header
- `internal_error` (500)

---

_Last updated: 2026-04-25. Versioned with code._
