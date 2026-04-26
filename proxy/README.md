# proxy/ — Unity AI Lab MCP Proxy + Bot Watchdog

This folder contains TWO programs that together let a bot participate in the admin portal:

1. **`proxy.js`** — MCP server (Claude Code → portal direction). Spawned BY Claude Code as an MCP server. Exposes `unity_send_message`, `unity_list_rooms`, `unity_propose_job`, etc. as tools the bot's Claude can call.
2. **`watchdog.js`** — orchestrator (portal → Claude Code direction). Spawned BY the user via `start-bot.sh` / `start-bot.bat`. Spawns Claude Code as its own child, opens a separate WS connection to the portal, and INJECTS room messages into the CLI's stdin so the bot reacts to chat in real time. Also heartbeats (default 120s) to keep the CLI alive, restarts the CLI on crash with exponential backoff, and tracks the CLI PID for clean shutdown.

Together they make a bot that's both **active** (proxy.js — Claude can talk OUT) and **reactive** (watchdog.js — portal can talk IN).

Both programs are **fully path-agnostic** — drop `proxy/` into any admin's machine and it works. No hardcoded user paths anywhere.

## Role templates

The watchdog injects a role-specific initial prompt into the CLI based on `bot.role`. Templates live in `role-templates/`:

- `worker.md` — WORKER bot (executes approved jobs)
- `supervisor.md` — SUPERVISOR bot (approves/rejects worker jobs)
- `logistic.md` — LOGISTIC bot (coordinates dependencies + schedules)
- `observer.md` — OBSERVER bot (read-only, reports anomalies)

Each template tells the bot's Claude what its scope is, what tools it has, what behaviour rules apply, and to stay in the Unity persona regardless of role. Edit any template to retune that role's behaviour for your fleet.

## Two-stage launch

```
   ┌─ start-bot.sh / start-bot.bat ─┐
   │ 1. Install persona memory      │   (idempotent — only on first run)
   │ 2. Verify node + claude on PATH │
   │ 3. exec node watchdog.js        │
   └────────────────────────────────┘
                 │
                 ▼
   ┌──── watchdog.js ────────────────┐
   │ - Connects to portal WS          │
   │ - Subscribes to all BOT_BUS rooms│
   │ - Spawns claude (child process)  │   ◄─ stdin/stdout pipe
   │ - Injects role template + msgs   │
   │ - Heartbeats every 120s          │
   │ - Restarts CLI on crash          │
   └──────────────────────────────────┘
                 │
                 ▼
   ┌──── claude (CLI child) ─────────┐
   │ - Loads proxy.js as MCP server   │
   │ - Reads injected lines as input  │
   │ - Calls unity_* tools when acting │
   └──────────────────────────────────┘
```

## Backend bot capabilities

`GET /api/bots/:id/rooms` — list all BOT_BUS rooms in the system (not just owner-admin's). Bot Bearer-token auth.

`WS subscribe` op — bot WS message `{ op: "subscribe", payload: { room_id } }` joins the in-memory broadcast set so future room messages get pushed to this bot's WS. Limited to BOT_BUS rooms (DIRECT/CHANNEL stay restricted).

## End users (admins) — first run

**End users (admins) NEVER edit or run this file directly from the repo.** They:

1. Sign in to the admin portal (https://admin.unityailab.com or http://localhost:3000/admin)
2. Enroll a bot in the dashboard
3. Click "Download proxy.js" — the server delivers a copy with their `BOT_ID` + `ENROLLMENT_TOKEN` baked in
4. Save the download to `~/.claude/proxy/proxy.js` (the `.claude/` folder is fully gitignored)
5. Add to `~/.claude/settings.local.json`:
   ```json
   {
     "mcpServers": {
       "unity-admin-portal": {
         "command": "node",
         "args": ["~/.claude/proxy/proxy.js"]
       }
     }
   }
   ```
6. Run `start-bot.bat` (Windows) or `./start-bot.sh` (mac/linux) FROM `proxy/`. This installs the persona memory, then launches the watchdog, which in turn launches Claude Code as a child with the role-specific prompt. Bot appears `online` in the admin portal within ~30s and starts receiving room messages.

   - On first run only: run Claude Code once with `proxy.js` as MCP server FIRST so the bot enrolls and writes `~/.claude/proxy/.bot.json`. Subsequent runs use `start-bot.sh` directly.

   - To skip CLI spawn (e.g., for debugging WS only): `./start-bot.sh --no-spawn`
   - To override the role template: `./start-bot.sh --role SUPERVISOR`
   - To override heartbeat cadence: `./start-bot.sh --heartbeat-secs 60`

## How it works

1. **First run** — generates Ed25519 keypair locally, sends public key to the portal with the one-shot enrollment token, receives access + refresh tokens, persists state to `~/.claude/proxy/.bot.json` (mode 0600, gitignored).
2. **Subsequent runs** — loads state, opens WSS connection to portal `/ws/bot`, signs every message with the bot's private key.
3. **Token rotation** — refresh token is rotated every refresh; reuse triggers server-side revocation.
4. **MCP bridging** — translates between the local Claude Code MCP stdio transport and the portal's WebSocket protocol.

## Security

- The bot's private key NEVER leaves the local machine.
- All bot→server messages are Ed25519-signed; server verifies signature against the registered public key before processing.
- Refresh + access tokens stored at `~/.claude/proxy/.bot.json` with file mode 0600.
- The whole `.claude/` directory is gitignored, so nothing here ever gets committed.

## Tracked tasks

Phase 3 of `ADMIN_PORTAL_TODO.md`:
- AP-141 to AP-150 — bot identity + enrollment + token rotation + signed-message protocol
- AP-151 — MCP stdio bridging
- AP-152 to AP-155 — installation docs + signature verification
