import type { HttpClient, IdempotencyOpts, JsonObject } from './_shared.js';
import type { ProFunding } from './vault-markets-pro.js';

// ─── Vault Markets analytics: indexes, watchlist, compare, history ──────────
//
// `client.vaultMarkets.analytics`. Indexes over book keys valued only from the
// order book's marks (base 1000 at inception), buying an index's basket as
// whole units, a watchlist, compare, portfolio value by day, the grading
// arbitrage signal and vault supply by day. Money is integer CENTS of US
// dollars; moves are basis points. An index is addressed by its slug.

export type VaultIndexKind = 'category' | 'brand' | 'curated' | 'custom' | 'composite' | 'segment';
export type VaultIndexWeighting = 'mark' | 'equal' | 'vault_cap' | 'turnover';

export interface CreateVaultIndexBody {
  name: string;
  description?: string | null;
  /** `mark` (default) weights each key by its mark; `equal` weights them alike. */
  weighting?: VaultIndexWeighting;
  isPublic?: boolean;
  /** 1 to 50 book keys. */
  keys: string[];
}

export type UpdateVaultIndexBody = Partial<CreateVaultIndexBody>;

export interface BuyVaultBasketBody {
  /** Whole units of each key, 1-5 (default 1). */
  unitsPerKey?: number;
  /** At most this many basis points over each key's mark (0-2000, default 200). */
  maxBpsOverMark?: number;
  /** `ioc` (default) fills what it can now; `gtc` rests. */
  tif?: 'ioc' | 'gtc';
  funding?: ProFunding;
  stripePaymentMethodId?: string;
  /** Your own id; buying again with it returns the first result. */
  clientBasketId?: string;
}

const slug = (s: string) => encodeURIComponent(s);

export class VaultMarketsAnalyticsResource {
  constructor(private http: HttpClient) {}

  /** Indexes (per category, per brand, the Crossly 50, yours) with level and change. */
  indexes(kind?: VaultIndexKind) {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/indexes', query: kind ? { kind } : undefined });
  }

  /** The built-in indexes that moved most since their last daily close. */
  indexMovers(limit?: number) {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/indexes/movers', query: limit ? { limit } : undefined });
  }

  /** One index with its daily closes (default 365 days) and its level now. */
  index(indexSlug: string, days?: number) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/indexes/${slug(indexSlug)}`, query: days ? { days } : undefined });
  }

  /** The keys in an index with weight, move and contribution (bps). */
  constituents(indexSlug: string) {
    return this.http.request<{ data: JsonObject[]; meta: { index: JsonObject } }>({ method: 'GET', path: `/v1/vault-markets/indexes/${slug(indexSlug)}/constituents` });
  }

  /** Make an index of your own (up to 10 per account). */
  createIndex(body: CreateVaultIndexBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/indexes', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Rename, re-weight, share or change the keys of an index of your own. */
  updateIndex(indexSlug: string, body: UpdateVaultIndexBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'PATCH', path: `/v1/vault-markets/indexes/${slug(indexSlug)}`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Delete an index of your own. */
  deleteIndex(indexSlug: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ ok: boolean }>({ method: 'DELETE', path: `/v1/vault-markets/indexes/${slug(indexSlug)}`, idempotencyKey: opts.idempotencyKey });
  }

  /** Buy the basket: one limit buy per key for whole units, landing in your vault. Idempotent on `clientBasketId`. */
  buyBasket(indexSlug: string, body: BuyVaultBasketBody = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/indexes/${slug(indexSlug)}/buy`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your watched book keys with mark, changes and a 30-day sparkline. */
  watchlist() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/watchlist' });
  }

  /** Watch a book key. */
  watch(bookKey: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ bookKey: string; watching: boolean }>({ method: 'POST', path: '/v1/vault-markets/watchlist', body: { bookKey }, idempotencyKey: opts.idempotencyKey });
  }

  /** Stop watching a book key. */
  unwatch(bookKey: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ bookKey: string; watching: boolean }>({ method: 'DELETE', path: '/v1/vault-markets/watchlist', query: { bookKey }, idempotencyKey: opts.idempotencyKey });
  }

  /** Up to 5 book keys and/or index slugs as daily series, each rebased to 100 (default 90 days). */
  compare(items: string[], days?: number) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/compare', query: { items: items.join(','), days } });
  }

  /** Your Vault Markets value by day at the marks and today's return (default 90 days). */
  portfolioHistory(days?: number) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/portfolio/history', query: days ? { days } : undefined });
  }

  /** For a raw book key: graded keys' marks, grading cost and whether grading your raw units pays. */
  gradingSignal(bookKey: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/grading-signal', query: { bookKey } });
  }

  /** A book key's units in the vault and authentications passed, by day (default 180 days). */
  supply(bookKey: string, days?: number) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/supply', query: { bookKey, days } });
  }
}
