/**
 * Shared types across resources.
 *
 * Resource-specific payloads (InventoryItem, Listing, etc.) live in their
 * own resource files — we don't model every field here. The SDK's contract
 * is: methods accept and return JSON-shaped objects matching the v1 API.
 * For exact server-side types, see the OpenAPI schema served by the api.
 */

/** Common pagination input. */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Most list endpoints return this shape. */
export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Marketplace platform IDs supported by Crossly. */
export type Platform =
  | 'poshmark'
  | 'mercari'
  | 'depop'
  | 'grailed'
  | 'vinted'
  | 'whatnot'
  | 'vestiaire'
  | 'offerup'
  | 'facebook'
  | 'ebay'
  | 'etsy'
  | 'shopify'
  | 'amazon'
  | 'walmart';

/**
 * Loose JSON object — used for endpoint responses whose exact shape isn't
 * worth modelling (raw analytics, platform-specific data blobs, etc.).
 * Callers can narrow at the call site.
 */
export type JsonObject = Record<string, unknown>;
