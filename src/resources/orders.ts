import type { HttpClient, JsonObject, PaginationParams, Platform, IdempotencyOpts } from './_shared.js';


export class OrdersResource {
  constructor(private http: HttpClient) {}

  list(params: PaginationParams & { status?: string; platform?: Platform } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/orders', query: params });
  }
  get(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/orders/${encodeURIComponent(id)}` });
  }
  /**
   * The PARCELS this order shipped in.
   *
   * An order is not always one box: eBay allows a second label, Poshmark sells
   * up to ten additional ones. The order record carries only the primary
   * parcel, so this is the only place the rest are visible.
   *
   * Use `totalLabelCostCents` for cost of sale rather than the order's own
   * label cost — that field holds the PRIMARY parcel only, so a two-parcel
   * order understates by a whole label.
   */
  shipments(id: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/orders/${encodeURIComponent(id)}/shipments`,
    });
  }
  submitTracking(
    id: string,
    body: { trackingNumber: string; carrier?: string; trackingUrl?: string },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/orders/${encodeURIComponent(id)}/tracking`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /**
   * Whether this order can be cancelled and which reason codes the marketplace
   * will accept. Read-only — cancels nothing. Call this BEFORE `cancel` rather
   * than guessing a reason: eBay's eligible set varies per order (an unpaid
   * order offers ORDER_UNPAID, a paid one doesn't), and an unaccepted code is
   * rejected outright.
   */
  cancelEligibility(id: string) {
    return this.http.request<{
      eligible: boolean;
      eligibleCancelReason: string[];
      failureReason: string[];
      source: 'ebay' | 'capability-map' | 'unavailable';
    }>({
      method: 'GET',
      path: `/v1/orders/${encodeURIComponent(id)}/cancel-eligibility`,
    });
  }
  /**
   * Cancel the order on its marketplace.
   *
   * The Crossly-side status flip is unconditional; `platformCancel` reports
   * what actually reached the marketplace (`sent` | `queued` | `failed` |
   * `unsupported` | `no_platform_order_id` | `already_cancelled`). Check it —
   * a 200 does NOT mean the marketplace cancelled anything, and `error`
   * carries the platform's own message when it refused.
   */
  cancel(id: string, body: { reason?: string } = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<{
      orderId: string;
      platform: string;
      cancelledInCrossly: boolean;
      platformCancel: string;
      jobId?: string;
      error?: string;
    }>({
      method: 'POST',
      path: `/v1/orders/${encodeURIComponent(id)}/cancel`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /**
   * Message the order's buyer on the marketplace. eBay only — every other
   * platform can only reply inside a thread the buyer started (use
   * `comms` for those). The message is mirrored into the Crossly inbox on the
   * same thread the buyer's reply will arrive on.
   */
  messageBuyer(
    id: string,
    body: { body: string; subject?: string },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<{ orderId: string; sent: boolean; platformConversationId: string }>({
      method: 'POST',
      path: `/v1/orders/${encodeURIComponent(id)}/message`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  refund(id: string, body: { amount?: number; reason?: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/orders/${encodeURIComponent(id)}/refund`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  // ─── Bulk order operations ─────────────────────────────────────────────
  bulkDelete(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/orders/bulk-delete',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  bulkMarkShipped(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/orders/bulk-mark-shipped',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  bulkMarkDisputed(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/orders/bulk-mark-disputed',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  bulkExport(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/orders/bulk-export',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  // ─── Single-order verb endpoints ───────────────────────────────────────
  updateOrder(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PATCH',
      path: `/v1/orders/${encodeURIComponent(id)}`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  dispute(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/orders/${encodeURIComponent(id)}/dispute`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  rates(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/orders/${encodeURIComponent(id)}/rates`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  label(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/orders/${encodeURIComponent(id)}/label`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  pullPlatformLabel(id: string, body: JsonObject = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/orders/${encodeURIComponent(id)}/pull-platform-label`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  packingSlip(id: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/orders/${encodeURIComponent(id)}/packing-slip`,
    });
  }
  /**
   * Proof-of-delivery evidence for an "it never arrived" dispute.
   *
   * Built from the carrier's own scan record — the delivery scan with its
   * date and location, the full chain of scans, and a signature where the
   * service captured one. `format: 'json'` returns the structured view,
   * including `gaps`: the reasons this particular document is weak (no
   * signature, no scan history, not yet delivered). Read those before filing
   * — the marketplace will.
   *
   * `postalCodeMatches` is deliberately tri-state. `null` means one side was
   * missing; `false` is the claim that the carrier delivered somewhere else.
   */
  proofOfDelivery(id: string, opts: { format?: 'json' | 'pdf' } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/orders/${encodeURIComponent(id)}/proof-of-delivery`,
      query: opts.format ? { format: opts.format } : undefined,
    });
  }

  bulkPackingSlips(body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/orders/bulk-packing-slips',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  counts() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/orders/counts' });
  }
  /**
   * Manually (re-)pull one or more connected platforms' order history for
   * a day-window — the Orders page's "Import orders" button. Independent
   * of the one-time post-connect backfill: safe to call repeatedly,
   * since sale detection dedupes on (platform, platformOrderId, userId)
   * — re-importing already-known orders is a no-op.
   *
   * `days`: null = All time (no limit); a positive integer = days back.
   * No zero/"None" — this call always means "go get me something".
   */
  importHistory(
    body: { platform?: string; platforms?: string[]; days: number | null },
    opts: IdempotencyOpts = {},
  ) {
    return this.http.request<{
      results: { platform: string; ok: boolean; reason?: string; accountsStarted?: number }[];
    }>({
      method: 'POST',
      path: '/v1/orders/import',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Sales ──────────────────────────────────────────────────────────────────


export class SalesResource {
  constructor(private http: HttpClient) {}
  list(params: PaginationParams & { platform?: Platform; since?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/sales', query: params });
  }
  bulkDelete(ids: string[], opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/sales/bulk-delete',
      body: { ids },
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Inbox ──────────────────────────────────────────────────────────────────


export class ReturnsResource {
  constructor(private http: HttpClient) {}

  list(params: PaginationParams & { status?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/returns', query: params });
  }
  get(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/returns/${encodeURIComponent(id)}` });
  }
  create(body: { orderId: string; reason?: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/returns',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  update(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'PATCH',
      path: `/v1/returns/${encodeURIComponent(id)}`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Customers ──────────────────────────────────────────────────────────────


export class CustomersResource {
  constructor(private http: HttpClient) {}
  list(params: PaginationParams & { search?: string } = {}) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/customers', query: params });
  }
  get(handle: string) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/customers/${encodeURIComponent(handle)}`,
    });
  }
  bulkDelete(handles: string[], opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/customers/bulk-delete',
      body: { handles },
      idempotencyKey: opts.idempotencyKey,
    });
  }
  bulkExport(handles: string[], opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/customers/bulk-export',
      body: { handles },
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ─── Reference (no auth — open data) ────────────────────────────────────────

