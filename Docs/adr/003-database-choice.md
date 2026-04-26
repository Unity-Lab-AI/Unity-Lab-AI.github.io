# ADR-003: Database choice

**Status:** Accepted (2026-04-25)
**Context:** AP-006, AP-051 through AP-066

## Decision

**SQLite (better-sqlite3) for local dev, Postgres for production**, with **Drizzle ORM** as the schema/query abstraction. Same TypeScript schema definitions compile to either dialect. Migrations are plain SQL files in `server/migrations/`, dialect-portable where possible.

In dev: `DATABASE_URL=sqlite://./server/data/dev.db` — auto-created on first boot.
In prod: `DATABASE_URL=postgres://user:pass@host:5432/admin_portal` — managed Postgres (Neon/Supabase/RDS) or self-hosted on the same VPS.

## Alternatives considered

| Option | Rejected because |
|---|---|
| **Postgres for both dev and prod** | Adds dependency (admin must install Postgres locally); slows onboarding |
| **SQLite for both dev and prod** | Single-writer bottleneck; hard to do read replicas; no native connection pooling for multiple Node workers; worse advisory-lock semantics for the leader-election in repo-write coordination |
| **Cloudflare D1** | Locks us out of VPS path; D1 has different SQL feature set (limited transactions, no proper advisory locks) |
| **Mongo / DynamoDB / NoSQL** | Wrong shape for our data (heavy relational — users/rooms/messages/files/jobs all have FKs); we'd reinvent a relational engine on top |
| **Raw SQL without ORM** | Acceptable but error-prone for a schema this size (10 tables); ORM gives type safety + migration tooling |
| **Prisma** | Drizzle is lighter, no separate codegen step, schema-as-TS is more debuggable |

## Migration story

- All schema changes go through SQL migrations in `server/migrations/NNNN_description.sql`.
- Boot-time runner applies pending migrations in order, idempotent.
- Cross-dialect compatibility maintained by sticking to common SQL (no SQLite-specific functions like `json_each` outside dev-only utilities; no Postgres-specific features like `LATERAL` in normal queries).
- Dialect-specific files when needed: `0042_postgres_only_partition.sql` (would only run on Postgres, skipped on SQLite).

## Consequences

- **Positive:** dev = zero-config (SQLite file auto-created); prod = scalable Postgres; same query code via Drizzle; cheap (Neon free tier covers 4-admin load 100x over).
- **Negative:** must validate every query works on both dialects (CI runs migrations + smoke tests on both); some advanced features (pg_trgm full-text search, `LISTEN/NOTIFY` for real-time) need Postgres-only fallback path.
- **Backup story:** dev = copy the file. Prod = managed Postgres backup features + nightly dump to R2.

## References

- `Docs/DATA_CLASSIFICATION.md` — what each table holds
- `Docs/RETENTION_POLICY.md` — DB cleanup jobs
- ADMIN_PORTAL_TODO.md AP-051 through AP-066
