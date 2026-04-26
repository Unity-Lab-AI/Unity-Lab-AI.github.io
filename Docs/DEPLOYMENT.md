# DEPLOYMENT.md — Unity AI Lab Admin Portal

> **Created:** 2026-04-25
> **Scope:** Production deployment of the unified server (marketing site + admin portal + APIs + WS + visitor counter).

The portal ships with three deployment paths:

| Path | When | Files involved |
|---|---|---|
| **Local dev** | Hacking on your laptop | `npm run dev` |
| **Docker on a VPS** | Recommended for production | `Dockerfile`, `docker-compose.yml`, `deploy/Caddyfile` |
| **Bare systemd on a VPS** | If you don't want Docker | `deploy/unity-admin-portal.service` |

---

## 1. Pre-flight (do once)

### Generate signing secrets

The server needs three secrets that should be stable across restarts:

```bash
# JWT signing key (Ed25519 private hex)
node -e "import('@noble/ed25519').then(async (ed) => { const { sha512 } = await import('@noble/hashes/sha512'); ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m)); console.log(Buffer.from(ed.utils.randomPrivateKey()).toString('hex')); })"

# CSRF cookie secret (any 48+ random bytes)
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# GitHub webhook HMAC secret (any 32+ random bytes — paste into GitHub webhook config too)
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Save these somewhere safe (1Password / Bitwarden / etc.) — losing the JWT key invalidates all sessions.

### DNS

Point `admin.unityailab.com` at your VPS IP (A/AAAA records). Caddy will auto-provision TLS via Let's Encrypt on first hit if you use the Docker path.

---

## 2. Docker deployment (recommended)

```bash
# On the VPS (Ubuntu/Debian assumed)
git clone https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io.git
cd Unity-Lab-AI.github.io

# Create production env
cat > .env <<'EOF'
PUBLIC_BASE_URL=https://admin.unityailab.com
JWT_SIGNING_KEY=<paste from pre-flight>
CSRF_COOKIE_SECRET=<paste from pre-flight>
GITHUB_WEBHOOK_HMAC_SECRET=<paste from pre-flight>
WEBAUTHN_RP_ID=admin.unityailab.com
WEBAUTHN_ORIGIN=https://admin.unityailab.com
JWT_ISSUER=admin.unityailab.com
JWT_AUDIENCE=admin.unityailab.com
ADMIN_CLAIM_OPEN=false
LOG_LEVEL=info
EOF
chmod 600 .env

# Edit deploy/Caddyfile if your domain isn't admin.unityailab.com
# Then bring up the stack
docker compose up -d --build

# Tail logs
docker compose logs -f server
```

First boot: founder admin runs `.claude/setup` from their LOCAL machine, picks their identity, sets a password. Backend creates the user via the bootstrap path (no claim window needed because DB is empty). Founder lands on dashboard via the handoff URL.

To invite the other 3 admins: founder clicks "Open Claim Window" in the dashboard, distributes the universal `.claude/` template out-of-band, each admin runs `.claude/setup`, then founder closes the window.

### Updating

```bash
git pull
docker compose up -d --build
```

The DB volume persists across rebuilds.

### Backups

```bash
# Manual one-shot
docker compose run --rm backup

# Scheduled via host cron
echo "0 3 * * * cd /srv/unity-admin-portal && docker compose run --rm backup" | crontab -
```

Backups land in `./backups/admin-portal-data-<timestamp>.tar.gz`. Push them off-host (R2, S3, Backblaze) for disaster recovery.

---

## 3. Bare systemd deployment

If you prefer running Node directly:

```bash
# As root on the VPS
adduser --system --group --home /srv/unity-admin-portal unity
chown -R unity:unity /srv/unity-admin-portal
sudo -u unity git clone https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io.git /srv/unity-admin-portal
cd /srv/unity-admin-portal
sudo -u unity npm install

# Create env file
sudo -u unity cp server/.env.example server/.env
sudo -u unity vim server/.env  # fill in production values
sudo chmod 600 server/.env

# Install systemd unit
cp deploy/unity-admin-portal.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now unity-admin-portal
systemctl status unity-admin-portal
journalctl -u unity-admin-portal -f
```

Set up your own TLS termination (nginx + certbot, or Caddy standalone). Proxy to `http://127.0.0.1:3000`.

### Backups on the systemd path

Use the included `scripts/backup.sh`:

```bash
chmod +x /srv/unity-admin-portal/scripts/backup.sh
echo "0 3 * * * /srv/unity-admin-portal/scripts/backup.sh >> /var/log/unity-backup.log 2>&1" | crontab -
```

---

## 4. Switching to Postgres (optional)

The default is SQLite (file-on-disk). Postgres is recommended once you're past the 4-admin proof-of-concept and want:
- Read replicas for analytics
- Better backup tooling (pg_dump + PITR)
- Multi-process scaling

Steps:

```bash
# In docker-compose.yml uncomment the `db:` service block
# Set DATABASE_URL in .env
echo "DATABASE_URL=postgresql://admin_portal:CHANGEME@db:5432/admin_portal" >> .env
echo "POSTGRES_PASSWORD=CHANGEME" >> .env

# Add pg to package.json deps (one-time)
# "pg": "^8.13.0"
# "@types/pg": "^8.11.0"
npm install

# Bring up the stack
docker compose up -d --build
```

Migrations auto-translate SQLite-isms (datetime('now'), AUTOINCREMENT, BLOB) to Postgres equivalents on first run. See `server/src/db/connection.ts` for the translation rules.

