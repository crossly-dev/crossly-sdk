import type { HttpClient, IdempotencyOpts } from './_shared.js';

/**
 * The buyer surface — catalogue, monitors, and checkout.
 *
 * ── A DIFFERENT PRINCIPAL ────────────────────────────────────────────
 * Everything here needs a BUYER token (`crossly_oat_…`, scoped `buyer:*`), not
 * a seller Personal Access Token. The two are separate on purpose: a seller
 * PAT authenticating buyer calls would mean one credential that can both list
 * items in a shop and spend money in it.
 *
 * ── AND A DIFFERENT SET OF HABITS ────────────────────────────────────
 * These are the calls people otherwise get by scraping, so they are built for
 * the traffic shape scraping produces:
 *
 *   - `search` paginates by opaque CURSOR. Page 500 costs what page 1 costs.
 *     Do not parse a cursor; it is deliberately not a stable format.
 *   - Responses carry ETags. Send `If-None-Match` and an unchanged page
 *     answers 304 with no body — which is what makes polling cheap enough to
 *     be an honest option.
 *   - If you find yourself polling on a timer, use a MONITOR instead. It is
 *     cheaper for us by an enormous factor and lower-latency for you.
 */

export interface CatalogItem {
  slug: string;
  title: string;
  priceCents: number;
  /** MSRP above the ask, or null. Never fabricated from a stale value. */
  compareAtCents: number | null;
  currency: string;
  condition: string | null;
  brand: string | null;
  categoryMain: string | null;
  categorySub: string | null;
  thumbnail: string | null;
  images: string[];
  sellerUsername: string | null;
  sellerDisplayName: string | null;
  /** Units a buyer can take right now. Reserved units are excluded. */
  quantityAvailable: number;
  listedAt: string | null;
  url: string;
}

export interface CatalogSearchParams {
  q?: string;
  brand?: string;
  category?: string;
  condition?: string;
  seller?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  /** ISO instant. Only listings that went live after it. */
  listedAfter?: string;
  inStockOnly?: boolean;
  /** `popular` is deliberately unavailable — see the class docblock. */
  sort?: 'newest' | 'price_low' | 'price_high';
  /** Max 100. */
  limit?: number;
  /** Opaque. Pass back what `meta.nextCursor` gave you. */
  cursor?: string;
}

export interface ListingDetail extends Omit<CatalogItem, 'url'> {
  description: string | null;
  /** Resolves even when delisted or sold — see `available`. */
  status: string;
  available: boolean;
  size: string | null;
  color: string[] | null;
}

export interface Availability {
  slug: string;
  available: boolean;
  quantityAvailable: number;
  priceCents: number;
  currency: string;
  status: string;
}

export type MonitorKind = 'new_listing' | 'price_drop' | 'back_in_stock';

export interface Monitor {
  id: string;
  name: string;
  kind: MonitorKind;
  query: Record<string, unknown>;
  delivery: 'webhook' | 'poll';
  webhookUrl: string | null;
  /**
   * Returned ONLY when the monitor is created, and never again. Store it then
   * — a secret readable on every list is a secret that leaks through the first
   * screenshot or support paste.
   */
  webhookSecret?: string;
  active: boolean;
  pausedReason: string | null;
  matchCount: number;
  lastCheckedAt: string | null;
  lastMatchAt: string | null;
  createdAt: string;
}

export interface MonitorMatch {
  listingSlug: string;
  /** `-1` when this kind has no price trigger. */
  triggerPriceCents: number;
  deliveredAt: string | null;
  createdAt: string;
}

export interface CheckoutControls {
  patId: string;
  enabled: boolean;
  dailyLimitCents: number;
  perOrderLimitCents: number;
  maxUnitsPerListingPerDay: number;
}

export interface BuyResult {
  listingSlug: string;
  quantity: number;
  totalCents: number;
  currency: string;
  paymentStatus: string;
  paymentIntentId: string | null;
  orderId: string | null;
}

// ── Live Shop ────────────────────────────────────────────────────────

export type ScanTier = 'identifier' | 'visual' | 'vision' | 'none';

export interface HudFact {
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'neutral';
}

export interface HudAction {
  kind: 'buy_crossly' | 'buy_offsite' | 'save' | 'none';
  label: string;
  url: string | null;
}

