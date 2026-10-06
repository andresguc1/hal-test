export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public extra: Record<string, unknown> = {},
  ) {
    super(message)
  }
}

export const Errors = {
  unauthenticated: () => new ApiError(401, 'UNAUTHENTICATED', 'Sign in to continue.'),
  forbidden: (msg = 'You do not have access to this resource.') => new ApiError(403, 'FORBIDDEN', msg),
  // Used instead of 403 for resources the caller may not know exist (anti-enumeration).
  notFound: (what = 'Resource') => new ApiError(404, 'NOT_FOUND', `${what} not found.`),
  invalid: (msg: string, fields?: Record<string, string[]>) =>
    new ApiError(422, 'VALIDATION_FAILED', msg, fields ? { fields } : {}),
  conflict: (code: string, msg: string) => new ApiError(409, code, msg),
  rateLimited: (retryAfterSec: number) =>
    new ApiError(429, 'RATE_LIMITED', 'Too many requests. Please slow down.', { retry_after_s: retryAfterSec }),
}

/** Flat, safe error body. `code` is top-level because the TollAI client reads it. */
export function errorBody(err: ApiError, requestId: string) {
  return { code: err.code, message: err.message, request_id: requestId, ...err.extra }
}
