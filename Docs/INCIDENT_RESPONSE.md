# INCIDENT_RESPONSE.md — Unity AI Lab Admin Portal

> **Created:** 2026-04-25 — fulfills AP-015

---

## Severity tiers

| Sev | Definition | Response time | Page on-call |
|---|---|---|---|
| **SEV-1** | Active compromise: account takeover, repo write abuse, data breach | <15min | YES (all 4 admins) |
| **SEV-2** | Suspected compromise OR major outage (portal down, bots all offline) | <60min | YES (on-call rotation) |
| **SEV-3** | Degraded service (slow, intermittent errors, single bot failing) | <4h | NO (next business hour) |
| **SEV-4** | Cosmetic / non-blocking | Best effort | NO |

---

## Standard response framework (all severities)

1. **Detect** — alert fires, admin notices, external report
2. **Triage** — confirm/dismiss, assign severity, page if needed
3. **Contain** — limit blast radius (suspend account, revoke token, take service offline)
4. **Eradicate** — remove the cause (revoke leaked credential, patch vuln, rotate key)
5. **Recover** — restore service from clean state
6. **Postmortem** — within 7 days; root cause; prevention; track in TODO

---

## Scenario playbooks

### IR-1: Suspected account compromise

**Signals:** unusual login location/time, failed-2FA bursts, unexplained job approvals, audit log shows actions the admin denies, leaked credential found in public source.

1. Page another OWNER immediately.
2. OWNER suspends the affected account in portal (re-auths via WebAuthn).
3. Server auto: revoke all sessions + bots, drop all WS connections.
4. Pull last 24h of audit log for the affected user — review every action.
5. Identify any irreversible damage (merged PRs, deleted files, sent messages to externals).
6. If repo was touched: review recent commits/PRs/merges; revert if unauthorized.
7. Affected admin recovers via lost-key procedure (ACCOUNT_LIFECYCLE.md) only after root cause known.
8. Postmortem within 7 days.

### IR-2: Bot token leaked publicly

**Signals:** GitHub secret scanning alert, bot showing activity from unfamiliar IP, refresh-token reuse detection fires.

1. Revoke the specific bot via portal (any OWNER, no concur needed for bot revoke).
2. If the bot had write scope on a repo: rotate GitHub App token, audit recent App-token-mediated commits.
3. Force the owning admin to re-enroll a new bot.
4. Search the published-leak source for any other secrets (often not just one).
5. Audit log review for that bot's activity since token issue.
6. Postmortem.

### IR-3: GitHub App private key leaked

**Signals:** secret-scanning alert, unexplained pushes from the App, key found in repo / log / artifact.

1. Rotate the GitHub App private key immediately (GitHub UI).
2. Invalidate all currently-issued installation tokens.
3. Update secrets manager with new key.
4. Restart backend to pick up new key.
5. Review all repo activity from that App for past 30 days; revert anything unauthorized.
6. Determine leak vector — was it in a log? a backup? a CI artifact? — fix the leak source.
7. Postmortem.

### IR-4: Database breach (suspected)

**Signals:** DB connections from unexpected IP, slow-query logs show enumeration patterns, backup integrity check fails, ransom note.

1. Take backend offline (DNS to maintenance page).
2. Snapshot DB for forensics (read-only).
3. Restore latest known-clean backup to fresh DB instance.
4. Rotate ALL secrets that were in the DB or environment: JWT keys, OAuth secret, GitHub App key, R2 keys, webhook HMAC.
5. Force re-auth for all admins (invalidate all sessions).
6. Force bot re-enrollment for all bots (invalidate all bot tokens).
7. Notify all 4 admins. Determine if customer/external notification needed.
8. Forensic investigation on the breach vector.
9. Bring service back up only after root cause confirmed and patched.
10. Postmortem + likely external security review.

### IR-5: Backend host compromise

**Signals:** unexpected outbound connections, anomalous CPU/RAM, unfamiliar processes, file integrity mismatch.

1. Take host offline (kill VPS / disable Workers route).
2. Snapshot host disk for forensics.
3. Provision fresh host from clean image.
4. Restore DB from clean backup; re-deploy backend from clean repo state.
5. Rotate all secrets per IR-4 step 4.
6. Force re-auth + bot re-enrollment per IR-4 steps 5-6.
7. Investigate compromise vector — supply chain? misconfig? exploited vuln?
8. Postmortem.

### IR-6: Concurrent push race / data corruption in repo

**Signals:** force-push detected on `main` (should be impossible per branch protection), commits in wrong order, CI failures cluster, deploy serves wrong content.

1. Lock repo writes — bot coordinator emergency stop (AP-173).
2. Identify the offending commit(s) via git reflog + audit log.
3. Force-push back to last known-good (requires explicit OWNER + WebAuthn re-auth — this is one of the few cases force-push is allowed).
4. Re-run the displaced jobs through the queue in correct order.
5. Investigate why the leader-election failed — race condition? lock TTL issue? coordinator bug?
6. Patch coordinator; add regression test.
7. Postmortem.

### IR-7: DDoS on portal

**Signals:** request rate spike, edge rate-limits triggering at high rate, p99 latency degrading.

1. Cloudflare auto-mitigates most volumetric attacks.
2. If application-layer attack: tighten rate-limits at edge, add CAPTCHA on login (per AP-049 escalation), block specific ASNs if attribution clear.
3. If targeted at a specific endpoint: apply temporary stricter rate limit on that endpoint.
4. If outage: status page update, notify admins via email.
5. Postmortem if attack impacted availability.

### IR-8: Lost hardware key (single admin)

Per ACCOUNT_LIFECYCLE.md — not strictly an "incident" if the admin still has their backup key. If both keys lost: recovery flow is a SEV-3 (no active compromise, just access loss).

---

## Communication

- **Internal:** dedicated `#incident` BOT_BUS room (high-priority, all admins notified, append-only history).
- **External:** unless customer data exposed, no public disclosure. If customer data: Comply with applicable disclosure law (jurisdiction-dependent — US default 30-72h depending on state).
- **Status page:** SEV-1 and SEV-2 get a status page update within 1h.

---

## Post-incident

- **Postmortem template** — `Docs/postmortems/<YYYY-MM-DD>-<short-title>.md`. Includes: timeline, root cause, contributing factors, what went well, what went wrong, action items (each tracked as a TODO entry).
- **Action items** — added to `ADMIN_PORTAL_TODO.md` with `IR-` prefix, tagged with the incident ID.
- **Trend review** — every 6 months, review postmortems for systemic patterns.

---

*INCIDENT_RESPONSE.md — review every 6 months and after every SEV-1/SEV-2 incident. Tabletop exercises quarterly per AP-230, AP-231, AP-232.*
