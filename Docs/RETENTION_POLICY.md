# RETENTION_POLICY.md — Unity AI Lab Admin Portal

> **Created:** 2026-04-25 — fulfills AP-013

---

## Per data-type retention

| Data | Hot retention | Cold/archive | Hard delete | Reason |
|---|---|---|---|---|
| Chat messages | 1 year | Year 2-3 (read-only archive) | After 3 years | Working business records; no legal obligation to keep longer for an internal team |
| File uploads | 1 year | Year 2 (read-only archive) | After 2 years | Storage cost; users re-upload if needed |
| Audit log | 7 years (active) | n/a | After 7 years | Common SOX-adjacent retention floor; covers most audit/forensic needs |
| Deploy events | 90 days | None | After 90 days | Operational telemetry; ephemeral value |
| Sessions (revoked or expired) | 30 days | None | Hard-deleted nightly | Privacy minimization; just need recent for forensics |
| WebAuthn credentials (active) | Indefinite while user active | n/a | On user removal | Re-enrollment is not free |
| WebAuthn credentials (deleted) | 90 days as soft-deleted record | None | Hard-deleted after 90 days | Forensics window |
| Bot enrollment tokens | 1 hour TTL | None | Deleted on first use OR expiry | Single-use by design |
| Bot refresh tokens (revoked) | 30 days as soft-deleted | None | Hard-deleted | Forensics window |
| Bot access tokens | 15 min TTL | n/a | Auto-expire | Short-lived |
| Job queue entries | 90 days post-completion | None | Hard-delete | Operational; debug window |
| Login attempts (success) | Captured in audit log → 7 years | n/a | Per audit retention | Forensic trail |
| Login attempts (failure) | Captured in audit log → 7 years | n/a | Per audit retention | Brute-force detection + forensics |
| User accounts (active) | Indefinite | n/a | On removal request | Operational |
| User accounts (removed) | 90 days as soft-deleted (status=REMOVED) | n/a | Hard-deleted after 90 days; chat history depersonalized (sender ID nulled, body kept) | Allow undo; comply with deletion requests |

---

## Deletion mechanics

**Soft delete:** sets a `deleted_at` (or `revoked_at`, `removed_at`) timestamp. Row remains queryable internally but excluded from normal reads.

**Hard delete:** row physically removed from DB. Audit log entry created BEFORE deletion documenting the removal.

**Object storage hard delete:** R2 / S3 lifecycle rule removes objects N days after their DB row was soft-deleted.

**Depersonalization:** keep the row, null out PII (sender ID, IP, user-agent). Used when a user is removed but their chat content has historical value to the team.

---

## Compliance notes

- **No EU user data assumed** (admin team is internal, US-based per project context). If that changes, GDPR adds: right-to-erasure (depersonalize within 30 days of request), data-subject access request flow, lawful-basis documentation per data type. None of those are wired today; add in Phase 4 if scope changes.
- **No customer PII assumed** in admin chat. If customer data is ever discussed, that data inherits the customer's classification (likely SECRET) and the strictest retention.
- **Backups inherit the underlying data's classification.** Backup retention = source retention. Backup deletion happens within 30 days of source deletion.

---

## Operational schedule

| Job | Frequency | What it does |
|---|---|---|
| Hard-delete expired sessions | Nightly 03:00 UTC | DELETE WHERE revoked_at < now() - 30d AND expires_at < now() |
| Hard-delete soft-deleted bots | Nightly 03:10 UTC | Per AP-061 lifecycle |
| Archive chat messages > 1 year | Weekly Sunday 04:00 UTC | Move to read-only partition or cold storage table |
| Hard-delete chat messages > 3 years | Monthly 1st 04:30 UTC | After archival validation |
| R2 lifecycle cleanup | Continuous (R2-managed) | Per bucket policy |
| Audit log retention check | Annually | Verify nothing > 7 years; manual review before any pruning |

---

*RETENTION_POLICY.md — changes require sign-off from all 4 admins. Retention reductions are one-way; lengthening is fine.*
