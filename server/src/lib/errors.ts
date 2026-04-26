/**
 * Typed error classes.
 * Each maps to an HTTP status. Never leak stack traces in responses.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class AuthError extends AppError {
  constructor(message = 'unauthenticated', details?: unknown) {
    super(message, 'AUTH_REQUIRED', 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'forbidden', details?: unknown) {
    super(message, 'FORBIDDEN', 403, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'invalid input', details?: unknown) {
    super(message, 'VALIDATION', 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'not found', details?: unknown) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'conflict', details?: unknown) {
    super(message, 'CONFLICT', 409, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'rate limit exceeded', details?: unknown) {
    super(message, 'RATE_LIMITED', 429, details);
  }
}

export class InternalError extends AppError {
  constructor(message = 'internal error', details?: unknown) {
    super(message, 'INTERNAL', 500, details);
  }
}
