# ADR-001: Hosting stack

**Status:** Accepted (2026-04-25) — pending production deployment
**Context:** AP-005

## Decision

Use **Node.js + Hono framework** as the unified server. Single process serves marketing site (static), admin frontend (static), admin backend APIs, WebSocket, and visitor tracking. Runs in three modes:

1. **Local dev** — Vite middleware mode for HMR + Hono routes for everything else, SQLite, dev auth bypass.
2. **VPS production** — Same Hono server, no Vite middleware, serves prebuilt `dist/` as static, Postgres, real OAuth.
3. **GitHub Pages static** — Frontend-only build, admin features only work if a separate backend is reachable via configurable API_BASE_URL.

## Alternatives considered

| Option | Rejected because |
|---|---|
| **Cloudflare Workers + D1 + R2** | Forces "Workers-only" code patterns (limited Node API, no long-running connections, Durable Objects for WS = different mental model). User wants single npm-run-dev that works on any laptop. |
| **Express on Node** | Hono is roughly equivalent but has better TypeScript ergonomics, smaller footprint, runs on Node + Bun + Workers if we ever want to switch. |
| **Next.js / Astro / Remix** | Overkill — we don't need SSR/SSG framework; the marketing site is already static. Adds heavy build pipeline + framework lock-in. |
| **Fastify** | Comparable to Hono; we picked Hono for the multi-runtime portability. |
| **Two separate processes (frontend dev server + backend API)** | User explicitly wants ONE process: "npm run dev hosts it all even the visitor counter." |

## Consequences

- **Positive:** simple `npm run dev` boots everything; same code path in dev as in prod (just different env); GH Pages mode still possible as a degraded mirror; future migration to Workers is straightforward (Hono runs there too).
- **Negative:** Node deps must work on the target VPS; no auto-scaling without infra work (single Node process); WebSocket scale limited to one box without sticky sessions — fine for 4 admins, would need work for 400.
- **Mitigation:** keep abstractions clean enough to swap to Workers + Durable Objects later if scale demands.

## References

- `Docs/ADMIN_PORTAL_ARCHITECTURE.md`
- ADMIN_PORTAL_TODO.md AP-005
