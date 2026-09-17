/**
 * Structured error envelope from the Crossly API.
 *
 * Server responses on 4xx/5xx look like:
 *   { "error": { "code": "rate_limited", "message": "...", "details": {...} } }
 *
 * We wrap that into a `CrosslyAPIError` so callers can branch on `code`
 * (stable across versions) and surface `message` to end-users.
 */
export interface CrosslyErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export class CrosslyAPIError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  /** Raw response body — useful for debugging unfamiliar errors. */
  readonly body?: unknown;

  constructor(
    status: number,
    payload: CrosslyErrorPayload,
    body?: unknown,
  ) {
    super(payload.message);
    this.name = 'CrosslyAPIError';
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
    this.body = body;
  }
}

/** Thrown when the SDK is misconfigured (e.g. missing/malformed PAT). */
export class CrosslyConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CrosslyConfigError';
  }
}