/**
 * Pre-formatted for a 600x600 lens. Render it verbatim.
 *
 * Reformatting on the client is how the caveat that makes a price claim true —
 * "Before postage" above all — gets dropped to make a line fit.
 */
export interface Hud {
  headline: string;
  subline: string | null;
  facts: HudFact[];
  action: HudAction;
  tone: 'win' | 'info' | 'none';
  imageUrl: string | null;
}

export interface ScanResult {
  tier: ScanTier;
  confidence: number;
  identifier: { ns: string; value: string } | null;
  /** Words a vision model read. NEVER an identity — see the API docs. */
  visionLabel: string | null;
  /** True when the paid rung was skipped for the day, not that it found nothing. */
  visionQuotaExhausted: boolean;
  verdict: 'crossly_best' | 'offsite_cheaper' | 'offsite_only' | 'crossly_only' | 'no_match';
  savingCents: number | null;
  shippingUnknown: boolean;
  hud: Hud;
}

export interface ScanSession {
  id: string;
  device: string;
  label: string | null;
  startedAt: string;
  endedAt?: string | null;
  captureCount: number;
}

export interface LockonCandidate {
  identifierNs: string;
  identifierValue: string;
  title: string;
  imageUrl: string | null;
  priceCents: number | null;
  storeName: string | null;
}

export interface LockonState {
  lockonId: string;
  status: string;
  identifier: { ns: string; value: string } | null;
  /** `confirmed` means a human picked it — the strongest evidence there is. */
  identitySource: 'visual' | 'ocr' | 'barcode' | 'confirmed' | null;
  candidates: LockonCandidate[];
  observationCount: number;
  visionCalls: number;
  verdict: string;
  savingCents: number | null;
  hud: Hud;
}

/** Verdict payload from `anywhere`. Mirrors the HUD-less shape of a scan. */
export interface AnywhereResult {
  verdict: 'crossly_best' | 'offsite_cheaper' | 'offsite_only' | 'no_match';
  recommended: 'crossly' | 'offsite' | null;
  savingCents: number | null;
  shippingUnknown: boolean;
  crossly: Record<string, unknown> | null;
  offsite: Record<string, unknown> | null;
  alternates: Record<string, unknown>[];
}

/** A trip plus every capture it recorded, as the verdicts were given. */
export interface ScanSessionDetail extends ScanSession {
  live: boolean;
  savedCents: number;
  captures: {
    id: string;
    matchMethod: string;
    identifier: { ns: string; value: string } | null;
    verdict: string;
    displayLine: string | null;
    savingCents: number | null;
    createdAt: string;
  }[];
}

export class BuyerResource {
  constructor(private http: HttpClient) {}

  // ── Catalogue ──────────────────────────────────────────────────────

  /**
   * Search the catalogue. Requires `buyer:catalog:read`.
   *
   * `meta.nextCursor` is the next page; absent when the walk is done.
   */
  search(params: CatalogSearchParams = {}) {
    return this.http.request<{ data: CatalogItem[]; meta?: { nextCursor: string | null } }>({
      method: 'GET',
      path: '/v1/buyer/catalog/search',
      query: params as Record<string, unknown>,
    });
  }

  /** One listing, in full. Resolves even when sold or delisted. */
  getListing(slug: string) {
    return this.http.request<ListingDetail>({
      method: 'GET',
      path: `/v1/buyer/catalog/listings/${encodeURIComponent(slug)}`,
    });
  }

  /**
   * Is it buyable, and at what price.
   *
   * The cheapest call in the API, and the one to poll if you are going to
   * poll — one indexed row and an ETag. A monitor is still better.
   */
  availability(slug: string) {
    return this.http.request<Availability>({
      method: 'GET',
      path: `/v1/buyer/catalog/listings/${encodeURIComponent(slug)}/availability`,
    });
  }

  /** Brands, categories and conditions that currently have stock. */
  facets() {
    return this.http.request<{
      brands: { value: string; count: number }[];
      conditions: { value: string; count: number }[];
      categories: { value: string; count: number }[];
    }>({ method: 'GET', path: '/v1/buyer/catalog/facets' });
  }

  // ── Monitors ───────────────────────────────────────────────────────

  /** Your monitors. Requires `buyer:monitors:read`. */
  listMonitors() {
    return this.http.request<{ data: Monitor[] }>({
      method: 'GET',
      path: '/v1/buyer/monitors',
    });
  }

