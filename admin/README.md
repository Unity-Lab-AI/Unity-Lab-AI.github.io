# admin/ — Unity AI Lab Admin Portal Frontend

Static HTML/CSS/JS for the admin portal. Served by the unified Node server at `/admin/*`.

## Files

| File | Purpose |
|---|---|
| `index.html` | Login page — SSO + Password + Dev tabs |
| `dashboard.html` | Main app — chat, bots, files, activity feed |
| `styles/dark.css` | Shared dark theme (matches public site palette) |
| `styles/login.css` | Login page-specific styles |
| `styles/dashboard.css` | Dashboard layout (3-column grid) |
| `js/config.js` | Runtime config — `API_BASE_URL`, `WS_URL` (overridable for GH Pages mode) |
| `js/api.js` | Fetch wrapper with CSRF + JSON + error handling |
| `js/auth.js` | Login page logic — tab switching, dev picker, password, SSO redirect |
| `js/ws-client.js` | WebSocket client with exponential-backoff reconnect |
| `js/dashboard.js` | Dashboard controller — rooms, messages, bots, modals |

## Running locally

```
npm install
npm run dev
# open http://localhost:3000/admin/
```

The login page detects DEV_AUTH_BYPASS=true (server-side) and shows a "Dev" tab with a picker for the 4 admins.

## Production / VPS

Same code path. The Node server in `/server/` serves these files as static + provides the API + WS endpoints on the same origin.

## GitHub Pages static deploy

In static-only deploys (`npm run build:static && push to gh-pages`), the JS files are still shipped, but the API calls will fail because there's no backend. To make GH Pages mode useful:

1. Edit `js/config.js` to point `API_BASE_URL` at a hosted backend (e.g. `https://admin.unityailab.com`)
2. Or set `window.__ADMIN_CONFIG__ = { API_BASE_URL: '...' }` in an inline script BEFORE the modules load

For most use cases, the admin portal should NOT be deployed to public GitHub Pages — the static-only deploy mode exists for marketing-mirror scenarios where the admin features are intentionally unavailable.

## Tracked

ADMIN_PORTAL_TODO.md AP-081 through AP-140 (frontend + chat UI + real-time + files).
