/**
 * Shared types for SDK resources. Each resource class takes an
 * HttpClient and exposes one method per `/api/v1/*` endpoint. Returns
 * are typed as the loose `JsonObject` shape since the v1 server is the
 * source of truth for response schemas. Mutation methods accept
 * `opts.idempotencyKey` — pass one on retries.
 */
export type { HttpClient } from '../client.js';
export type { JsonObject, PaginationParams, Platform } from '../types.js';

export interface IdempotencyOpts {
  idempotencyKey?: string;
}
