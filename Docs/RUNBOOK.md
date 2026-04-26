# RUNBOOK.md — Unity AI Lab Admin Portal

> Operational runbook. Read this when something is on fire.

---

## Quick reference

| Command | Purpose |
|---|---|
| `npm run dev` | Boot unified server on :3000 (dev mode) |
| `npm run start` | Boot in prod mode (NODE_ENV=production required) |
| `npm run migrate` | Apply pending DB migrations |
| `node scripts/seed-dev-data.mjs` | Populate dev DB with sample rooms/bots/jobs |
| `node scripts/smoke-test.mjs` | Run end-to-end smoke tests against running server |
| `docker compose up -d` | Boot prod stack |
| `docker compose logs -f server` | Tail server logs |
| `docker compose run --rm backup` | Backup data volume |
| `bash scripts/backup.sh` | Backup on bare-systemd deployment |
| `curl :3000/healthz` | Liveness check |
| `curl :3000/readyz` | Readiness check (DB + secrets) |

---

## Common scenarios

### "Server won't boot — config validation failed"

**Symptom:** logs show `environment validation failed:` followed by zod error.

**Fix:** Check `server/.env` for typos in env var names. Required-in-prod vars:
- `JWT_SIGNING_KEY` (Ed25519 hex private key)
- `CSRF_COOKIE_SECRET` (any 32+ char random)
- If `DEV_AUTH_BYPASS=true` AND `NODE_ENV=production` → server REFUSES to boot. Set `DEV_AUTH_BYPASS=false` in prod.

### "Login form spins forever / shows 'Network error'"

**Symptom:** Browser DevTools → Network → fetch to `/api/auth/...` fails.

**Diagnose:**
1. `curl http://localhost:3000/healthz` — server up?
2. Check browser console for CORS errors. If admin frontend served from a different origin than the API, set `PUBLIC_BASE_URL` correctly.
3. Verify CSRF token: cookie `csrf=...` should be present on the login page (set on first GET).

### "Claim fails with `claim_window_closed`"

**Symptom:** Admin runs `.claude/setup`, sees this error.

**Fix:** Founder must:
1. Be logged in to dashboard
2. Right sidebar → "Open Claim Window" button
3. Wait for distribution + claim
4. Close window after all 4 enrolled

OR: founder can edit `server/.env` and set `ADMIN_CLAIM_OPEN=true` then restart.

### "Bot proxy.js connects, then immediately disconnects"

**Symptom:** `unity-proxy: WS closed 1008 invalid_bot_token` in stderr.

**Diagnose:**
1. `~/.claude/proxy/.bot.json` exists?
2. Is the bot revoked? Check dashboard → Bots list
3. Did the access token expire AND refresh fail? Logs say `refresh failed: 401 — bot may have been revoked` in that case.

**Fix:** Re-download proxy.js from dashboard (this issues a NEW enrollment token), delete `~/.claude/proxy/.bot.json`, run again.

### "WebSocket disconnects every minute"

**Symptom:** Activity feed shows constant "WS disconnected — reconnecting…"

**Diagnose:**
1. Check session cookie isn't expiring (default 12h, 30 days with remember-me)
2. Check reverse proxy isn't killing idle connections — Caddy default is 1h, configurable
3. Check no rate limit being hit at the edge

### "Job stuck in LEASED forever"

**Symptom:** Dashboard shows a job in LEASED status > 30 minutes.

**Cause:** Worker bot or coordinator died mid-execution.

**Fix:** Lease sweeper runs every 60s and returns expired leases to QUEUED. Wait, or:
1. Manually expire: `sqlite3 server/data/dev.db "UPDATE jobs SET status='QUEUED', worker_bot_id=NULL, leased_at=NULL, lease_expires_at=NULL WHERE id='<job_id>'"`
2. Or cancel: hit `POST /api/jobs/:id/cancel` from another OWNER session

### "GitHub webhook signature invalid"

**Symptom:** Webhook receiver returns 401, audit log shows `webhook.bad_signature`.

**Diagnose:**
1. `GITHUB_WEBHOOK_HMAC_SECRET` env var on server matches the secret configured in the GitHub App webhook settings?
2. Webhook delivery test from GitHub UI — does the body show our endpoint URL is reachable?

**Fix:** Rotate the secret on both sides simultaneously.

### "Coordinator not running jobs"

**Symptom:** Jobs stay QUEUED forever, never get LEASED by the coordinator.

