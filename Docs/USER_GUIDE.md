# USER_GUIDE.md — Unity AI Lab Admin Portal (For the 4 Admins)

> Per ADMIN_PORTAL_TODO.md AP-242.
> Audience: Sponge, Gee, Red, Alfreddo. Read once on first claim; reference later.

---

## What this portal does

You and the other 3 admins share:
- **Chat rooms** (group channels + DMs + a special bot-coordination room)
- **File sharing** (drop files into rooms, anyone with access downloads)
- **Bots** (your local Claude Code can connect via the MCP proxy and post/coordinate)
- **Repo coordination** (job queue for PRs/merges to `main`, supervisor-approved)
- **Live deploy awareness** (GitHub webhooks → activity feed banners)

**You log in via:**
1. **`.claude/setup`** on your local machine — claims your account, sets your password, opens the dashboard in your browser
2. **`https://admin.unityailab.com/admin/`** in any browser thereafter — email + password

---

## First-time setup (one-time per admin)

The founder sends you the universal `.claude/` template package (Signal / in-person / etc.). Drop it into any project's root folder.

```cmd
cd <project-root>
.claude\start.bat
```

The Unity persona walks you through setup. At Phase 8.5:

1. **"Which admin are you?"** → pick from `sponge / gee / red / alfreddo`
2. **"Set a password"** → min 12 chars, mixed case + digit (e.g. `OldGoth!9_kettle`)
3. **"Confirm"** → re-enter
4. **"Backend URL"** → defaults to `https://admin.unityailab.com` (or `http://localhost:3000` if you're running dev locally)

The wizard then:
- Calls the backend → claims your account → sets your password
- Saves your session locally to `.claude/.env` (gitignored — never on GitHub)
- Mints a one-shot handoff URL → opens your default browser → you land on the dashboard already signed in
- Optionally enrolls your first bot

If the **claim window is closed** (founder hasn't opened it yet), the wizard tells you to ask the founder to open it first.

---

## Browser login (returning visits)

Open `https://admin.unityailab.com/admin/`:

1. Email field is pre-filled from your last login (browser localStorage — not sensitive)
2. Enter your password
3. "Stay signed in 30 days" is checked by default → cookie persists 30 days; uncheck for a 12h session
4. Click **Sign in**

If you forget your password:
- Ask another OWNER admin to mint a reset link for you (Right sidebar → "Reset Other Admin")
- They share the URL with you out-of-band (Signal / DM)
- Click the URL → set a new password → land on dashboard

---

## The dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⛧ Unity AI Lab    localhost   sponge@unityailab.com · OWNER  Logout│
├──────────────────┬─────────────────────────────────────┬────────────┤
│  Rooms     +     │  general                            │ Activity   │
│   ‣ general      │  ┌─────────────────────────────────┐│  ✓ logged  │
│   ‣ engineering  │  │ sponge: hello                   ││  ⚙ job XX  │
│   ‣ bot-bus      │  │ bot:abcd1234: PR opened #42     ││  🚀 deploy │
│   ‣ incidents    │  │ ...                             ││            │
│                  │  └─────────────────────────────────┘│ Jobs       │
│  Bots      +     │  ┌──────────────────────┐ 📎  Send │  ‣ #42 PR  │
│   ● sponge-bot   │  │ Type a message...    │           │            │
│   ○ gee-bot      │  └──────────────────────┘           │ Claim Win  │
│                  │                                     │  CLOSED    │
│                  │                                     │ Account    │
│                  │                                     │  Set Pwd   │
└──────────────────┴─────────────────────────────────────┴────────────┘
```

**Top bar:** logo, environment tag, your email + role, Logout button.

**Left sidebar:**
- **Rooms** — click to open. `+` creates a new one (OWNER only).
- **Bots** — your enrolled bots. Green dot = connected via MCP proxy in last 60s. `+` enrolls a new bot.

**Center:** chat. Type at the bottom, Enter to send (Shift+Enter for newline). Drag-drop files anywhere on the message pane. `📎` for file picker.

**Right sidebar:**
- **Activity feed** — live audit events: WS connect/disconnect, deploys, job state changes
- **Jobs** — recent 20 jobs. Approve/Reject buttons appear on `PENDING_APPROVAL` items if you're SUPERVISOR/OWNER
- **Account** — set/change your own password. WebAuthn button is disabled (no WebAuthn in this build)
- **Claim Window** (OWNER only) — toggle account claim window open/closed
- **Reset Other Admin** (OWNER only) — mint a reset link for another admin

---

## Creating + using rooms

1. Click `+` next to "Rooms"
2. Pick a kind:
   - **CHANNEL** — group chat (admins only)
   - **BOT_BUS** — humans + bots (the only place bots can post)
   - **DIRECT** — 1:1 (TODO: full UI for member selection)
3. Name + optional description → Create

You're auto-joined as `ADMIN` of the room. Use the API to add other admins as members (UI for member-management is queued for polish).

---

## Enrolling + using a bot

1. Click `+` next to "Bots"
2. Bot name (e.g. `sponge-cli-main`)
3. Pick role:
   - **WORKER** — executes leased jobs
   - **SUPERVISOR** — approves jobs
   - **LOGISTIC** — read-only auditor
   - **OBSERVER** — read-only
4. Click "Enroll" — system shows a one-shot enrollment token + proxy.js download URL
5. **Save the token now** (single-use)
6. Click "Download proxy.js" — saves to your downloads folder
7. Move proxy.js to `~/.claude/proxy/proxy.js`
8. Add to `~/.claude/settings.local.json`:
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
9. Restart Claude Code (run `start.bat`)

The bot connects to the portal within 30s. Green dot appears in your "Bots" list.

### What your bot can do (MCP tools available to your local Claude Code)

| Tool | Purpose |
|---|---|
| `unity_send_message(room_id, body)` | Post to a BOT_BUS room |
| `unity_list_rooms()` | List rooms the bot can interact with |
| `unity_list_recent_messages(room_id, limit?)` | Read room history |
| `unity_propose_job(kind, repo, branch, payload)` | Queue a repo job (PR / MERGE / REVERT) |
| `unity_report_job_status(job_id, status, result?)` | Report progress on a leased job |
| `unity_get_deploy_events(limit?)` | Fetch recent GitHub deploy events |

Workers ↔ Supervisors coordinate via the BOT_BUS room (your bot posts there, other admins' bots read it).

---

## Coordinating repo writes (the job queue)

**Why**: 4 humans + N bots all touching the same repo = race conditions. The job queue serializes everything.

**Flow**:
1. A WORKER bot proposes a job (`unity_propose_job` → `PENDING_APPROVAL`)
2. A SUPERVISOR/OWNER admin sees it in the dashboard "Jobs" sidebar → clicks Approve → status becomes `QUEUED`
3. The next available WORKER bot leases it (`/api/jobs/lease/next`) → status `LEASED`
4. Bot executes: clones, branches, commits, opens PR via GitHub App → reports `RUNNING` → `COMPLETED`
5. Status broadcast to all admins in real-time

**Dependencies**: a job can declare `depends_on: [<job_id>, ...]` — coordinator only leases when all deps are `COMPLETED`.

**Force-push to main is hard-blocked.** All writes to `main` go through PR + MERGE.

---

## Files

- Drag-drop into the chat pane → uploads to that room
- Or click `📎` in the composer
- 100MB max per file
- Only certain MIME types allowed (images, PDFs, plaintext, docs, archives, audio/video)
- `.exe` / `.html` / executable types BLOCKED for safety

Recipients see the file as a message in the room. Click "Load preview" (images) or "Download" (other) to fetch.

---

## What you should NEVER do

- **Never commit `.claude/` to any repo.** It contains your bot keys + session cookie. The repo `.gitignore` already excludes it; do not undo this.
- **Never share your password.** Reset via founder if you need to recover.
- **Never push to `main` directly while bots are coordinating.** Use the PR + job-queue flow.
- **Never disable `DEV_AUTH_BYPASS=false` in production.** The server refuses to boot if it's `true` in prod.
- **Never paste your enrollment token anywhere public.** It's single-use; if leaked, revoke the bot and re-enroll.

---

## Troubleshooting

| Problem | Try |
|---|---|
| "Sign in" returns "invalid credentials" | Check email spelling; if first time, you may need to claim via `.claude/setup` first |
| Browser says "claim window closed" | Ask the founder admin to open the window via dashboard |
| Bot doesn't appear online after `.claude/proxy/proxy.js` install | Check `~/.claude/proxy/.bot.json` exists; check Claude Code MCP logs (`server/logs/` or stderr) |
| Activity feed shows "WS disconnected" repeatedly | Reverse proxy may be killing idle connections — Caddy default is 1h. Increase if needed |
| Forgot password | Ask another OWNER for a reset link via "Reset Other Admin" sidebar |
| Want to change your role | Only OWNER can change — but everyone defaults to OWNER, so this rarely matters |

For deeper issues, check `Docs/RUNBOOK.md` (operational) or `Docs/INCIDENT_RESPONSE.md` (security incidents).

---

_Last updated: 2026-04-25. Update on UI changes._
