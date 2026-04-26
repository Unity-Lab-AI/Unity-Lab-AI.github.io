# CLOUDFLARE_DEPLOYMENT.md — Unity AI Lab Admin Portal on Cloudflare

> Targets the founder's existing Cloudflare setup (DNS for `unityailab.com` already there for email forwarding to sponge@/gee@/red@/alfreddo@).

Two paths supported. **Pick one based on whether you want always-on for $5/mo, or PC-on-only for $0.**

| Path | Backend runs on | Always on? | Cost | One-time setup |
|------|-----------------|------------|------|----------------|
| **A. LOCAL-TUNNEL** ⭐ user's choice | Founder's PC | Only while PC is on | $0 | `scripts/setup-cloudflare-tunnel-local.ps1` |
| **B. VPS** | Hetzner CX11 | 24/7 | ~$5/mo | `scripts/setup-cloudflare-vps.sh` |

Both paths use the SAME `https://admin.unityailab.com` URL via Cloudflare Tunnel. Both leave Cloudflare Pages auto-deploying the marketing site to `https://unityailab.com/`. Both leave email forwarding untouched.

Skip to **Path A (LOCAL-TUNNEL)** for the user's chosen setup. **Path B (VPS)** is below it.

---

## Path A — LOCAL TUNNEL (founder's PC + Cloudflare Tunnel + universal `.claude/`)

This is the user's chosen path. Backend runs on the founder's PC. Cloudflare Tunnel exposes it at `https://admin.unityailab.com` while the PC is on. Other 3 admins receive the universal `.claude/` template and connect from their own machines (or any folder, on any project).

### One-time founder setup (~10 min)

**On Windows, as Administrator:**

```powershell
cd C:\Users\<you>\Desktop\Website
powershell -ExecutionPolicy Bypass -File scripts\setup-cloudflare-tunnel-local.ps1
```

What it does:
1. Installs `cloudflared` via winget (skips if already there)
2. Cloudflare login (opens one-time browser auth — pick the `unityailab.com` zone)
3. Creates tunnel `admin-portal-local`
4. Routes DNS `admin.unityailab.com` → tunnel (auto-creates the CNAME in Cloudflare DNS)
5. Writes `~/.cloudflared/config.yml` mapping `admin.unityailab.com → http://localhost:3000`
6. Generates `JWT_SIGNING_KEY` + `CSRF_COOKIE_SECRET` + `GITHUB_WEBHOOK_HMAC_SECRET`
7. Writes `server\.env` with those secrets + `PUBLIC_BASE_URL=https://admin.unityailab.com` + ICACLS-locked
8. Prints daily-use instructions

**On macOS / Linux / Git Bash:**
```bash
bash scripts/setup-cloudflare-tunnel-local.sh
```

### Daily use (every time you want the portal up)

```cmd
cd C:\Users\<you>\Desktop\Website
start-tunnel.bat
```

Opens 2 terminal windows:
- **"Unity Backend"** — `npm run dev` (Hono + SQLite + Vite middleware on `localhost:3000`)
- **"Unity Cloudflare Tunnel"** — `cloudflared tunnel run admin-portal-local` (forwards inbound from Cloudflare → localhost:3000)

Within ~5 seconds, `https://admin.unityailab.com/admin/` is live for all 4 admins.

**Closing either window takes the portal down. Re-run `start-tunnel.bat` to restart.**

### Founder bootstrap (claim your own account)

