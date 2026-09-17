import type { HttpClient, JsonObject, PaginationParams, Platform, IdempotencyOpts } from './_shared.js';


// ─── Inventory ──────────────────────────────────────────────────────────────

export class InventoryResource {
  constructor(private http: HttpClient) {}

  list(params: PaginationParams & { search?: string; status?: 'active' | 'sold' | 'archived' } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/inventory', query: params });
  }
  get(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/inventory/${encodeURIComponent(id)}` });
  }
  getActivity(id: string, params: { limit?: number } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/inventory/${encodeURIComponent(id)}/activity`,
      query: params,
    });
  }
  create(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/inventory', body, idempotencyKey: opts.idempotencyKey });
  }
  update(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PATCH',
      path: `/v1/inventory/${encodeURIComponent(id)}`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  archive(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/inventory/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  // ─── Spreadsheet round-trip ────────────────────────────────────────────

  /**
   * Import a CSV.
   *
   * Rows whose `sku` matches an item already on file UPDATE that item; rows
   * without a usable SKU are added. That is what makes export → edit → import
   * an update rather than a second copy of everything — strip the sku column
   * and you will insert duplicates.
   *
   * Pass `dryRun: true` first. The response reports how many rows would be
   * added, updated and skipped without writing anything, which is the
   * difference between catching a bad mapping and finding it in the seller's
   * catalogue afterwards.
   */
  importCsv(body: { csv: string; dryRun?: boolean }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/inventory/csv/import',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  /** Export inventory as CSV text. Round-trips back through `importCsv`. */
  exportCsv(body: { itemIds?: string[] } = {}) {
    return this.http.request<string>({
      method: 'POST',
      path: '/v1/inventory/csv/export',
      body,
    });
  }

  // ─── Bulk inventory operations ─────────────────────────────────────────
  bulkLabels(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/inventory/bulk-labels',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /**
   * Set / add / subtract stock across many items at once.
   *
   * Separate from `bulkLabels` and friends because stock is mirrored by the
   * marketplaces: the numbers change immediately, and the returned
   * `bulkJobId` tracks the push to every live listing. Anything dropping to 0
   * is delisted rather than left buyable.
   *
   * `skipped` counts ids that did not move — already at that number, or not
   * this seller's.
   */
  bulkQuantity(
    body: {
      ids: string[];
      mode: 'set' | 'increase' | 'decrease';
      value: number;
      /** False to change Crossly only, leaving live listings alone. */
      syncMarketplaces?: boolean;
    },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/inventory/bulk-quantity',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  bulkArchive(ids: string[], opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/inventory/bulk-archive',
      body: { ids },
      idempotencyKey: opts.idempotencyKey,
    });
  }
  bulkDelete(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/inventory/bulk-delete',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  labelsStats() {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/inventory/labels/stats',
    });
  }
  labelsRename(body: { from: string; to: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/inventory/labels/rename',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  // ─── Discovery helpers (facets / ids / sku / labels) ──────────────────
  /** Distinct brands + main categories across inventory. */
  facets() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/inventory/facets' });
  }
  /** Filter → matching id list. Canonical bulk-action driver. */
  ids(params: { status?: string; search?: string; category?: string; platform?: Platform; labels?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/inventory/ids', query: params });
  }
  /** Check whether a SKU is already used on this user's inventory. */
  skuExists(sku: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/inventory/sku-exists', query: { sku } });
  }
  /** All distinct labels across this user's inventory. */
  labels() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/inventory/labels' });
  }
}

// ─── Listings ───────────────────────────────────────────────────────────────


export class ListingsResource {
  constructor(private http: HttpClient) {}

