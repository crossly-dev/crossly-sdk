import type { HttpClient, JsonObject } from './_shared.js';

export interface WholesaleLine {
  /** Either identifier works. The storefront has the slug; tooling has the id. */
  platformListingId?: string;
  slug?: string;
  quantity: number;
}

// ─── Wholesale pricing ──────────────────────────────────────────────────────
//
// What a given buyer pays at a given quantity, once volume breaks and any
// negotiated account rate have been applied.
//
// `appliedSteps` is the point of the response: a trade buyer's first question
// about a quoted number is why it is that number, and a price nobody can
// explain is a price nobody trusts. Show the steps rather than a "you saved
// 22%" claim nobody can check.

export class WholesaleResource {
  constructor(private http: HttpClient) {}

  /** Price one line. Works signed-out — anonymous callers get list + tiers. */
  quote(line: WholesaleLine) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/shop/wholesale/quote',
      body: line,
    });
  }

  /**
   * Price a whole order sheet in one call.
   *
   * `subtotalCents` is summed from the same per-line numbers returned above
   * it, never re-derived — a total that disagrees with its own lines destroys
   * confidence in both. `blockedByMinimum` names lines under the seller's
   * minimum order so a checkout can stop rather than silently charge.
   */
  quoteBatch(lines: WholesaleLine[]) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/shop/wholesale/quote-batch',
      body: { lines },
    });
  }
}
