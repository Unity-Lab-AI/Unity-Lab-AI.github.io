# THREAT_MODEL.md — Unity AI Lab Admin Portal

> **Created:** 2026-04-25 — fulfills AP-011
> **Scope:** `admin.unityailab.com` portal + `server/` backend + `proxy/proxy.js` MCP integration via `.claude/`
> **Not in scope:** the public marketing site at `unityailab.com` (different threat model — assume hostile internet, no auth, public CDN content only)

---

## Assets (what an attacker would want)

| Asset | Class | Worst-case impact if compromised |
|---|---|---|
| Admin chat content | RESTRICTED | Strategy/IP leaked; planning-stage features exposed |
| File shares (uploaded artifacts) | RESTRICTED → SECRET (case-by-case) | Source artifacts, signing material, customer data leaked |
| Bot enrollment tokens | SECRET | Attacker enrolls bot under admin's identity, posts to BOT_BUS, queues malicious jobs |
| Bot signing keys (Ed25519 private) | SECRET | Attacker forges bot messages, executes jobs as that bot |
| GitHub App installation token | SECRET | Attacker can push to / merge into ANY Unity-Lab-AI repo |
| Session JWTs | SECRET (short-lived) | Account takeover for 12h max |
| OAuth client secret | SECRET | Phishing site can impersonate the portal |
| Audit log | RESTRICTED | Attacker can't cover tracks; breach detection viable |
| Database (Postgres / SQLite) | SECRET | All of the above at once |

## Attackers (tiered)

| Tier | Profile | Capabilities | Likelihood |
|---|---|---|---|
| **T1 Script kiddie** | Random scanner / mass exploit | Known CVE scanning, credential stuffing from public dumps, opportunistic | High constant background |
| **T2 Opportunistic** | Discovers the portal via Google dorking / GitHub search | Manual enumeration, basic web app testing, social engineering attempts | Medium |
| **T3 Targeted spear-phish** | Knows the 4 admin emails (publicly listed in code/docs/this prompt) | Crafted phishing emails, lookalike domains, OAuth phish, MFA fatigue if SMS/push enabled | Medium-high (named targets) |
| **T4 Supply-chain** | Compromises an npm dep, GitHub Action, or third-party service | Persistent backdoor in dependency, malicious PR via dependabot mimicry | Low-medium (rising industry trend) |
| **T5 Insider abuse / mistake** | One of the 4 admins, intentional or accidental | Full legitimate access; abuse limited only by audit log + role separation | Low (small trusted team) but high impact |

## Attack vectors → mitigations

| Vector | Mitigation | Tracked in TODO |
|---|---|---|
| Credential stuffing on `/login` | Google SSO only — NO local password ever | AP-029, AP-032 |
| Phishing for SSO credentials | Mandatory WebAuthn 2FA (phishing-resistant) | AP-038, AP-040 |
| OAuth callback CSRF | `state` param, single-use, server-stored | AP-032 |
| OAuth code interception | PKCE on the OAuth flow | AP-032 (extend) |
| Session token theft via XSS | HttpOnly + Secure + SameSite=Strict cookies; strict CSP | AP-047, AP-068 |
| CSRF on state-changing endpoints | Double-submit CSRF token | AP-048 |
| Brute force / enumeration | Rate limit at edge + app; lockout after 5 fails | AP-025, AP-049 |
| Bot token theft (proxy.js compromised) | Short-lived access token (15min) + refresh rotation; reuse detection | AP-149 |
| Bot impersonation | Ed25519 signature on every bot message; server verifies | AP-150 |
| SQL injection | Parameterized queries only; ORM where possible; no string concat | enforced in `lib/` |
| File upload abuse (XSS, executable, oversized) | Mime allowlist, size cap, virus scan, content-disposition: attachment, served from R2 with signed URL not from app | AP-117, AP-122 |
| Public file enumeration (R2 bucket) | Bucket private; signed URLs only; 5min TTL | AP-008, AP-119 |
| Unauthorized repo push | Bots NEVER push to main directly; coordinator + queue + leader election; GitHub App token never exposed to bots | AP-164, AP-167 |
| Concurrent push race | Postgres advisory lock OR Redis SETNX on `main-merge-lock` | AP-164 |
| Webhook spoofing | HMAC verify `X-Hub-Signature-256` against shared secret | AP-179 |
| Lost hardware key (admin) | Minimum 2 enrolled credentials per admin; recovery via signed attestation from another admin + email round-trip | AP-040, AP-043 |
| Compromised admin account | Other admins can revoke sessions + bot tokens via portal; emergency stop drains all jobs | AP-173, AP-200 |
| Audit log tampering | DB role separation: app role has INSERT but no UPDATE/DELETE on audit_log | AP-053, AP-065 |
| `.claude/` proxy.js tampering | Proxy.js download is per-admin signed (Ed25519 sidecar); admin verifies signature before installing | AP-155 |
| GitHub repo write via stolen App token | Token stored in secrets manager only; rotated on suspicion; branch protection requires PR + review | AP-176, AP-178 |
| DDoS on the portal | Cloudflare in front (free tier); rate limits at edge; backend behind | AP-025 |

## Trust boundaries

```
[Internet] ─── (TLS) ──> [Cloudflare WAF/Rate-limit] ─── (TLS) ──> [Backend on VPS or Workers]
                                                                          │
                                                                          ├─> [Postgres / D1]   (private, only backend connects)
                                                                          ├─> [R2 / S3]         (private bucket, signed URLs only)
                                                                          ├─> [Secrets Manager] (CF Secrets / Doppler / 1Password)
                                                                          └─> [GitHub API]      (signed App token, server-side only)

[Admin browser] ──> Portal frontend (admin.unityailab.com/admin or unityailab.com/admin)
[Admin local machine] ──> .claude/ + proxy.js ──> (WSS) ──> Backend (bot path)
```

The trust boundary that matters most: **anything client-side is hostile-territory**. Browser extensions, devtools, intercepting proxies — all can read/modify any client-side state. The server NEVER trusts a value from the client without verification.

## Recovery procedures (high-level — full runbooks in INCIDENT_RESPONSE.md)

| Scenario | Initial response time | First action |
|---|---|---|
| Account compromise (suspected) | <15min | Other OWNER hits suspend in portal → all sessions + bot tokens revoked |
| Bot token leaked (e.g. in committed code) | <60min | Revoke specific bot via portal; rotate any GitHub App token if bot had write scope |
| GitHub App token leak | <15min | Rotate the GitHub App private key + invalidate installation tokens |
| Database breach (suspected) | <30min | Rotate ALL secrets; force re-auth all admins; full audit log review; offline DB snapshot for forensics |
| Backend host compromise | <30min | Take backend offline; restore from clean snapshot; rotate all secrets; review audit log |
| Lost hardware key | <24h | Recovery flow via second admin's WebAuthn re-auth + email round-trip; enroll new key |

---

*THREAT_MODEL.md — review every 6 months or after any incident. Deltas tracked in `Docs/adr/` if assumptions change.*
