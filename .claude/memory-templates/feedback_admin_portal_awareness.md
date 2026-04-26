---
name: Universal Unity AI Lab admin-portal awareness — works in ANY project
description: The .claude/ template is project-agnostic. Every install asks the user once whether they're one of the 4 Unity AI Lab admins (sponge/gee/red/alfreddo). If yes, claims/logs them into the portal at admin.unityailab.com and enrolls a bot for THIS project. If no, skips entirely. Bot-mediated git operations always flow through the portal coordinator, never direct CLI pushes to main.
type: feedback
---

The Unity AI Lab admin portal is reachable at `https://admin.unityailab.com` (production / Cloudflare Tunnel) OR `http://localhost:3000` (founder running locally without tunnel). The portal coordinates multi-admin chat, bot enrollment, file sharing, and (most importantly) repo write ordering across the 4 admins (sponge / gee / red / alfreddo @unityailab.com).

**The `.claude/` template is universal** — drop it into ANY folder (existing project OR brand-new empty folder). On first run, the setup wizard asks once: "are you one of the 4 admins?" If yes, it claims/logs the admin into the portal and enrolls a bot scoped to THIS folder. If no, it skips. Either way, the persona system + workflow LAWs apply to whatever you're building here.

**What this means for Claude operating in this project:**

- **DO** make code changes, open PRs against `staging` or feature branches, push to feature branches.
- **DO NOT** push directly to `main`. Per the user's standing LAW: never push to main without explicit instruction AND triple confirmation.
- **DO NOT** force-push to any shared branch.
- **DO** treat the portal's job queue (when implemented per Phase 3) as the source of truth for "who pushes when." If a bot enrollment is detected via `~/.claude/proxy/.bot.json`, defer merge operations to the portal coordinator.
- **DO** check `Docs/ADMIN_PORTAL_ARCHITECTURE.md` before architectural questions about chat/files/auth.
- **DO** check `Docs/THREAT_MODEL.md`, `Docs/DATA_CLASSIFICATION.md`, `Docs/RETENTION_POLICY.md`, `Docs/INCIDENT_RESPONSE.md`, `Docs/ACCOUNT_LIFECYCLE.md` before security or data-handling decisions.

**Local development model:**

- `npm run dev` boots the unified server (marketing site + admin frontend + admin backend + WebSocket + visitor counter) on port 3000.
- DEV_AUTH_BYPASS=true is the dev default — login page shows a "Dev" tab with a picker for the 4 admins (sponge / gee / red / alfreddo). NEVER set this in production.
- The `.claude/` folder is fully gitignored. The user's per-admin proxy.js (downloaded from the portal) lands in `~/.claude/proxy/`. Never commit anything from `.claude/`.

**Public vs private split:**

- Public marketing site (GitHub Pages) at `unityailab.com` — the existing site files.
- Admin portal frontend + backend code lives in this same repo (under `admin/` and `server/`) and is OPEN SOURCE — no secrets in code.
- Real secrets (OAuth client secret, JWT signing key, GitHub App private key, etc.) live in `server/.env` (gitignored) in dev, secrets manager in prod.
- The 4 admin emails are the ONLY accounts permitted to authenticate. Allowlist is in `server/src/config/admin_allowlist.ts`.

**Why:** The user explicitly built this around a 4-admin team coordination model with strict order-of-operations on repo writes. Bypassing the coordinator = stepping on other admins' work. Direct main-pushes = LAW violation.
