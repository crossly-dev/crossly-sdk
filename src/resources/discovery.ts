import type { HttpClient, JsonObject, IdempotencyOpts } from './_shared.js';

export class TaxonomyResource {
  constructor(private http: HttpClient) {}

  /** Top-level categories for a platform (eBay/Etsy live, cookie platforms static). */
  categories(platform: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/taxonomy/${encodeURIComponent(platform)}/categories`,
    });
  }
  /** Children of a node — one level down. */
  children(platform: string, categoryId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/taxonomy/${encodeURIComponent(platform)}/categories/${encodeURIComponent(categoryId)}/children`,
    });
  }
  /** Item-specific aspects (eBay) / properties (Etsy) / hard-coded enums for a category. */
  aspects(platform: string, categoryId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/taxonomy/${encodeURIComponent(platform)}/categories/${encodeURIComponent(categoryId)}/aspects`,
    });
  }
  /** Reverse lookup — suggest categories from a keyword. eBay-only today. */
  suggest(platform: string, q: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/taxonomy/${encodeURIComponent(platform)}/suggest`,
      query: { q },
    });
  }
  /** Normalized "what fields do I need to fill?" — inlines the aspect list when categoryId is provided. */
  requiredFields(platform: string, params: { categoryId?: string } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/taxonomy/${encodeURIComponent(platform)}/required-fields`,
      query: params,
    });
  }
  /** Convenience: walk top → suggested leaf → aspects in one round trip. Useful
   *  for agents that need a complete schema before POSTing a listing. */
  async preflight(platform: string, opts: { categoryId?: string; searchQuery?: string }) {
    let categoryId = opts.categoryId;
    if (!categoryId && opts.searchQuery && platform === 'ebay') {
      const sug = (await this.suggest(platform, opts.searchQuery)) as { suggestions?: Array<{ id: string }> };
      categoryId = sug.suggestions?.[0]?.id;
    }
    return this.requiredFields(platform, { categoryId });
  }
}

// ─── Webhooks ───────────────────────────────────────────────────────────────

export class ReferenceResource {
  constructor(private http: HttpClient) {}
  categories() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/categories' });
  }
  brands(params: { search?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/brands', query: params });
  }
  /** Search the eBay-sourced "Style" item-specifics. */
  styles(params: { search?: string; limit?: number; platform?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/styles', query: params });
  }
  /** Search the eBay-sourced "Pattern" item-specifics. */
  patterns(params: { search?: string; limit?: number; platform?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/patterns', query: params });
  }
  /** Search the eBay-sourced "Department" item-specifics. */
  departments(params: { search?: string; limit?: number; platform?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/departments', query: params });
  }
  /** Search the eBay-sourced "Gender" item-specifics. */
  genders(params: { search?: string; limit?: number; platform?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/genders', query: params });
  }
  /** Search the eBay-sourced "Type" item-specifics. */
  types(params: { search?: string; limit?: number; platform?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/types', query: params });
  }
  /** Search the Poshmark + Vestiaire size-system union. */
  sizeSystems(params: { search?: string; limit?: number; platform?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/size-systems', query: params });
  }
}

// ─── AI ─────────────────────────────────────────────────────────────────────

export class TaxResource {
  constructor(private http: HttpClient) {}
  mileage(params: { year?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/mileage', query: params });
  }
  mileageSummary(params: { year?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/mileage/summary', query: params });
  }

  /**
   * Log a business mileage trip.
   *
   * `date` is ISO YYYY-MM-DD and `miles` is the trip distance — the deduction
   * is computed from the year's IRS rate at read time, so nothing here needs a
   * dollar amount.
   */
  createMileage(
    body: {
      date: string;
      miles: number;
      purpose: string;
      startLocation?: string | null;
      endLocation?: string | null;
      notes?: string | null;
    },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/mileage',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  /** Amend a logged trip. Every field is optional; omitted ones are untouched. */
  updateMileage(
    id: string,
    body: Partial<{
      date: string;
      miles: number;
      purpose: string;
      startLocation: string | null;
      endLocation: string | null;
      notes: string | null;
    }>,
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'PATCH',
      path: `/v1/mileage/${encodeURIComponent(id)}`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  /** Delete a logged trip. Irreversible — it is a tax record, not a draft. */
  deleteMileage(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/mileage/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  scheduleC(params: { year: number }) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/tax/schedule-c', query: params });
  }
}

// ─── Profile ────────────────────────────────────────────────────────────────

export class SavedViewsResource {
  constructor(private http: HttpClient) {}

  list(params: { resource?: string } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/saved-views',
      query: params,
    });
  }
  create(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/saved-views',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  update(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PATCH',
      path: `/v1/saved-views/${encodeURIComponent(id)}`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  delete(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/saved-views/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Mobile (Expo push tokens) ──────────────────────────────────────────────

export class CompWatchlistsResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/comp-watchlists' });
  }
  create(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/comp-watchlists',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  delete(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/comp-watchlists/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  recent(id: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/comp-watchlists/${encodeURIComponent(id)}/recent`,
    });
  }
  scrape(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/comp-watchlists/${encodeURIComponent(id)}/scrape`,
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Restock prompts (post-sale OOS → republish banners) ────────────────────

export class MagicResource {
  constructor(private http: HttpClient) {}

  /**
   * Run a Magic List image scan. Accepts either a single `imageUrl`
   * (legacy) or `imageUrls[]` (1-4 photos). The primary photo drives
   * the eBay image search + cross-platform text-fanout; additional
   * photos (a tag/label closeup, a material swatch) feed vision-LLM
   * aspect extraction to fill Size / Brand / Material fields that the
   * eBay match data often can't.
   *
   * `hint` is optional seller-supplied context ("1968 patch"). It is part of
   * the scan cache key and reorders the eBay hits, so it genuinely changes
   * the result rather than just decorating the query — re-scanning the same
   * photo with a different hint is a different scan.
   */
  scan(
    body:
      | { imageUrls: string[]; hint?: string }
      | { imageUrl: string; hint?: string },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/magic/scan',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Synthesize a draft from confirmed matches on a prior scan run.
   *  `body.note` is a post-scan correction from the seller ("it's the 1968,
   *  not the 1964") — treated as authoritative over both the matched
   *  listings and the scan's own `hint`. */
  synthesize(runId: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/magic/scan/${encodeURIComponent(runId)}/synthesize`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Recent Magic List scans for this seller. */
  recent() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/magic/recent' });
  }
  /** Get a synthesized Magic List draft by id. */
  getDraft(draftId: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/magic/drafts/${encodeURIComponent(draftId)}`,
    });
  }
}

// ─── Comp watchlists (sold-comp scrapers) ───────────────────────────────────

export class RestockPromptsResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/restock-prompts' });
  }
  dismiss(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/restock-prompts/${encodeURIComponent(id)}/dismiss`,
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }
  republish(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/restock-prompts/${encodeURIComponent(id)}/republish`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Saved views (filter+sort+viewMode presets per resource) ────────────────

export class MobileResource {
  constructor(private http: HttpClient) {}

  /** List registered Expo push tokens for this user (token strings are masked). */
  listPushTokens() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/mobile/push-tokens' });
  }
  /** Register an Expo push token. Upsert by token — re-registering the same device is idempotent. */
  registerPushToken(
    body: { token: string; platform: 'ios' | 'android' | 'web' },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/mobile/push-token',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Fire a no-op test push to every registered device for this user. */
  pushTest(opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/mobile/push-test',
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Clear ALL registered push tokens for this user. */
  clearPushTokens(opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: '/v1/mobile/push-tokens',
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Team (owner-side: invitations + active members) ───────────────────────

export class PatResource {
  constructor(private http: HttpClient) {}

  /** List the canonical scope catalog. */
  scopes() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/pat/scopes' });
  }
  /** List the caller's PATs (preview only — never the full token). */
  list() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/pat' });
  }
  /** Mint a new PAT. The full token is returned ONCE — persist on the client. */
  create(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/pat',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Revoke a PAT by id. */
  delete(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/pat/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Magic List (image-search bootstrap + draft synthesis) ──────────────────

