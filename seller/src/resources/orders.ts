import type { HttpClient, JsonObject, PaginationParams, Platform, IdempotencyOpts } from './_shared.js';
import type { CustomerDetail, CustomerListRow, CustomerProfileRefresh } from './customers-types.js';


export interface SchedulePickupInput {
  orderIds: string[];
  date: string;
  minTime: string;
  maxTime: string;
  address?: { street1: string; city: string; state: string; zip: string; country?: string };
  instructions?: string;
}

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
    /** `labelCost`: what you paid for this postage (dollars), counted against the sale's profit. */
    body: { trackingNumber: string; carrier?: string; trackingUrl?: string; labelCost?: number },
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
  /** Buy the carrier label for a Crossly order held at a pickup point (debits the shipping wallet; 402 when short). */
  pickupLabel(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: { trackingNumber: string; labelUrl: string } }>({ method: 'POST', path: `/v1/orders/${encodeURIComponent(id)}/pickup-label`, idempotencyKey: opts.idempotencyKey });
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
  /** Whatnot order: the shipment (package, label, tracking). Records a label found on it. */
  whatnotShipment(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/orders/${encodeURIComponent(id)}/whatnot/shipment` });
  }
  /** Whatnot order: what a package change would cost, in cents. */
  quoteWhatnotPackage(id: string, body: JsonObject) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/orders/${encodeURIComponent(id)}/whatnot/package/quote`, body });
  }
  /** Whatnot order: save weight (oz) + box (in). `acceptCostCents` must cover a charged change. */
  updateWhatnotPackage(id: string, body: JsonObject, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/orders/${encodeURIComponent(id)}/whatnot/package`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Whatnot order: generate the label and record it on the order. */
  generateWhatnotLabel(id: string, body: JsonObject = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/orders/${encodeURIComponent(id)}/whatnot/label`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /**
   * Link an UNMATCHED sale (its listing is an auto-created external-sale stub)
   * to one of your listings: re-points the sale + order, archives the stub,
   * marks the listing sold (quantity-aware) and delists it everywhere else
   * once no unit is left. `platformListingId` picks which of the listing's
   * rows on the order's platform, when it has several. 409 if already linked.
   */
  linkListing(id: string, body: { listingId: string; platformListingId?: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/orders/${encodeURIComponent(id)}/link-listing`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
  /** Whatnot order: a fresh link to Whatnot's packing slip PDF. */
  whatnotPackingSlip(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/orders/${encodeURIComponent(id)}/whatnot/packing-slip` });
  }
  /**
   * The order's shipping label as a PDF ready to print: cropped to the label,
   * turned upright, fitted to `size` ('4x6' default, 'letter', 'a4', 'native').
   * `flip` turns it a half turn; `parcelId` picks a parcel other than the primary.
   */
  printLabel(id: string, opts: { size?: '4x6' | 'letter' | 'a4' | 'native'; flip?: boolean; parcelId?: string } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: `/v1/orders/${encodeURIComponent(id)}/label/print`,
      query: {
        ...(opts.size ? { size: opts.size } : {}),
        ...(opts.flip ? { flip: '1' } : {}),
        ...(opts.parcelId ? { parcelId: opts.parcelId } : {}),
      },
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

  /** Orders with a purchased Shippo label that a courier can collect or a SCAN form can cover, by carrier. */
  pickupReady() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/orders/pickup-ready' });
  }
  /**
   * Book a carrier pickup. One carrier per pickup; `date` YYYY-MM-DD and a
   * window (`minTime`/`maxTime`, HH:MM) of at least an hour, up to 14 days
   * out. `address` defaults to the labels' ship-from. The response carries
   * the carrier's `confirmation` — quote it if the courier does not come.
   */
  schedulePickup(body: SchedulePickupInput, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/orders/pickups', body: body as unknown as JsonObject, idempotencyKey: opts.idempotencyKey });
  }
  pickups() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/orders/pickups' });
  }
  /**
   * SCAN forms — one barcode the counter scans once, giving every parcel its
   * acceptance scan. One form per carrier account and ship-from; omit
   * `orderIds` for every label not yet on a form. Forms build
   * asynchronously: poll `scanForm(id)` until `status` is `ready`.
   */
  createScanForms(body: { orderIds?: string[]; shipDate?: string } = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/orders/scan-forms', body: body as unknown as JsonObject, idempotencyKey: opts.idempotencyKey });
  }
  scanForms() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/orders/scan-forms' });
  }
  scanForm(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/orders/scan-forms/${encodeURIComponent(id)}` });
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
  /** Rows carry `avatarUrl`, `displayName` and `bestRating` alongside the totals. */
  list(params: PaginationParams & { search?: string } = {}) {
    return this.http.request<{ data: CustomerListRow[] } & JsonObject>({ method: 'GET', path: '/v1/customers', query: params });
  }
  /** Recent orders + `profiles` (one per platform) + `stats` over ALL orders. */
  get(handle: string) {
    return this.http.request<CustomerDetail & JsonObject>({
      method: 'GET',
      path: `/v1/customers/${encodeURIComponent(handle)}`,
    });
  }
  /**
   * Re-read this buyer's profiles now on every platform they ordered on
   * (bypasses the 7-day freshness window). Asynchronous: returns what was
   * queued; read `get(handle).profiles` afterwards. Rate-limited per seller.
   */
  refreshProfile(handle: string, opts: IdempotencyOpts = {}) {
    return this.http.request<CustomerProfileRefresh>({
      method: 'POST',
      path: `/v1/customers/${encodeURIComponent(handle)}/refresh-profile`,
      idempotencyKey: opts.idempotencyKey,
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

