# server/ — Unity AI Lab Unified Server

The single Node process that serves everything: marketing site, admin portal frontend, admin backend APIs, WebSocket, and visitor tracking. Per `Docs/ADMIN_PORTAL_ARCHITECTURE.md`.

---

## Quick start (local dev)

```bash
cd server
npm install
cp .env.example .env       # defaults work out of the box for dev
npm run dev                 # http://localhost:3000
```

What happens:

- Hono server starts on `http://localhost:3000`
- Vite middleware attached for HMR on the marketing site + admin frontend
- SQLite DB auto-created at `server/data/dev.db`
- Local Ed25519 keys auto-generated to `server/local-keys/` on first boot (gitignored)
- `DEV_AUTH_BYPASS=true` (default in `.env.example`) — login page shows a "Dev Login as <admin>" picker that issues a session JWT without contacting Google
- All API routes mounted under `/api/*`
- WebSocket at `/ws` (humans) and `/ws/bot` (bot proxies)

Browser opens to `http://localhost:3000/` (marketing site) and `http://localhost:3000/admin/` (admin portal).

---

## Production

```bash
cd server
npm install
# set real values in .env (loaded from secrets manager in real deploys):
#   DEV_AUTH_BYPASS=false
#   DATABASE_URL=postgres://...
#   GOOGLE_OAUTH_CLIENT_ID=...
#   GOOGLE_OAUTH_CLIENT_SECRET=...
#   JWT_SIGNING_KEY=... (Ed25519 PEM)
#   ... etc per .env.example
npm run build
npm run start              # http://0.0.0.0:$PORT
```

Production mode:
- No Vite middleware — serves prebuilt `dist/` static files
- Postgres connection (DATABASE_URL must be set)
- Google OAuth real flow (DEV_AUTH_BYPASS rejected if NODE_ENV=production)
- TLS termination assumed at reverse proxy (Caddy / nginx / Cloudflare)

---

## Layout

```
server/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md (this file)
├── src/
│   ├── index.ts            ← entry: Hono app, vite middleware in dev, listens on PORT
│   ├── config/
│   │   ├── env.ts          ← env var loading + validation (zod)
│   │   └── admin_allowlist.ts  ← the 4 admin emails
│   ├── auth/
│   │   ├── oauth.ts        ← Google OAuth flow
│   │   ├── webauthn.ts     ← @simplewebauthn server-side
│   │   ├── session.ts      ← JWT issue/verify/revoke
│   │   └── dev_bypass.ts   ← DEV_AUTH_BYPASS shortcut (dev only)
│   ├── db/
│   │   ├── connection.ts   ← drizzle + better-sqlite3 (dev) or pg (prod)
│   │   ├── schema.ts       ← drizzle schema definitions
│   │   └── migrate.ts      ← runs SQL migrations on boot
│   ├── middleware/         ← security, session, csrf, rate-limit, audit, error
│   ├── api/                ← HTTP route handlers
│   ├── ws/                 ← WebSocket handlers (human + bot)
│   └── lib/                ← jwt, crypto, logger, errors, ed25519
├── migrations/             ← SQL migrations (10 files)
├── data/                   ← (gitignored) local SQLite DB + uploads
├── local-keys/             ← (gitignored) auto-generated dev keys
└── dist/                   ← (gitignored) build output
```

---

## Environment variables

See `.env.example` for the full list. Critical ones:

| Var | Dev default | Prod | Notes |
|---|---|---|---|
| `NODE_ENV` | `development` | `production` | Production mode rejects `DEV_AUTH_BYPASS=true` |
| `PORT` | `3000` | `8080` typically | The single port the unified server binds to |
| `DATABASE_URL` | `sqlite://./data/dev.db` | `postgres://...` | Auto-created in dev |
| `DEV_AUTH_BYPASS` | `true` | `false` (or unset) | Skip Google OAuth in dev only |
| `GOOGLE_OAUTH_CLIENT_ID` | empty | required | Google Cloud Console OAuth client |
| `GOOGLE_OAUTH_CLIENT_SECRET` | empty | required | From secrets manager in prod |
| `JWT_SIGNING_KEY` | auto-gen to `local-keys/` | required (Ed25519 PEM) | Signs all session JWTs |
| `WEBAUTHN_RP_ID` | `localhost` | `admin.unityailab.com` | WebAuthn relying-party ID |
| `WEBAUTHN_ORIGIN` | `http://localhost:3000` | `https://admin.unityailab.com` | Origin browsers send to WebAuthn |
| `FILE_STORAGE_KIND` | `local` | `r2` | Filesystem in dev, R2 in prod |

---

## Common tasks

| Task | Command |
|---|---|
| Start dev | `npm run dev` |
| Run migrations manually | `npm run migrate` |
| Reset dev DB | `rm -rf data/dev.db && npm run dev` |
| Rotate dev keys | `rm -rf local-keys/ && npm run dev` |
| Type-check | `npm run typecheck` |
| Build for prod | `npm run build` |
| Run prod server | `npm run start` |

---

## Security notes (read before running outside dev)

- **Never commit `.env`.** Gitignored at repo root.
- **Never commit `local-keys/`.** Dev keys are unsuitable for prod.
- **Never run with `DEV_AUTH_BYPASS=true` outside localhost.** Production startup rejects it.
- **Always set TLS** at the reverse-proxy layer for prod.
- **Rotate the GitHub App private key** if it ever appears in a log, backup, or any artifact you don't fully control.

See `Docs/THREAT_MODEL.md`, `Docs/INCIDENT_RESPONSE.md`, `Docs/DATA_CLASSIFICATION.md`.

---

*server/README.md — update when env vars change or scripts are added.*