**Caveat:** Postgres path's synchronous query API isn't fully wired in this round (tracked AP-051). API handlers currently use better-sqlite3's sync API — refactoring to async will be a separate session.

---

## 5. Switching to R2 / S3 (optional)

For the file-storage backend:

```bash
# Install AWS SDK (one-time)
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Update .env
echo "FILE_STORAGE_KIND=r2" >> .env
echo "R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com" >> .env
echo "R2_ACCESS_KEY_ID=<from cloudflare>" >> .env
echo "R2_SECRET_ACCESS_KEY=<from cloudflare>" >> .env
echo "R2_BUCKET=admin-portal-files" >> .env

docker compose up -d --build
```

Files uploaded after the switch land in R2; existing files in `server/data/uploads/` stay in local storage (per-row `storage_kind` column tracks where each file lives).

---

## 6. GitHub App setup (for repo coordination)

To enable the bot job-queue → real GitHub PR/merge flow:

1. **Create GitHub App** at `https://github.com/organizations/Unity-Lab-AI/settings/apps/new`
   - Name: `Unity Lab Admin Portal`
   - Webhook URL: `https://admin.unityailab.com/webhooks/github`
   - Webhook secret: paste your `GITHUB_WEBHOOK_HMAC_SECRET` from pre-flight
   - Repo permissions:
     - Contents: Read & Write
     - Pull requests: Read & Write
     - Metadata: Read
     - Deployments: Read
     - Workflows: Read
   - Subscribe to events: `push`, `pull_request`, `deployment_status`, `workflow_run`
   - Install to: your `Unity-Lab-AI` org repos
2. Generate a private key (`.pem`), download
3. Note the App ID + Installation ID (visible in the App's installation page)
4. Add to `.env`:
   ```
   GITHUB_APP_ID=<numeric app id>
   GITHUB_APP_INSTALLATION_ID=<numeric install id>
   GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
   ```
   (Use `\n` for newlines if you need to inline the PEM in a single env var line.)
5. Restart: `docker compose up -d`

Branch protection: in the public repo's settings → Branches, protect `main`:
- Require a pull request before merging
- Require status checks to pass (your CI workflow)
- Disallow force pushes
- Restrict who can push to matching branches → only the GitHub App

---

## 7. Initial admin enrollment (production)

After the server is up:

1. **Founder** runs `.claude/start.bat` (or `.sh`) on their LOCAL machine, with the universal `.claude/` template
2. Setup wizard asks "which admin?" → pick from sponge/gee/red/alfreddo → set a password
3. Setup wizard hits `https://admin.unityailab.com/api/auth/claim` (no token needed because DB is empty — bootstrap path)
4. Browser auto-opens via handoff URL, founder lands on dashboard
5. Founder clicks "Open Claim Window" in the right sidebar
6. Founder distributes the universal `.claude/` template to the other 3 admins (Signal/in-person)
7. Each runs the same `.claude/setup` wizard
8. Founder clicks "Close Claim Window" once all 4 are enrolled

For bot enrollment: each admin in the dashboard → Bots `+` → name + role → click "Download proxy.js" → save to `~/.claude/proxy/proxy.js` → add MCP entry to `~/.claude/settings.local.json` → restart Claude Code.

---

## 8. Verifying the deploy

| Check | Command |
|---|---|
| Backend up | `curl https://admin.unityailab.com/healthz` → `{"status":"ok"}` |
| DB ready | `curl https://admin.unityailab.com/readyz` → `{"ready":true,"checks":{...}}` |
| TLS | `curl -I https://admin.unityailab.com/admin/` → `HSTS: max-age=...` header present |
| Frontend | Open `https://admin.unityailab.com/admin/` in a browser |
| WebSocket | After login, open devtools Network → look for a `ws` connection to `/ws` |
| Webhook | Trigger a test push to a watched repo, verify event appears in dashboard activity feed |

---

## 9. Disaster recovery

| Scenario | Recovery |
|---|---|
| Backend host dies | Restore latest backup tarball to a fresh host, point DNS, redeploy. RTO ~1h. |
| Single admin compromised | OWNER suspends them via dashboard; revokes their bot tokens; rotates `JWT_SIGNING_KEY` if session impersonation is suspected. |
| `JWT_SIGNING_KEY` leaked | Generate new key, update env, restart server. ALL sessions invalidated immediately. Admins re-login. |
| GitHub App private key leaked | Rotate via GitHub App settings, update `.env`, restart. Bot mediation pauses until done. |
| `GITHUB_WEBHOOK_HMAC_SECRET` leaked | Rotate at GitHub + in `.env` simultaneously, restart. No data loss — webhook events just temporarily reject during the swap. |
| All admins lose passwords AND `.claude/` templates | Founder SSHs into VPS, manually deletes their row from `users` table + `user_passwords` table, opens claim window, re-enrolls. |

---

## 10. Cost estimate (for 4 admins)

| Component | Provider | Monthly |
|---|---|---|
| VPS (1GB RAM, 25GB disk) | Hetzner CX11 / Vultr | $5 |
| Domain | Namecheap | ~$1 |
| TLS | Let's Encrypt (Caddy auto) | $0 |
| Backups (off-host) | Backblaze B2 | <$1 |
| **Total** | | **~$7/month** |

R2 / Postgres / advanced monitoring are optional and incremental.

---

*DEPLOYMENT.md — update when stack components change. Test the disaster-recovery scenarios at least quarterly.*
