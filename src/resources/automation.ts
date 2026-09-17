import type { HttpClient, JsonObject, IdempotencyOpts } from './_shared.js';

export class AutomationResource {
  constructor(private http: HttpClient) {}

  listRules() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/automation/rules' });
  }
  createRule(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/automation/rules',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  deleteRule(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/automation/rules/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Returns the live trigger/action/condition catalog. */
  getCatalog() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/automation/catalog' });
  }

  // Recipe import/export — the file format used by the
  // github.com/alphajew420/crossly-automations community library.
  exportRule(id: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/automation/rules/${encodeURIComponent(id)}/export`,
    });
  }
  exportRules() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/automation/rules/export' });
  }
  /** Back-compat alias for exportRules. */
  exportAll() {
    return this.exportRules();
  }
  importRecipes(payload: JsonObject, opts: { activate?: boolean; idempotencyKey?: string } = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/automation/rules/import',
      query: opts.activate ? { activate: true } : undefined,
      body: payload,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  validateRecipe(payload: JsonObject) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/automation/rules/validate-recipe',
      body: payload,
    });
  }

  /** Get a single automation rule by id. */
  getRule(id: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/automation/rules/${encodeURIComponent(id)}`,
    });
  }
  /** Full-replace update of an automation rule. */
  updateRule(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PUT',
      path: `/v1/automation/rules/${encodeURIComponent(id)}`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Flip an automation rule between active and inactive. */
  toggleRule(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/automation/rules/${encodeURIComponent(id)}/toggle`,
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Enqueue an immediate one-off run of a rule. */
  runRuleNow(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/automation/rules/${encodeURIComponent(id)}/run-now`,
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }

  /** Recent rule + chain fire history. Filter by `ruleId` or `chainId`. */
  listRuns(params: { ruleId?: string; chainId?: string; limit?: number } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/automation/runs',
      query: params,
    });
  }
}

// ─── Workflows (multi-step chains) ──────────────────────────────────────────

export class WorkflowsResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/workflow-chains' });
  }
  get(id: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/workflow-chains/${encodeURIComponent(id)}`,
    });
  }
  /** Body: `{ name, triggerId, triggerConfig, steps: [{stepType, actionId?, actionConfig?, waitMs?}], isActive }`. */
  create(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/workflow-chains',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Replaces the chain wholesale — same body shape as create. */
  replace(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PUT',
      path: `/v1/workflow-chains/${encodeURIComponent(id)}`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  delete(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/workflow-chains/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Flip a workflow chain between active and inactive. */
  toggle(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/workflow-chains/${encodeURIComponent(id)}/toggle`,
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Enqueue an ad-hoc run of a workflow chain. */
  runNow(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/workflow-chains/${encodeURIComponent(id)}/run-now`,
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Notification integrations (Slack / Discord / Webhook) ──────────────────

export class SourcingResource {
  constructor(private http: HttpClient) {}

  /** List parsed sourcing receipts in this user's ledger. */
  listReceipts() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/sourcing/receipts' });
  }
  /**
   * What buyers looked for on other sites that Crossly did not have.
   *
   * The one market signal a crossposting tool cannot get from its own sellers:
   * every other number here — what sold, what is listed, what a comp fetched —
   * is a record of things somebody already decided to buy. This is demand that
   * went unmet, keyed to a checksummed identifier rather than a fuzzy title.
   *
   * Ranked by MISSES, not by looks. An item we stock and sell well would top a
   * looks-ranked list forever and is the least actionable row on it.
   * `medianPageCents` is what the retailers were charging — the number to
   * source against.
   *
   * Aggregate and anonymous. There is no per-buyer view of this and there will
   * not be one.
   */
  demand(params: { days?: number; minLooks?: number; limit?: number } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/sourcing/demand',
      query: params,
    });
  }

  /**
   * The same demand, narrowed to what YOU can act on today.
   *
   *   'in_stock'    — you are holding one and people are hunting for it
   *   'sold_before' — you have sold one, so you know the source and the margin
   *
   * Joined on a barcode both sides carry, never on a title: telling somebody
   * seven people want their item on the strength of a fuzzy match is a
   * sourcing decision made on a coincidence.
   */
  myDemand(params: { days?: number; minLookers?: number; limit?: number } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/sourcing/demand/mine',
      query: params,
    });
  }

  /** Append a parsed receipt to the sourcing ledger (capped at 200 entries). */
  logReceipt(
    body: {
      vendor: string | null;
      dateIso: string | null;
      items: Array<{ description: string; priceCents: number }>;
      sourceImageUrl: string | null;
    },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/sourcing/receipts',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

export class AIResource {
  constructor(private http: HttpClient) {}
  enhanceListing(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/ai/enhance-listing',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  extractReceipt(body: { imageUrl?: string; imageBase64?: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/ai/extract-receipt',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  categorizeFromImage(body: { imageUrl?: string; imageBase64?: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/ai/categorize-from-image',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  // ─── BYO-key plumbing ──────────────────────────────────────────────────
  /** Current BYO-key state: which providers have keys, which is active, capability flags. */
  status() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/ai/status' });
  }
  /** Static catalog of supported AI providers. No auth needed. */
  providers() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/ai/providers' });
  }
  /** Save an encrypted BYO-key for an AI provider (also activates it). */
  setKey(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PUT',
      path: '/v1/ai/key',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Remove the saved BYO-key for one provider. */
  deleteKey(opts: IdempotencyOpts & { provider?: string } = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: '/v1/ai/key',
      query: opts.provider ? { provider: opts.provider } : undefined,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Live-ping a candidate BYO-key to check validity before saving. */
  testKey(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/ai/test-key',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  // ─── Content generation ───────────────────────────────────────────────
  enhanceTitle(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/ai/enhance-title',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  enhanceDescription(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/ai/enhance-description',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  generateListing(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/ai/generate-listing',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  magicListing(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/ai/magic-listing',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  help(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/ai/help',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  categorize(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/ai/categorize',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Tax + mileage ──────────────────────────────────────────────────────────

