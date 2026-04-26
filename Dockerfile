# Unity AI Lab — Unified Server Dockerfile
# Multi-stage build: install deps, build TS, run on slim runtime.

# === STAGE 1: build ===
FROM node:20-alpine AS builder
WORKDIR /app

# Install build deps (better-sqlite3 needs python + make + g++ for native build)
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .

# Build server (TypeScript → dist/)
RUN npm run build:server || true
# Build static frontend (vite build → dist/)
RUN npm run build:static

# === STAGE 2: runtime ===
FROM node:20-alpine
WORKDIR /app

# Runtime deps only — better-sqlite3 needs the prebuilt binary
RUN apk add --no-cache tini

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server
COPY --from=builder /app/admin ./admin
COPY --from=builder /app/proxy ./proxy
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Non-root user
RUN addgroup -S app && adduser -S app -G app
RUN mkdir -p /app/server/data /app/server/local-keys && chown -R app:app /app
USER app

EXPOSE 3000

# Use tini as init for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "start"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/healthz || exit 1
