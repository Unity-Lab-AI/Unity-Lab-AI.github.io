# ACCOUNT_LIFECYCLE.md — Unity AI Lab Admin Portal

> **Created:** 2026-04-25 — fulfills AP-014

---

## Onboarding a new admin

1. Existing OWNER admin adds new email to `server/src/config/admin_allowlist.ts` via PR (peer-reviewed, signed commit).
2. New admin visits `https://admin.unityailab.com/login`.
3. Clicks "Sign in with Google" → OAuth flow → server validates `hd === 'unityailab.com'` AND `email ∈ allowlist`.
4. Server creates `users` row with role=OWNER (or other role per peer decision), status=ACTIVE.
5. Mandatory WebAuthn enrollment: new admin enrolls minimum 2 hardware credentials before any portal feature unlocks.
6. New admin enrolls first bot via `/admin/bots` UI (re-auths via WebAuthn).
7. New admin downloads per-admin `proxy.js`, installs into local `.claude/proxy/`, configures MCP in `.claude/settings.local.json`.
8. New admin runs `start.bat` / `start.sh` (which now detects bot config in `.claude/.env` and confirms enrollment).
9. New admin's bot appears as `online` in admin portal BOT_BUS room within 30s.
10. Onboarding logged in `audit_log` with all 4 phase timestamps.

---

## Periodic access review (quarterly)

1. OWNER triggers `/admin/access-review` UI.
2. UI lists every admin with: role, last login, last bot activity, enrolled WebAuthn count, bot count.
3. Each row gets confirm/revoke action requiring WebAuthn re-auth.
4. Stale bots (>90 days no activity) flagged for revocation.
5. Long-lived shared secrets (if any) flagged for rotation.
6. Outcome logged in audit_log with reviewer + decisions.

---

## Suspending an admin

1. Any OWNER hits "Suspend" on the admin's profile (with reason text required).
2. Server immediately:
   - Sets `users.status = SUSPENDED`, `users.suspended_at = now()`, `users.suspended_by`, `users.suspended_reason`.
   - Revokes all `sessions` for that user.
   - Drops all live WebSocket connections for that user.
   - Revokes all `bots` owned by that user (sets `revoked_at`, `revoke_reason='owner_suspended'`).
   - Drops all live bot WebSocket connections.
3. Suspended user attempting login gets a clear error: "Account suspended. Contact <other admin>."
4. Audit log entry with full context.
5. Notification posted to a `#security` channel (auto-created if doesn't exist).

Suspension is reversible — OWNER can unsuspend (re-auth via WebAuthn, requires another OWNER concurring on critical-suspend categories).

---

## Removing an admin (permanent)

1. Two OWNERs must concur (one initiates, the other approves via WebAuthn within 24h).
2. Server actions:
   - Sets `users.status = REMOVED`, `users.removed_at = now()`.
   - All actions from suspension above (revoke sessions, bots, WS).
   - Removes email from `admin_allowlist.ts` via PR (manual step — peer-reviewed).
   - Rotates any shared secrets the user had access to (GitHub App token, OAuth client secret if exposed).
   - Triggers depersonalization of user's chat history per RETENTION_POLICY.md.
3. After 90 days: user row hard-deleted; chat history sender_user_id nulled (body kept for team-history).
4. Audit log entry with both OWNERs' signatures.

---

## Lost hardware key recovery

Per AP-043: WebAuthn requires minimum 2 enrolled credentials per admin. Lost-key recovery requires:

1. Affected admin contacts another OWNER via known-good channel (NOT email — phone or in-person).
2. Other OWNER initiates recovery in portal (re-auths via WebAuthn).
3. Server sends recovery email to the affected admin's `unityailab.com` address with a single-use 1h-TTL recovery code.
4. Affected admin completes the round-trip: enters recovery code in portal → enrolls new key.
5. Old key removed from credentials list.
6. Audit log captures full recovery chain with both admins' identifiers.

**Hard rule:** SMS recovery is BANNED. Email-only recovery (since admin emails are on Google Workspace which itself enforces 2FA + Advanced Protection per AP-004).

---

## Bot lifecycle (sub-lifecycle of admin)

- Created: admin enrolls via portal, gets one-shot `enrollment_token` (1h TTL).
- Enrolled: bot connects, generates Ed25519 keypair locally, sends public key, server stores it, issues first refresh+access token.
- Active: bot connects via WSS, refreshes access token every 15min, sends signed messages.
- Idle: bot disconnects gracefully; refresh token still valid until expiry.
- Revoked: explicit revoke OR owner suspension OR token rotation failure → bot WS dropped, all tokens invalidated.
- Hard-deleted: 30 days after revoke, row hard-deleted per RETENTION_POLICY.md.

---

## Audit checkpoints

Every lifecycle transition emits an `audit_log` entry. The following actions REQUIRE WebAuthn re-auth even from authenticated session:

- Suspend / unsuspend an admin
- Remove an admin
- Revoke another admin's bot
- Approve a job that touches `main`
- Rotate any portal secret
- Configure GitHub App installation
- Edit admin allowlist (via PR — also requires GitHub-side review)

---

*ACCOUNT_LIFECYCLE.md — review on every admin-count change. Update if recovery procedures change.*