  /**
   * Watch a search. Requires `buyer:monitors:write`.
   *
   * Works immediately — there is no review step. Two things worth knowing:
   *
   *   - `webhookSecret` comes back HERE and nowhere else.
   *   - The first sweep SEEDS without notifying. A restock alert created while
   *     the item is in stock has not observed a restock, and a new-listing
   *     monitor would otherwise deliver the entire back catalogue at once.
   *
   * `back_in_stock` must name one listing via `query.slug`.
   */
  createMonitor(input: {
    name: string;
    kind: MonitorKind;
    query?: Record<string, unknown>;
    delivery?: 'webhook' | 'poll';
    webhookUrl?: string;
  }) {
    return this.http.request<Monitor>({
      method: 'POST',
      path: '/v1/buyer/monitors',
      body: input,
    });
  }

  /**
   * What a monitor has matched.
   *
   * The read side of a `poll` monitor, and an audit trail for a `webhook` one
   * — a delivery you missed is not data you lost.
   */
  monitorMatches(id: string) {
    return this.http.request<{ data: MonitorMatch[] }>({
      method: 'GET',
      path: `/v1/buyer/monitors/${encodeURIComponent(id)}/matches`,
    });
  }

  /** Pause, resume or rename. Resuming clears a delivery-failure pause. */
  updateMonitor(id: string, patch: { name?: string; active?: boolean }) {
    return this.http.request<Monitor>({
      method: 'PATCH',
      path: `/v1/buyer/monitors/${encodeURIComponent(id)}`,
      body: patch,
    });
  }

