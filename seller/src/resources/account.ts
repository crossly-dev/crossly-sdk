import type { HttpClient, JsonObject, IdempotencyOpts } from './_shared.js';

export class AnalyticsResource {
  constructor(private http: HttpClient) {}

  summary(params: { days?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/analytics/summary', query: params });
  }
  byPlatform(params: { days?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/analytics/by-platform', query: params });
  }
  timeseries(params: { days?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/analytics/timeseries', query: params });
  }

  // ─── Dashboard composite + extras ────────────────────────────────────
  /** Composite dashboard payload — KPIs, breakdowns, recent activity. */
  dashboard(params: { range?: '7d' | '30d' | '90d' | '1y' | 'custom'; startDate?: string; endDate?: string; labels?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/analytics/dashboard', query: params });
  }
  /** Today's checklist + 14-day activity streak. */
  today() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/analytics/today' });
  }
  /** Per-item P&L (paginated, sortable). */
  items(params: { page?: number; limit?: number; sortBy?: 'salePrice' | 'costOfGoods' | 'netProfit' | 'margin' | 'platform' | 'daysToSell' | 'detectedAt'; sortOrder?: 'asc' | 'desc' } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/analytics/items', query: params });
  }
  /** Monthly P&L + per-platform breakdown for a calendar year. */
  bookkeeping(params: { year?: number } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/analytics/bookkeeping', query: params });
  }
  /** Platform velocity + margin insight over the last 90 days. */
  insightsByPlatform() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/insights/by-platform' });
  }
}

// ─── Accounts / connections ─────────────────────────────────────────────────

export class AccountsResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/accounts' });
  }
  /** OAuth-connected API platforms (eBay/Etsy/Shopify/etc.). */
  listConnections() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/connections' });
  }
  create(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/accounts',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  delete(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/accounts/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Automation ─────────────────────────────────────────────────────────────

export class ConnectionsResource {
  constructor(private http: HttpClient) {}

  /** Revive or initiate connection for a cookie platform. */
  connect(platform: string, body: JsonObject = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/platform-accounts/${encodeURIComponent(platform)}/connect`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Archive every active account row for a platform. */
  disconnect(platform: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/platform-accounts/${encodeURIComponent(platform)}/disconnect`,
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /**
   * Set how far back to backfill order history + active listings for a
   * platform, and run it now. `days`: null = All time (no limit); 0 =
   * None; a positive integer = days back.
   */
  setHistoryImportWindow(platform: string, days: number | null, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/platform-accounts/${encodeURIComponent(platform)}/history-import`,
      body: { days },
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Run on-demand healthchecks across cookie accounts. */
  refreshStatus(opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/platform-accounts/refresh-status',
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /**
   * Get the OAuth authorize URL for an API-track platform.
   *
   * Most platforms return `{ url }`. Four exceptions deserve a discriminator
   * check on the response shape:
   *   - etsy        → `{ url, correlationId }` (PKCE verifier stashed in Redis)
   *   - bonanza     → `{ url, oneShot: true }` (single-use approval URL)
   *   - woocommerce → `{ url }` but `siteUrl` query param is required
   *   - walmart     → `{ status: 'request_only', requestUrl, message }`
   *                   (per-seller OAuth pending Solution Provider approval —
   *                    no `url` field; surface `requestUrl` to the seller)
   *
   * Shopify requires `shop` (mystore.myshopify.com). Amazon accepts `region`
   * (na/eu/fe). WooCommerce requires `siteUrl` (https://mystore.com).
   */
  oauthInitUrl(
    platform: string,
    params: { shop?: string; region?: string; siteUrl?: string } = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/oauth/${encodeURIComponent(platform)}/init`,
      query: params,
    });
  }
  /** Disconnect a specific OAuth connection by id. */
  deleteById(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/connections/by-id/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Express interest in a request_only platform. */
  request(platform: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/connections/${encodeURIComponent(platform)}/request`,
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Update per-platform connection preferences (e.g., eBay free-tier respect). */
  updatePreferences(
    platform: string,
    body: JsonObject,
    opts: IdempotencyOpts & { connectionId?: string } = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'PATCH',
      path: `/v1/platforms/${encodeURIComponent(platform)}/preferences`,
      query: opts.connectionId ? { connection_id: opts.connectionId } : undefined,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  // ─── IMAP / email connection management ────────────────────────────────
  /** List IMAP + email-OAuth connections. */
  imapList() {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/connections/email',
    });
  }
  imapCreate(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/connections/email/imap',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  imapUpdate(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PATCH',
      path: `/v1/connections/email/imap/${encodeURIComponent(id)}`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  imapDelete(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/connections/email/imap/${encodeURIComponent(id)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Validate IMAP credentials without persisting. */
  imapTest(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/connections/email/imap/test',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  // ─── Account-level presence + limit metadata ──────────────────────────
  /** Check whether the browser extension is currently online. */
  extensionOnline() {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/connections/extension-online',
    });
  }
  /** eBay free-tier + Etsy fees aggregate. */
  platformLimits(params: { connection_id?: string } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/platforms/limits',
      query: params,
    });
  }
}

// ─── Personal Access Tokens ─────────────────────────────────────────────────

export class ProfileResource {
  constructor(private http: HttpClient) {}
  /** Identity check — returns the authenticated user + PAT scopes. */
  me() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/me' });
  }
  updateMe(body: { displayName?: string }) {
    return this.http.request<JsonObject>({ method: 'PATCH', path: '/v1/me', body });
  }
}

// ─── Connections (cookie + OAuth + IMAP + per-platform prefs) ───────────────

export class AccountResource {
  constructor(private http: HttpClient) {}

  // ── Deletion lifecycle ─────────────────────────────────────────────────
  /** Get the currently-pending deletion request, if any. */
  deletionStatus() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/account/deletion-status' });
  }
  /** Schedule account deletion after the grace window. 409 if one is already pending. */
  requestDeletion(body: { reason?: string } = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/account/request-deletion',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Cancel the currently-pending account deletion. */
  cancelDeletion(opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/account/cancel-deletion',
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Revoke every browser auth session for this user. */
  logoutAll(opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/account/logout-all',
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }

  // ── Auth sessions ──────────────────────────────────────────────────────
  /** List active browser auth sessions. `isCurrent` is always false on PAT calls. */
  listSessions() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/auth/sessions' });
  }
  /** Revoke every active browser auth session (mirrors logoutAll). */
  revokeAllSessions(opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: '/v1/auth/sessions',
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Revoke a single browser auth session by id. */
  revokeSession(sessionId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/auth/sessions/${encodeURIComponent(sessionId)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  // ── Billing ────────────────────────────────────────────────────────────
  /**
   * Start an upgrade to a higher plan. Requires `billing:write`.
   *
   * Returns `data.checkoutUrl` — a Stripe Checkout link. NOTHING is charged by
   * this call and `data.charged` is always false; a person completes the
   * payment in Stripe's own UI. A token that could charge a card on its own is
   * the failure this shape exists to prevent.
   *
   * Upgrade only. Downgrades and cancellation are not available to a token at
   * all and stay with the account owner, and a team member's per-member
   * spending cap is enforced server-side.
   */
  upgradePlan(
    body: { tier: 'starter' | 'pro' | 'unlimited'; interval?: 'monthly' | 'yearly' },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/billing/upgrade',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Sourcing (parsed receipts ledger) ─────────────────────────────────────

export class TeamResource {
  constructor(private http: HttpClient) {}

  /** List pending invitations + active members on this user's team. */
  list() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/team' });
  }
  /** Mint a team invitation. Response carries a one-time `acceptUrl`. */
  invite(
    body: { inviteeEmail: string; role?: 'va' | 'admin'; scopes: string[] },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/team/invite',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Accept a pending team invitation by raw token. */
  accept(token: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/team/accept',
      body: { token },
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Revoke a pending invitation OR an active team member (exactly one of the two ids). */
  revoke(
    body: { invitationId?: string; memberId?: string },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/team/revoke',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Walk off every team this user is a member of. */
  leave(opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/team/leave',
      body: {},
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Update a team member's scopes (owner only). */
  updateMemberScopes(memberId: string, scopes: string[], opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PATCH',
      path: `/v1/team/${encodeURIComponent(memberId)}`,
      body: { scopes },
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Account (deletion lifecycle + auth sessions) ──────────────────────────


// ─── Connected apps (third-party OAuth apps with access to this account) ────

/**
 * The "who can reach my store" audit surface.
 *
 * Read is available to any credential with `accounts:read`. REVOKE is not
 * available to an OAuth app at all, whatever scopes it holds — otherwise an
 * app could disconnect its competitors and the seller would experience it as
 * the other integration mysteriously breaking. An app relinquishing its OWN
 * access uses POST /api/oauth/revoke with its client credentials instead.
 */
export class ConnectedAppsResource {
  constructor(private http: HttpClient) {}

  /** Envelope: `{ data }` — the canonical /v1 collection shape — grantId, app name, developer, scopes, lastUsedAt. */
  list() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/connected-apps' });
  }

  /** Disconnect by GRANT id (from `list()`), not app id. Immediate. */
  disconnect(grantId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'DELETE',
      path: `/v1/connected-apps/${encodeURIComponent(grantId)}`,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}
