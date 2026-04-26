/**
 * Global error handler. Maps AppError subclasses to structured responses.
 * Never leaks stack traces or internal paths in responses.
 */

import type { Hono } from 'hono';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function mountErrorHandler(app: Hono): void {
  app.onError((err, c) => {
    if (err instanceof AppError) {
      logger.warn({ code: err.code, status: err.status, msg: err.message }, 'app error');
      return c.json({ error: err.code, message: err.message, details: err.details ?? undefined }, err.status as any);
    }
    if (err instanceof Response) {
      // Thrown Response — pass through (used by requireSession etc.)
      return err;
    }
    logger.error({ err: err.message, stack: err.stack }, 'unhandled error');
    return c.json({ error: 'internal_error' }, 500);
  });
}
