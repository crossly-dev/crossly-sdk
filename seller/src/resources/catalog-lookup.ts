import type { HttpClient, JsonObject } from './_shared.js';

/**
 * Namespaces the lookup accepts.
 *
 * These are the `namespace` column of `crossly_market_refs`, so they are not
 * an SDK invention — a value not on this list resolves to nothing rather than
 * erroring, which is why the type exists at all.
 *
 * `lego_set` and not `set_code`: the server spends `set_code` on a TRADING
 * CARD set code, which identifies nothing without a collector number beside
 * it. Sending a LEGO number under that namespace asks for a card and gets
 * silence.
 */
export type CatalogNamespace =
  | 'gtin'
  | 'style_code'
  | 'lego_set'
  | 'tcgplayer'
  | 'discogs'
  | 'asin';

/**
 * Live Crossly offers for a product identifier.
 *
 * ── THE SAME ENGINE THE BUYER EXTENSION USES ─────────────────────────
 * Scout — Crossly's buyer-side extension — decides "is this cheaper on
 * Crossly" with the identical server-side lookup this calls. Not a similar
 * one: the same function. If you build a sourcing tool on this, you and the
 * extension are looking at one answer.
 *
 * ── IDENTIFIER-FIRST, WITH NO FALLBACK ───────────────────────────────
 * A GTIN is validated against its GS1 check digit and normalised to 14 digits,
 * so a UPC-A and its EAN-13 twin resolve to the same product. There is no
 * similarity search behind this: an identifier that does not validate returns
 * a 400, and one that validates but matches nothing returns an empty list.
 *
 * Neither is an error state to retry. A marketplace catalog is a fraction of
 * everything that exists, and "we do not have it" is the common answer.
 */
export class CatalogLookupResource {
  constructor(private http: HttpClient) {}

  /**
   * @param namespace which kind of identifier — see {@link CatalogNamespace}
   * @param value the identifier itself, in any spelling; it is normalised
   *              server-side
   *
   * Requires the `catalog:read` scope. That scope is read-only and exposes
   * nothing about the caller's own account — it reads the marketplace, not
   * your inventory.
   */
  lookup(namespace: CatalogNamespace, value: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/catalog/lookup',
      query: { namespace, value },
    });
  }

  /** Convenience for the common case. Any GTIN length is accepted. */
  byBarcode(gtin: string) {
    return this.lookup('gtin', gtin);
  }
}