1. Run `start-tunnel.bat` — wait for both windows to show "ready"
2. Open `https://admin.unityailab.com/admin/` in your browser
3. **Dev tab → pick yourself → land on dashboard** (DEV_AUTH_BYPASS=true is on by default in local-tunnel mode for the founder's first claim)
4. Right sidebar → **Set / Change Password** → set a real password
5. Logout, log back in via the **Sign in** tab with email + password — verify it works

### Distributing the universal `.claude/` to the other 3 admins

The `.claude/` folder in `Website/.claude/` IS the universal template. **Project-agnostic.** Drop it into ANY folder — existing repo OR a brand-new empty folder. The setup wizard works off existing files when present, OR asks "what are we building?" when not. Either way, Phase 8.5 always asks once if the user is a Unity AI Lab admin.

**Step-by-step:**

1. **Founder turns OFF dev bypass** so the public portal doesn't have a dev login picker reachable from the internet:
   ```
   server\.env  →  DEV_AUTH_BYPASS=false
   ```
   Then restart `start-tunnel.bat`.

2. **Founder opens the claim window** in dashboard → right sidebar → "Open Claim Window" → confirm.

3. **Founder zips the `.claude/` folder:**
   ```cmd
   cd C:\Users\<you>\Desktop\Website
   tar -caf claude-template.zip .claude
   ```
   (Or right-click `.claude/` in Explorer → Send to → Compressed (zipped) folder.)

4. **Founder shares `claude-template.zip` with the other 3 admins** out-of-band — Signal, USB stick, in-person, encrypted email. Never as a public attachment.

5. **Each receiving admin:**
   - Picks any folder (existing project OR brand-new empty folder)
   - Unzips into the folder root → ends up with a `.claude/` subdirectory
   - Runs `.claude\start.bat`
   - Setup wizard fires → Phase 8.5 prompts: "Are you one of the Unity AI Lab admins?" → **yes** → picks their email → sets a password → claims
   - Setup wizard auto-detects backend URL (tries `https://admin.unityailab.com` first, falls back to `localhost:3000`)
   - Backend creates user, sets password, returns session cookie
   - Setup wizard mints a handoff URL → opens browser → admin lands on dashboard already authenticated

6. **Founder closes the claim window** once all 4 are enrolled.

After that, each admin can:
- Browser-login at `https://admin.unityailab.com/admin/` from any device with email + password (cookie persists 30 days with "Remember me")
- Run `.claude/` in any project → bot enrolled for THAT project → coordinated repo writes work via the portal

### What if the founder's PC is off?

`https://admin.unityailab.com` becomes unreachable. Browser logins fail with network errors. Bots disconnect.

When the founder's PC comes back online and `start-tunnel.bat` runs again, everything reconnects automatically — bots reconnect via their refresh tokens, browser sessions resume from cookie.

If you want **always-on**, switch to Path B (VPS) below. Same `.claude/` template still works — admins don't need to re-enroll, the tunnel target just moves from your PC to the VPS.

---

## Path B — VPS (always-on, ~$5/mo)

---

## Architecture

```
                      ┌───────────────────────────────┐
                      │  unityailab.com (DNS + email) │
                      │      Cloudflare zone          │
                      └─────────────┬─────────────────┘
                                    │
            ┌───────────────────────┼─────────────────────────┐
            │                       │                         │
   ┌────────▼─────────┐  ┌─────────▼─────────┐    ┌──────────▼─────────┐
   │  unityailab.com  │  │ admin.unity...com │    │  Email forwarding  │
   │ (CNAME → Pages)  │  │ (CNAME → Tunnel)  │    │ sponge@/gee@/red@/ │
   │  STATIC SITE     │  │  ADMIN PORTAL     │    │ alfreddo@          │
   │  Cloudflare      │  │  → Tunnel → VPS   │    │ Cloudflare Email   │
   │  Pages           │  │  Hetzner $5/mo    │    │ Routing            │
   └──────────────────┘  └─────────┬─────────┘    └────────────────────┘
                                   │
                                   ▼
                         ┌─────────────────┐
                         │  Hetzner CX11   │
                         │  Docker Compose │
                         │  - server:3000  │
                         │  - cloudflared  │  (tunnels OUT to CF)
                         └─────────────────┘
```

What stays on Cloudflare's side (no setup beyond DNS + the tunnel registration):
- TLS termination (auto, free)
- DDoS protection (auto, free tier)
- WAF (auto-rules on free tier; custom rules on paid)
- Edge caching for static
- Rate limiting (basic on free tier)

What runs on the VPS:
- The Hono unified server (port 3000, never exposed publicly)
- SQLite DB (or upgrade to Postgres later)
- File uploads (local fs in dev → R2 when wired)

---

## One-time setup (~30 min, founder action)

### 1. Cloudflare Pages — marketing site (auto-deploy from GitHub)

a. **Create API token:** Cloudflare dashboard → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template (despite the name, this also covers Pages). Restrict to your account. Save the token.

b. **Get account ID:** Cloudflare dashboard → any zone → right sidebar shows "Account ID". Copy.

c. **Add GitHub secrets:** GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
   - `CLOUDFLARE_API_TOKEN` = (the token from step a)
   - `CLOUDFLARE_ACCOUNT_ID` = (the account ID from step b)

d. **Create Pages project:** Cloudflare dashboard → Workers & Pages → Create → Pages → Direct Upload → Project name `unityailab`. (Or use `wrangler pages project create unityailab` if you prefer CLI.)

e. **Bind custom domain:** Pages project → Custom domains → Add → `unityailab.com` → CNAME `unityailab.pages.dev` → wait for SSL.

f. **Test:** push any commit to main. Watch the GitHub Actions workflow `cloudflare-pages-deploy.yml`. Within ~2 minutes the marketing site is live at `https://unityailab.com/`.

### 2. VPS provisioning (Hetzner CX11 = €4.51/mo)

a. Sign up at hetzner.com → Cloud → Add Server → CX11 (1 vCPU, 2GB RAM, 20GB SSD) → Ubuntu 22.04 → name `unity-admin-portal` → Add SSH key.

b. SSH in:
   ```bash
   ssh root@<vps-ip>
   ```

c. Install Docker:
   ```bash
   curl -fsSL https://get.docker.com | sh
   apt install -y git
   ```

d. Clone repo + checkout main:
   ```bash
   cd /srv
   git clone https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io.git unity
   cd unity
   ```

### 3. Cloudflare Tunnel — admin portal at `admin.unityailab.com`

a. **Install cloudflared on the VPS:**
   ```bash
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
   dpkg -i cloudflared.deb
   ```

b. **Login to Cloudflare** (opens browser-based auth on the VPS — uses a one-time URL you copy to your browser):
   ```bash
   cloudflared tunnel login
   ```
   Pick the `unityailab.com` zone.

c. **Create the tunnel:**
   ```bash
   cloudflared tunnel create admin-portal
   ```
   This prints a tunnel ID (UUID) and saves credentials JSON to `~/.cloudflared/<UUID>.json`.

d. **Route DNS:**
   ```bash
   cloudflared tunnel route dns admin-portal admin.unityailab.com
   ```
   Cloudflare automatically creates the CNAME pointing `admin.unityailab.com` at the tunnel.

e. **Get the tunnel token (for docker-compose):**
   ```bash
   cloudflared tunnel token admin-portal
   ```
   Copy the output — this becomes `TUNNEL_TOKEN` in the env file.

### 4. Backend env + first boot

```bash
cd /srv/unity

# Generate secrets
JWT_KEY=$(node -e "import('@noble/ed25519').then(async(ed)=>{const{sha512}=await import('@noble/hashes/sha512');ed.etc.sha512Sync=(...m)=>sha512(ed.etc.concatBytes(...m));console.log(Buffer.from(ed.utils.randomPrivateKey()).toString('hex'))}")
CSRF_KEY=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")
WEBHOOK_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")

# Create env file
cat > .env <<EOF
PUBLIC_BASE_URL=https://admin.unityailab.com
JWT_SIGNING_KEY=$JWT_KEY
CSRF_COOKIE_SECRET=$CSRF_KEY
GITHUB_WEBHOOK_HMAC_SECRET=$WEBHOOK_KEY
WEBAUTHN_RP_ID=admin.unityailab.com
WEBAUTHN_ORIGIN=https://admin.unityailab.com
JWT_ISSUER=admin.unityailab.com
JWT_AUDIENCE=admin.unityailab.com
ADMIN_CLAIM_OPEN=false
LOG_LEVEL=info
TUNNEL_TOKEN=<paste from step 3e>
EOF
chmod 600 .env

# Boot stack
docker compose -f deploy/cloudflare-tunnel-compose.yml --env-file .env up -d --build

# Tail logs
docker compose -f deploy/cloudflare-tunnel-compose.yml logs -f
```

Within ~30 seconds:
- `cloudflared` connects to Cloudflare edge
- `server` boots, applies migrations, starts listening on internal :3000
- `https://admin.unityailab.com/healthz` returns 200 (proxied through Cloudflare → tunnel → server)

### 5. Founder bootstrap claim

From your local machine:
1. Open `https://admin.unityailab.com/admin/`
2. (Wait — there's no Dev tab in prod, and no password set yet. Use `.claude/setup` instead:)
3. On your local machine, in any project where `.claude/` is installed:
   ```cmd
   .claude\start.bat
   ```
4. Setup wizard Phase 8.5 prompts which admin you are → pick `sponge@unityailab.com` (or whoever the founder is) + set password
5. Backend creates user (no claim window needed — DB is empty, bootstrap path)
6. Browser auto-opens to `https://admin.unityailab.com/admin/dashboard.html` already authenticated
7. Right sidebar → "Open Claim Window" → distribute the universal `.claude/` to the other 3 admins → they each claim
8. Founder closes claim window when all 4 enrolled

---

## Email integration

Your existing Cloudflare Email Routing for `sponge@/gee@/red@/alfreddo@unityailab.com` keeps working unchanged. The admin portal:
- Does NOT send emails by default (no SMTP configured)
- All notifications surface in the dashboard activity feed instead
- For password reset: founder generates a one-shot URL via the dashboard → shares via Signal/in-person (not email — security-by-channel)

If you want email-driven notifications (deploy alerts to all 4 admins, etc.), add SMTP creds to `.env` later — but it's not required for v1.

---

## DNS records summary (after setup)

| Record | Type | Target | Proxy |
|--------|------|--------|-------|
| `unityailab.com` | CNAME | `unityailab.pages.dev` | Yes (orange cloud) |
| `www.unityailab.com` | CNAME | `unityailab.com` | Yes |
| `admin.unityailab.com` | CNAME | `<tunnel-uuid>.cfargotunnel.com` | Yes (auto-created by `tunnel route dns`) |
| `unityailab.com` MX | MX | `route1.mx.cloudflare.net` etc. | (your existing email setup, unchanged) |

---

## Costs

| Item | Provider | Monthly |
|------|----------|---------|
| Pages hosting | Cloudflare | $0 (free, unlimited) |
| Tunnel | Cloudflare | $0 (free) |
| TLS / DDoS / WAF basic | Cloudflare | $0 |
| VPS | Hetzner CX11 | €4.51 |
| Domain | (you already own) | $0 |
| **TOTAL** | | **~$5/month** |

---

## Operations

| Task | Command |
|------|---------|
| Tail backend logs | `docker compose -f deploy/cloudflare-tunnel-compose.yml logs -f server` |
| Tail tunnel logs | `docker compose -f deploy/cloudflare-tunnel-compose.yml logs -f cloudflared` |
| Restart backend | `docker compose -f deploy/cloudflare-tunnel-compose.yml restart server` |
| Update | `git pull && docker compose -f deploy/cloudflare-tunnel-compose.yml up -d --build` |
| Backup | `docker compose -f deploy/cloudflare-tunnel-compose.yml run --rm backup` (uses main compose's backup profile — copy that block in if needed) |
| Open claim window | Dashboard right sidebar → "Open Claim Window" |

---

## What if Cloudflare goes down?

- Marketing site: down (Pages dependency).
- Admin portal: down (Tunnel dependency).
- Email: down (your existing setup already depends on Cloudflare).

In other words: Cloudflare uptime IS the SLA. Cloudflare's published 99.99% uptime is fine for this scale. If you ever need higher, the backend code can be redeployed to any non-Cloudflare host (Caddy fronting the VPS directly via `docker-compose.yml`) in <5 minutes.

---

_Last updated: 2026-04-25._
