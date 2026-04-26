#!/usr/bin/env bash
# One-shot VPS bootstrap for the Unity AI Lab admin portal on a Cloudflare-Tunnel-fronted VPS.
#
# Run this ONCE on a fresh Ubuntu 22.04 VPS (Hetzner CX11 or similar) AS ROOT.
# It installs Docker + cloudflared, clones the repo, creates the tunnel, generates
# secrets, writes .env, brings up the stack.
#
# You will be prompted to:
#   - Open a one-time Cloudflare login URL in your browser (cloudflared interactive)
#   - Pick the unityailab.com zone
#
# After this completes, admin.unityailab.com resolves through Cloudflare → Tunnel → this VPS.

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io.git}"
INSTALL_DIR="${INSTALL_DIR:-/srv/unity}"
TUNNEL_NAME="${TUNNEL_NAME:-admin-portal}"
ADMIN_HOST="${ADMIN_HOST:-admin.unityailab.com}"

if [ "$EUID" -ne 0 ]; then
  echo "Run as root."
  exit 1
fi

echo "==> updating apt"
apt-get update -qq

echo "==> installing prerequisites"
apt-get install -y -qq curl git ca-certificates

echo "==> installing Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

echo "==> installing cloudflared"
if ! command -v cloudflared >/dev/null 2>&1; then
  curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb" -o /tmp/cloudflared.deb
  dpkg -i /tmp/cloudflared.deb
fi

echo "==> cloning repo to $INSTALL_DIR"
if [ ! -d "$INSTALL_DIR" ]; then
  git clone "$REPO_URL" "$INSTALL_DIR"
else
  cd "$INSTALL_DIR" && git pull
fi
cd "$INSTALL_DIR"

echo "==> installing Node deps for crypto helpers"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
npm install --silent

echo
echo "==> Cloudflare Tunnel login (opens a one-time URL — copy to your browser)"
cloudflared tunnel login

echo
echo "==> creating tunnel '$TUNNEL_NAME'"
if cloudflared tunnel info "$TUNNEL_NAME" >/dev/null 2>&1; then
  echo "(tunnel already exists, reusing)"
else
  cloudflared tunnel create "$TUNNEL_NAME"
fi

echo
echo "==> routing DNS $ADMIN_HOST → tunnel"
cloudflared tunnel route dns "$TUNNEL_NAME" "$ADMIN_HOST" || echo "(DNS may already be routed — continuing)"

echo
echo "==> fetching tunnel token"
TUNNEL_TOKEN=$(cloudflared tunnel token "$TUNNEL_NAME")

echo
echo "==> generating secrets"
JWT_KEY=$(node -e "
  import('@noble/ed25519').then(async(ed)=>{
    const {sha512} = await import('@noble/hashes/sha512');
    ed.etc.sha512Sync = (...m)=>sha512(ed.etc.concatBytes(...m));
    process.stdout.write(Buffer.from(ed.utils.randomPrivateKey()).toString('hex'));
  });
")
CSRF_KEY=$(node -e "process.stdout.write(require('crypto').randomBytes(48).toString('base64url'));")
WEBHOOK_KEY=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64url'));")

echo
echo "==> writing .env"
cat > .env <<EOF
PUBLIC_BASE_URL=https://$ADMIN_HOST
JWT_SIGNING_KEY=$JWT_KEY
CSRF_COOKIE_SECRET=$CSRF_KEY
GITHUB_WEBHOOK_HMAC_SECRET=$WEBHOOK_KEY
WEBAUTHN_RP_ID=$ADMIN_HOST
WEBAUTHN_ORIGIN=https://$ADMIN_HOST
JWT_ISSUER=$ADMIN_HOST
JWT_AUDIENCE=$ADMIN_HOST
ADMIN_CLAIM_OPEN=false
LOG_LEVEL=info
TUNNEL_TOKEN=$TUNNEL_TOKEN
EOF
chmod 600 .env

echo
echo "==> bringing up stack via Cloudflare Tunnel docker-compose"
docker compose -f deploy/cloudflare-tunnel-compose.yml --env-file .env up -d --build

echo
echo "==> waiting for backend to become healthy (up to 60s)..."
for i in $(seq 1 60); do
  if docker compose -f deploy/cloudflare-tunnel-compose.yml exec -T server wget --quiet --spider http://localhost:3000/healthz 2>/dev/null; then
    echo "    ✓ backend up after ${i}s"
    break
  fi
  sleep 1
done

echo
echo "==> testing through Cloudflare (give DNS ~30s)"
sleep 30
if curl -fsS "https://$ADMIN_HOST/healthz" >/dev/null 2>&1; then
  echo "    ✓ $ADMIN_HOST is live"
else
  echo "    ⚠ $ADMIN_HOST not reachable yet — Cloudflare DNS propagation can take a few minutes"
fi

echo
echo "==================================================================="
echo "✓ Setup complete."
echo
echo "  Admin portal:  https://$ADMIN_HOST/admin/"
echo "  Health check:  https://$ADMIN_HOST/healthz"
echo
echo "Next steps:"
echo "  1. Founder runs '.claude/start.bat' on local machine"
echo "  2. Setup wizard Phase 8.5: pick admin identity + set password"
echo "  3. Founder lands in dashboard → opens claim window"
echo "  4. Distribute universal .claude/ to other 3 admins"
echo "  5. Each claims their account → founder closes window"
echo
echo "Logs:    docker compose -f deploy/cloudflare-tunnel-compose.yml logs -f"
echo "Restart: docker compose -f deploy/cloudflare-tunnel-compose.yml restart server"
echo "Update:  cd $INSTALL_DIR && git pull && docker compose -f deploy/cloudflare-tunnel-compose.yml up -d --build"
echo "==================================================================="