  /** Delete a monitor. Answers 204. */
  deleteMonitor(id: string) {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/v1/buyer/monitors/${encodeURIComponent(id)}`,
    });
  }


  // ── Where is this cheapest, anywhere ───────────────────────────────

  /**
   * Cheapest source for an item — Crossly first, then other retailers.
   *
   * Offsite offers are ranked CHEAPEST-FIRST; commission only ever breaks a
   * sub-$1 tie, and Crossly gets a $1 preference and no more. Check
   * `shippingUnknown` before presenting a total as delivered.
   */
  anywhere(params: {
    ns: string;
    value: string;
    pagePriceCents?: number;
    currency?: string;
  }) {
    return this.http.request<AnywhereResult>({
      method: 'GET',
      path: '/v1/buyer/anywhere',
      query: params as Record<string, unknown>,
    });
  }

  // ── Live Shop ──────────────────────────────────────────────────────

  /**
   * Identify a held object and get a HUD-ready answer.
   *
   * A decoded BARCODE resolves in ~50ms for nothing. A photo falls back to
   * self-hosted CLIP, then to a vision model (capped per buyer per day).
   * A vision label names the thing; it never drives a price comparison.
   */
  identify(input: {
    identifier?: { ns: string; value: string };
    imageBase64?: string;
    pagePriceCents?: number;
    currency?: string;
    sessionId?: string;
    /** Opt out of the one rung that costs money. */
    allowVision?: boolean;
  }) {
    return this.http.request<ScanResult>({
      method: 'POST',
      path: '/v1/buyer/identify',
      body: input,
    });
  }

  /** One-shot scan. Prefer `identify` — it runs the full cost ladder. */
  scan(input: {
    identifier?: { ns: string; value: string };
    imageBase64?: string;
    pagePriceCents?: number;
    currency?: string;
    sessionId?: string;
  }) {
    return this.http.request<ScanResult>({
      method: 'POST',
      path: '/v1/buyer/scan',
      body: input,
    });
  }

  /** Open a shopping trip. Opening one CLOSES any other live session. */
  startScanSession(input: { device?: 'glasses' | 'phone'; label?: string } = {}) {
    return this.http.request<ScanSession>({
      method: 'POST',
      path: '/v1/buyer/scan/sessions',
      body: input,
    });
  }

  endScanSession(id: string) {
    return this.http.request<ScanSession>({
      method: 'POST',
      path: `/v1/buyer/scan/sessions/${encodeURIComponent(id)}/end`,
    });
  }

  listScanSessions() {
    return this.http.request<{ data: ScanSession[] }>({
      method: 'GET',
      path: '/v1/buyer/scan/sessions',
    });
  }

  /** One trip and everything it found. Verdicts are as-given, never re-priced. */
  getScanSession(id: string) {
    return this.http.request<ScanSessionDetail>({
      method: 'GET',
      path: `/v1/buyer/scan/sessions/${encodeURIComponent(id)}`,
    });
  }

  // ── Lock-on ────────────────────────────────────────────────────────

  /** Lock on to an object the buyer is holding. */
  startLockon(input: { sessionId: string }) {
    return this.http.request<{ id: string; status: string }>({
      method: 'POST',
      path: '/v1/buyer/lockons',
      body: input,
    });
  }

  /**
   * Add what a frame revealed, and get the current best answer.
   *
   * Send only what you LEARNED — a decoded barcode, newly-read OCR text, or a
   * frame when neither settled it. Do NOT post every frame: tracking and
   * decoding are on-device and free, and this endpoint is for evidence, not
   * video. Evidence is ranked, so a late weak reading cannot overwrite a
   * strong early one.
   */
  observeLockon(
    id: string,
    input: {
      barcode?: { ns: string; value: string };
      ocrText?: string;
      attributes?: {
        brand?: string;
        model?: string;
        size?: string;
        colour?: string;
        tokens?: string[];
      };
      imageBase64?: string;
      pagePriceCents?: number;
      currency?: string;
    },
  ) {
    return this.http.request<LockonState>({
      method: 'POST',
      path: `/v1/buyer/lockons/${encodeURIComponent(id)}/observe`,
      body: input,
    });
  }

  /**
   * The buyer picked a candidate.
   *
   * Promotes a text match to a CONFIRMED identity — validated against the
   * candidates actually offered, so it cannot be claimed about an arbitrary
   * product.
   */
  confirmLockon(id: string, input: { ns: string; value: string }) {
    return this.http.request<LockonState>({
      method: 'POST',
      path: `/v1/buyer/lockons/${encodeURIComponent(id)}/confirm`,
      body: input,
    });
  }

  // ── Checkout ───────────────────────────────────────────────────────

  /** What THIS key may spend. Per-key, not per-account. */
  checkoutControls() {
    return this.http.request<CheckoutControls>({
      method: 'GET',
      path: '/v1/buyer/checkout/controls',
    });
  }

  /**
   * Switch this key on for spending and set its ceilings.
   *
   * Holding `buyer:checkout:write` is NOT sufficient on its own — a key that
   * was never deliberately enabled here cannot spend, which is what bounds the
   * damage a leaked token can do.
   */
  setCheckoutControls(controls: {
    enabled: boolean;
    dailyLimitCents: number;
    perOrderLimitCents: number;
    maxUnitsPerListingPerDay: number;
  }) {
    return this.http.request<CheckoutControls>({
      method: 'PUT',
      path: '/v1/buyer/checkout/controls',
      body: controls,
    });
  }

  /**
   * Buy a listing without being present. Requires `buyer:checkout:write`.
   *
   * AN IDEMPOTENCY KEY IS REQUIRED — the API refuses without one (400
   * `idempotency_key_required`), not merely this client. A retry after a
   * timeout is the normal way an automated buyer buys the same thing twice,
   * and it happens in exactly the case where you never learn the first attempt
   * succeeded.
   *
   * Derive it from the INTENT and reuse it across retries. A fresh random value
   * per attempt satisfies the requirement and keeps the bug.
   *
   * `maxTotalCents` is checked against the DELIVERED total (item + shipping +
   * tax) before anything is charged, not against the sticker price.
   *
   * `paymentMethodId` names a card you already saved on crossly.net. There is
   * no field for card data anywhere in this API.
   *
   * A card that demands 3-D Secure cannot be charged unattended: that answers
   * 402 `authentication_required` rather than pretending to succeed.
   */
  buy(
    input: {
      listingSlug: string;
      paymentMethodId: string;
      quantity?: number;
      shipTo?: {
        name: string;
        street1: string;
        street2?: string;
        city: string;
        state: string;
        zip: string;
        country?: string;
      };
      localPickup?: boolean;
      maxTotalCents?: number;
    },
    opts?: IdempotencyOpts,
  ) {
    return this.http.request<BuyResult>({
      method: 'POST',
      path: '/v1/buyer/checkout',
      body: input,
      idempotencyKey: opts?.idempotencyKey,
    });
  }
}