  list(params: PaginationParams & { platform?: Platform; status?: string; search?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/listings', query: params });
  }
  get(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/listings/${encodeURIComponent(id)}` });
  }
  /**
   * Does the seller already own something matching this title/photo?
   *
   * Call before `create` when listing in bulk — an automated caller is the one
   * most likely to list the same item twice without noticing. Each match comes
   * back with a `suggested` action: `restock` (same item, bump its stock),
   * `variation` (another size, chain them) or `duplicate` (already listed).
   *
   * Never blocks anything and never throws on a matcher outage — an empty
   * `matches` array means "nothing found".
   */
  checkDuplicates(body: { title?: string | null; images?: string[]; size?: string | null }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/listings/check-duplicates',
      body,
    });
  }

  /**
   * Fold duplicate listings into one, summing their stock.
   *
   * For listings of the SAME item — not for sizes/colours, which are a
   * variation group. The keeper survives with everyone's stock; the rest are
   * delisted from their marketplaces and ARCHIVED, never deleted, so their
   * sales history stays intact.
   *
   * Refuses with 409 and a `code` when a prerequisite isn't met:
   * `reserved_stock` (ship or cancel the open order first), `chained`
   * (dissolve the bundle/variation group first), `no_inventory_item`,
   * `sold`, `keeper_in_sources`, `not_found`.
   */
  combine(
    body: { keepListingId: string; mergeListingIds: string[] },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/listings/combine',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  /**
   * Create (crosspost) a listing to one or more platforms.
   *
   * Body needs `platforms` and the listing fields under `data`.
   *
   * Pass EITHER `inventoryItemId` (an item you already have) or
   * `createInventoryItem: true`. Without one of the two the listing has no
   * inventory row behind it — nothing decrements on a sale, there is no cost
   * basis or aging, and it is invisible to every inventory report. Creating a
   * catalogue this way produces a shelf that reads as empty.
   */
  create(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/listings',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  update(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PATCH',
      path: `/v1/listings/${encodeURIComponent(id)}`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Delist from selected platforms (or all if `platforms` omitted in the body). */
  delist(id: string, body: { platforms?: Platform[] } = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/listings/${encodeURIComponent(id)}`,
      query: body.platforms ? { platforms: body.platforms } : undefined,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Attach a real platform listing to this listing by pasting its live URL — fetches
   *  the actual title/price/images/condition from the marketplace (not a URL-only stub). */
  importByUrl(
    id: string,
    body: { platform: string; url: string; accountSlot?: number },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/listings/${encodeURIComponent(id)}/import-by-url`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Auto-fill empty fields on one platform tab from the master listing +
   *  AI/deterministic taxonomy resolution. Never overwrites a value already set.
   *
   *  `body.note` is the seller's own words about the item ("it's the 1968
   *  reissue, not the 1964"). It is passed to the category AND facet pickers
   *  as authoritative — a hand-made listing never went through a scan, so
   *  this is the only place to correct them before taxonomy is resolved. */
  magicFill(id: string, body: { platform: string; note?: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/listings/${encodeURIComponent(id)}/magic-fill`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Detected marketplace-drift fields for a listing — where Crossly's stored
   *  value diverges from what the platform's own detail fetch currently reports. */
  listDiscrepancies(id: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/listings/${encodeURIComponent(id)}/discrepancies`,
    });
  }
  /** Resolve a detected discrepancy. `accept_remote`/`push_ours` apply to a
   *  'remote_drift' row (platform's live value wins, or re-push Crossly's
   *  value to the platform); `sync_from_master` applies to an
   *  'override_vs_master' row (clears the stale per-platform override so
   *  the effective value falls through to master, and re-pushes live if
   *  already published). `relist` applies to a 'remote_drift' or
   *  'sync_failed' row and is the escape hatch for a value the platform
   *  refuses to edit in place at all (e.g. Grailed will not raise a price
   *  after a price drop, for the life of the listing) — it delists and posts
   *  a fresh listing, which mints a NEW listing id and URL and loses the
   *  original's age, watchers and saves. `dismiss` applies to either — keeps
   *  it around but stops nagging unless it drifts further. */
  resolveDiscrepancy(
    id: string,
    discrepancyId: string,
    body: { action: 'accept_remote' | 'push_ours' | 'sync_from_master' | 'relist' | 'dismiss' },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/listings/${encodeURIComponent(id)}/discrepancies/${encodeURIComponent(discrepancyId)}/resolve`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  // ─── Bulk listing operations ──────────────────────────────────────────────
  bulkRelist(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/listings/bulk-relist',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  bulkCrosspost(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/listings/bulk-crosspost',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  bulkDelist(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/listings/bulk-delist',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  bulkDelete(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/listings/bulk-delete',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  bulkHardDelete(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/listings/bulk-hard-delete',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  bulkUpdate(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/listings/bulk-update',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  bulkCheckStatus(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/listings/bulk-check-status',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  bulkDelistPreview(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/listings/bulk-delist-preview',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  byIds(ids: string[], opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/listings/by-ids',
      body: { ids },
      idempotencyKey: opts.idempotencyKey,
    });
  }

  // ─── Discovery helpers (facets / ids / sku dedupe) ────────────────────
  /** Distinct brands + main categories across listings + inventory. */
  facets() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/listings/facets' });
  }
  /** Filter → matching id list (no pagination). Drives bulk actions. */
  ids(params: { status?: string; platform?: Platform; search?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/listings/ids', query: params });
  }
  /** Check whether a SKU is already used on one of this user's items. */
  skuExists(sku: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/listings/sku-exists', query: { sku } });
  }
}

// ─── Orders ─────────────────────────────────────────────────────────────────


/**
 * Templates — one unified store for full-listing templates AND
 * description snippets. `scope` distinguishes them.
 *
 * Fields:
 *   - Description-scope: description, descriptionVariants
 *   - Listing-scope: title/titleVariants + master-form typed fields
 *     (brand, condition, color, material, size, weightOz, dimensions,
 *     categoryPath, tags, platformOverrides) + defaultForCategory + isDefault
 *
 * `suggest({ category })` returns the seller's default template for
 * that category — one HTTP call for "hydrate the form with my default".
 * `share(id)` mints a public read-only URL. `importJson(items)` bulk-
 * imports from a JSON blob.
 */
export class TemplatesResource {
  constructor(private http: HttpClient) {}

  /** List. Optional scope filter and defaultForCategory filter. */
  list(query: { scope?: 'listing' | 'description'; category?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/me/templates', query });
  }
  get(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/me/templates/${encodeURIComponent(id)}` });
  }
  /** Seller's default template for a category (`null` when unset). */
  suggest(query: { category: string }) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/me/templates/suggest', query });
  }

  /**
   * Render a template's title + description against a listing's context.
   *
   * Read-only despite the POST — the context is a body, not a query string.
   *
   * `missingTokens` is the point: warn "this template wants a Year and this
   * item has none" BEFORE applying, rather than after a title reads oddly on
   * a live listing.
   *
   * Tokens are SINGLE braces (`{brand}`, not `{{brand}}`), and anything in
   * braces that isn't a known token is left alone — `{50% off}` is copy the
   * seller typed, not a token we failed to fill.
   *
   * `variantIndex`: 0 is the base title, 1..n index into the stashed A/B
   * variants. Past the end falls back to the base rather than rendering empty.
   */
  render(
    id: string,
    body: { context?: Record<string, unknown>; variantIndex?: number } = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/me/templates/${encodeURIComponent(id)}/render`,
      body,
    });
  }
  create(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/me/templates',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  patch(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PATCH',
      path: `/v1/me/templates/${encodeURIComponent(id)}`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  remove(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/me/templates/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  share(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ token: string }>({
      method: 'POST',
      path: `/v1/me/templates/${encodeURIComponent(id)}/share`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  revokeShare(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/me/templates/${encodeURIComponent(id)}/share`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  importJson(items: JsonObject | JsonObject[], opts: IdempotencyOpts = {}) {
    return this.http.request<{ imported: number; ids: string[] }>({
      method: 'POST',
      path: '/v1/me/templates/import',
      body: items,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Public share view (no auth). */
  fetchShared(token: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/public/templates/${encodeURIComponent(token)}`,
    });
  }
}

// ─── Imports ────────────────────────────────────────────────────────────────


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
  /** mode: 'inventory' (default) creates inventory items too; 'listings_only' leaves inventoryItemId null. */
  start(body: { platform: Platform; mode?: 'inventory' | 'listings_only' }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/imports',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Returns ────────────────────────────────────────────────────────────────

