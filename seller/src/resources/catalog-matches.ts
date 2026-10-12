import type { HttpClient, JsonObject, IdempotencyOpts } from './_shared.js';

/**
 * One "is this the same product?" question: an inventory item that looks like
 * a Crossly catalog product. A suggestion binds nothing — `confirm` does, and
 * the confirmed link (the item's `market_sku_id`) is what sold comps and market
 * pricing use. An identifier (UPC, style code, catalogue number) that resolves
 * to exactly one product links the item without asking.
 */
export interface CatalogMatchSuggestion {
  id: string;
  inventoryItemId: string;
  status: 'pending' | 'confirmed' | 'dismissed' | 'superseded';
  /** 'identifier' = an identifier matched several products; 'similarity' = photo + title. */
  source: 'identifier' | 'similarity';
  score: number;
  /** Photo match 0–1, null when either photo was never embedded. */
  imageCosine: number | null;
  titleScore: number | null;
  reasons: string[];
  rank: number;
  createdAt: string;
  item: { title: string; imageUrl: string | null; brand: string | null; size: string | null };
  product: {
    id: string;
    name: string;
    brand: string | null;
    imageUrl: string | null;
    categorySlug: string | null;
    styleCode: string | null;
  };
}

export class CatalogMatchesResource {
  constructor(private http: HttpClient) {}

  /** Pending suggestions across your inventory, newest first. Envelope: `{ data, meta: { pending } }`. */
  list(params: { limit?: number; before?: string } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/catalog-matches',
      query: params,
    });
  }

  /** One item's confirmed catalog link (if any) and its pending suggestions. */
  forItem(inventoryItemId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/inventory/${encodeURIComponent(inventoryItemId)}/catalog-matches`,
    });
  }

  /** Run catalog matching for one item now. */
  refresh(inventoryItemId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/inventory/${encodeURIComponent(inventoryItemId)}/catalog-matches/refresh`,
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }

  /** "Yes, same product": links the item to the catalog product. */
  confirm(suggestionId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/catalog-matches/${encodeURIComponent(suggestionId)}/confirm`,
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }

  /** "No": that product is never suggested for this item again. */
  dismiss(suggestionId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/catalog-matches/${encodeURIComponent(suggestionId)}/dismiss`,
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }
}
