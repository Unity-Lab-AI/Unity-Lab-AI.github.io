/**
 * Simple in-memory rate limiter (per IP + path bucket).
 * For dev / single-process. Production behind Cloudflare adds edge rate-limiting on top.
 * Multi-process scale would need Redis-backed counters — Phase 2.
 */

import type { Context, MiddlewareHandler } from 'hono';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function getClientIp(c: Context): string {
  return (
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown'
  );
}

export function rateLimit(opts: { key: string; limit: number; windowMs: number }): MiddlewareHandler {
  return async (c, next) => {
    const ip = getClientIp(c);
    const k = `${opts.key}:${ip}`;
    const now = Date.now();
    let b = buckets.get(k);
    if (!b || now > b.resetAt) {
      b = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(k, b);
    }
    b.count += 1;
    if (b.count > opts.limit) {
      return c.json({ error: 'rate_limited', retry_after_ms: b.resetAt - now }, 429);
    }
    c.header('X-RateLimit-Limit', String(opts.limit));
    c.header('X-RateLimit-Remaining', String(Math.max(0, opts.limit - b.count)));
    c.header('X-RateLimit-Reset', String(Math.floor(b.resetAt / 1000)));
    return next();
  };
}

// Periodic cleanup of expired buckets
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets.entries()) {
    if (now > b.resetAt) buckets.delete(k);
  }
}, 60_000).unref();