**Diagnose:**
1. Logs say `coordinator: starting` at boot? If not: GitHub App env vars not set → coordinator disabled.
2. `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_INSTALLATION_ID` all populated?
3. Try minting an installation token manually (see DEPLOYMENT.md §6).

### "All admins logged out simultaneously"

**Symptom:** Everyone's session cookie suddenly invalid.

**Cause:** Either `JWT_SIGNING_KEY` rotated, or all sessions revoked (e.g. password reset of any user invalidates their other sessions).

**Fix:** All admins re-login. If `JWT_SIGNING_KEY` was rotated unintentionally, restore the previous key from secrets manager.

### "Disk filling up"

**Diagnose:**
- `du -sh server/data/uploads/*` — file uploads
- `du -sh server/data/*.db*` — SQLite + WAL/SHM files
- `docker compose logs --since 1h server | wc -l` — log volume

**Fix:**
- Run `node -e "process.exit(0)"` then check WAL: `sqlite3 server/data/dev.db "PRAGMA wal_checkpoint(TRUNCATE);"`
- Implement file lifecycle: delete soft-deleted files >30d (TODO: cron in Phase 4 ops)
- Configure logrotate or `LOG_LEVEL=warn` to reduce volume

---

## Audit log queries

The audit log captures every state-changing event. Useful queries (SQLite):

```sql
-- Recent logins
SELECT created_at, action, payload_json FROM audit_log
WHERE action LIKE 'login.%' ORDER BY created_at DESC LIMIT 20;

-- All failed login attempts in the last 24h
SELECT created_at, payload_json, ip FROM audit_log
WHERE action LIKE 'login.%failure' AND created_at > datetime('now', '-1 day');

-- Bot lifecycle for a specific bot
SELECT created_at, action, payload_json FROM audit_log
WHERE target_type = 'bot' AND target_id = '<bot_id>' ORDER BY created_at;

-- Claim window toggles
SELECT created_at, actor_user_id, action FROM audit_log
WHERE action LIKE 'claim.%' OR action LIKE 'claim_window%'
ORDER BY created_at DESC;

-- All actions by a specific user
SELECT created_at, action, target_type, target_id FROM audit_log
WHERE actor_user_id = '<user_id>' ORDER BY created_at DESC LIMIT 50;
```

Postgres equivalents work the same — just use `NOW()` instead of `datetime('now')`.

---

## Manual emergency overrides

### Force-close claim window mid-deploy

```bash
# Edit env, restart
sed -i 's/ADMIN_CLAIM_OPEN=true/ADMIN_CLAIM_OPEN=false/' server/.env
docker compose restart server   # or: systemctl restart unity-admin-portal
```

### Suspend an admin out-of-band (e.g. account compromise, no other OWNER available)

```sql
UPDATE users SET status='SUSPENDED', suspended_at=datetime('now'),
  suspended_reason='emergency_compromise' WHERE email='<email>';
UPDATE sessions SET revoked_at=datetime('now'), revoke_reason='emergency_suspend'
  WHERE user_id=(SELECT id FROM users WHERE email='<email>') AND revoked_at IS NULL;
UPDATE bots SET revoked_at=datetime('now'), revoke_reason='emergency_owner_suspend'
  WHERE owner_user_id=(SELECT id FROM users WHERE email='<email>') AND revoked_at IS NULL;
```

### Drain all bot connections

Restart the server. WS connections drop; bot proxies will reconnect with their refresh tokens (assuming not revoked).

### Wipe + restart from scratch (DEV ONLY)

```bash
rm -rf server/data/* server/local-keys/*
npm run dev
# DB + keys auto-regenerate on next boot
```

---

## Health monitoring

Set up an uptime monitor (Better Stack, UptimeRobot, etc.) hitting:

- `https://admin.unityailab.com/healthz` every minute
- `https://admin.unityailab.com/readyz` every 5 minutes
- Alert on any non-200 response

Track:
- p99 latency on `/api/me` (should be <100ms)
- WS connection count (should match logged-in admin count)
- Failed login rate (alert if >10/hour from any single IP)

---

## On-call rotation

| Week | On call |
|---|---|
| 1 | Sponge |
| 2 | Gee |
| 3 | Red |
| 4 | Alfreddo |

(Adjust as your team prefers. Document escalation paths in INCIDENT_RESPONSE.md.)

---

*RUNBOOK.md — keep current. After every incident, update with what you learned.*
