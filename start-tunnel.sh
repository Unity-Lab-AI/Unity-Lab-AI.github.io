#!/usr/bin/env bash
# Daily-use launcher (macOS / Linux) for Unity AI Lab admin portal in LOCAL TUNNEL MODE.
# Starts backend + Cloudflare Tunnel in parallel via background jobs.
# Ctrl+C kills both.

set -e
cd "$(dirname "$0")"

if ! command -v cloudflared >/dev/null 2>&1; then
    echo "ERROR: cloudflared not on PATH."
    echo "Run scripts/setup-cloudflare-tunnel-local.sh first."
    exit 1
fi
if [ ! -f "server/.env" ]; then
    echo "ERROR: server/.env missing."
    echo "Run scripts/setup-cloudflare-tunnel-local.sh first to generate it."
    exit 1
fi

TUNNEL_NAME="${TUNNEL_NAME:-admin-portal-local}"

echo "Starting Unity AI Lab admin portal in local-tunnel mode..."
echo
echo "  Backend:  npm run dev (background)"
echo "  Tunnel:   cloudflared tunnel run $TUNNEL_NAME (background)"
echo
echo "Live at: https://admin.unityailab.com/"
echo "         https://admin.unityailab.com/admin/"
echo
echo "Press Ctrl+C to stop both."
echo

# Trap Ctrl+C → kill both jobs
trap 'echo; echo "Stopping..."; kill $(jobs -p) 2>/dev/null; wait; exit 0' INT TERM

# Start backend
npm run dev &
BACKEND_PID=$!
echo "[backend  pid=$BACKEND_PID]"

sleep 3

# Start tunnel
cloudflared tunnel run "$TUNNEL_NAME" &
TUNNEL_PID=$!
echo "[tunnel   pid=$TUNNEL_PID]"

# Wait for any to exit
wait
