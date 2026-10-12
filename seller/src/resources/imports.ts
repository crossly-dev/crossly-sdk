import type { HttpClient, JsonObject, Platform, IdempotencyOpts } from './_shared.js';

// ─── Imports (moved out of catalog.ts for the 650-line cap) ─────────────────

/** GET /v1/imports/sites — which eBay sites an account's listings are on. Named (not inline) so the
 *  v1-parity scanner, which reads `request<…>(` up to the first `>`, can see the call. */
export interface ImportSites {
  data: { platform: string; home: string | null; sites: Array<{ marketplaceId: string; name: string; domain: string; count: number }>; source: string };
}

export class ImportsResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/imports' });
  }
  get(id: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/imports/${encodeURIComponent(id)}`,
    });
  }
  /**
   * Which sites the account's listings are on (eBay lists one item per site:
   * ebay.co.uk, ebay.com, …), with counts. More than one → pass the ones to
   * import as `start({ marketplaces })`.
   */
  sites(params: { platform?: Platform } = {}) {
    return this.http.request<ImportSites>({
      method: 'GET', path: '/v1/imports/sites', query: params,
    });
  }
  /** mode: 'inventory' (default) creates inventory items too; 'listings_only' leaves inventoryItemId null.
   *  marketplaces: eBay sites to import (EBAY_GB, …); omit for every site. */
  start(body: { platform: Platform; mode?: 'inventory' | 'listings_only'; marketplaces?: string[]; listOnCrossly?: boolean }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/imports',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Returns ────────────────────────────────────────────────────────────────

