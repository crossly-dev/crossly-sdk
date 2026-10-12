// ── Cross-marketplace buyer features ─────────────────────────────────
//
// Composed onto `BuyerResource` as `buyer.giftFinder`, `buyer.listingInsights`,
// `buyer.subscriptions`, `buyer.splits`, `buyer.hunts`, `buyer.groupBuys`,
// `buyer.returns`, `buyer.buybacks` and `buyer.together`. Spending verbs need
// `buyer:checkout:write`.

import type { HttpClient, IdempotencyOpts } from '../_shared.js';

type Ok = { data: { ok: boolean } };
/** A JSON object. Named so request generics carry no nested `>`. */
type Row = Record<string, unknown>;

export interface GiftFinderOptions {
  recipients: { key: string; label: string; interests: { key: string; label: string }[] }[];
  budgets: { key: string; label: string }[];
}
export interface ListingTileLite { slug: string; title?: string | null; priceCents: number; thumbnail?: string | null; salePriceCents?: number | null }

/** The gift finder. Requires `buyer:catalog:read`. */
export class BuyerGiftFinderResource {
  constructor(private http: HttpClient) {}

  options() {
    return this.http.request<{ data: GiftFinderOptions }>({ method: 'GET', path: '/v1/buyer/gift-finder/options' });
  }

  /** `for` is a recipient key, `interest` one of its interests, `budget` a band key. */
  search(params: { for?: string; interest?: string; budget?: string; page?: number }) {
    return this.http.request<{ data: ListingTileLite[]; meta: { hasMore: boolean } }>({ method: 'GET', path: '/v1/buyer/gift-finder', query: params });
  }
}

export interface FitView { chart: { kind: string; kindLabel: string; rows: { key: string; label: string; inches: number }[] } | null; comparisons: { refId: string; label: string; result: { verdict: string; summary: string } }[] }
export interface ResaleValue { brand: string; category: string; medianCents: number; comps: number; keepsPct: number | null; buybackCents: number | null; buybackDays: number }
export interface ImpactFigure { key: string; label: string; co2Kg: number | null; waterL: number | null; source: string }
export interface BoughtTogether { mode: string; items: { slug: string; title: string | null; priceCents: number; image: string | null; sameSeller: boolean }[]; bundleDiscountBps: number }
export interface PublicReview { id: string; rating: number; body: string | null; media: { kind: string; url: string }[]; sellerReply: string | null; reviewer: string | null; item: { title: string | null; slug: string | null }; createdAt: string }

/** Read-only facts about one listing. Requires `buyer:catalog:read`. */
export class BuyerListingInsightsResource {
  constructor(private http: HttpClient) {}

  fit(slug: string) {
    return this.http.request<{ data: FitView }>({ method: 'GET', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/fit` });
  }

  resaleValue(slug: string) {
    return this.http.request<{ data: ResaleValue | null }>({ method: 'GET', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/resale-value` });
  }

  impact(slug: string) {
    return this.http.request<{ data: ImpactFigure | null }>({ method: 'GET', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/impact` });
  }

  boughtTogether(slug: string) {
    return this.http.request<{ data: BoughtTogether }>({ method: 'GET', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/bought-together` });
  }

  sellerReviews(slug: string, params: { withMedia?: '1'; before?: string; limit?: number } = {}) {
    return this.http.request<{ data: PublicReview[]; meta: { nextBefore: string | null } }>({ method: 'GET', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/seller-reviews`, query: params });
  }

  quickQuestions(slug: string) {
    return this.http.request<{ data: { key: string; text: string }[] }>({ method: 'GET', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/quick-questions` });
  }

  cardBreak(slug: string) {
    return this.http.request<{ data: Row | null }>({ method: 'GET', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/break` });
  }

  groupBuy(slug: string) {
    return this.http.request<{ data: Row | null }>({ method: 'GET', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/group-buy` });
  }

  /** A graded listing's cert checked with the grader (status, population, pop higher). null = not graded. */
  cert(slug: string) {
    return this.http.request<{ data: ListingCert | null }>({ method: 'GET', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/cert` });
  }
}

export interface ListingCert {
  graderSlug: string;
  graderName: string;
  grade: string;
  qualifier: string | null;
  certNumber: string | null;
  lookupUrl: string | null;
  /** `unchecked` = the grader has no lookup API: check `lookupUrl` by hand. */
  status: 'verified' | 'mismatch' | 'not_found' | 'unchecked';
  label: string | null;
  population: number | null;
  popHigher: number | null;
  checkedAt: string | null;
}

export interface Subscription { id: string; status: string; intervalDays: number; discountBps: number; nextRunAt: string; slug: string | null; title: string | null }

/** Subscribe & save. Reads need `buyer:orders:read`; changes `buyer:checkout:write`. */
export class BuyerSubscriptionsResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.request<{ data: Subscription[] }>({ method: 'GET', path: '/v1/buyer/subscriptions' });
  }

  subscribe(slug: string, input: { intervalDays: 14 | 30 | 60 | 90; paymentMethodId?: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: { id: string } }>({ method: 'POST', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/subscribe`, body: input, idempotencyKey: opts.idempotencyKey });
  }

  update(id: string, input: { action: 'pause' | 'resume' | 'skip' | 'cancel' | 'interval'; intervalDays?: number }) {
    return this.http.request<Ok>({ method: 'PATCH', path: `/v1/buyer/subscriptions/${encodeURIComponent(id)}`, body: input });
  }
}

export interface SplitCreated { id: string; totalCents: number; shares: { token: string; shareCents: number; position: number }[] }

/** Split a purchase between people. Requires `buyer:checkout:write`. */
export class BuyerSplitsResource {
  constructor(private http: HttpClient) {}

  create(slug: string, input: { parts: number; note?: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: SplitCreated }>({ method: 'POST', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/split`, body: input, idempotencyKey: opts.idempotencyKey });
  }
}

export interface Hunt { id: string; name: string; mode: string; maxPriceCents: number; buysLeft: number; status: string }

/** The buyer agent. `buyer:monitors:*`; offer/buy hunts also `buyer:checkout:write`. */
export class BuyerHuntsResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.request<{ data: Hunt[] }>({ method: 'GET', path: '/v1/buyer/hunts' });
  }

  /** `listingSlug` turns the hunt into auto-buy on that one listing: it buys once the price (sale applied) is within maxPriceCents. */
  create(input: { name?: string; filters?: Record<string, unknown>; maxPriceCents: number; mode: 'notify' | 'offer' | 'buy'; maxBuys?: number; days?: number; paymentMethodId?: string; listingSlug?: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: { id: string } }>({ method: 'POST', path: '/v1/buyer/hunts', body: input, idempotencyKey: opts.idempotencyKey });
  }

  setStatus(id: string, status: 'active' | 'paused' | 'cancelled') {
    return this.http.request<Ok>({ method: 'PATCH', path: `/v1/buyer/hunts/${encodeURIComponent(id)}`, body: { status } });
  }
}

/** Group buys. Requires `buyer:checkout:write`. */
export class BuyerGroupBuysResource {
  constructor(private http: HttpClient) {}

  /** Places a HOLD on your card, captured at the price the group reaches. */
  join(id: string, input: { paymentMethodId?: string } = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: { joined: boolean } }>({ method: 'POST', path: `/v1/buyer/group-buys/${encodeURIComponent(id)}/join`, body: input, idempotencyKey: opts.idempotencyKey });
  }

  leave(id: string) {
    return this.http.request<Ok>({ method: 'POST', path: `/v1/buyer/group-buys/${encodeURIComponent(id)}/leave` });
  }
}

/** Returns under the seller's policy, and try at home. Requires `buyer:orders:write`. */
export class BuyerReturnsResource {
  constructor(private http: HttpClient) {}

  /** With `doesnt_fit`, `fit` says which way (it feeds your size memory). */
  request(purchaseId: string, input: { reason: 'changed_mind' | 'doesnt_fit' | 'try_at_home' | 'other'; note?: string; fit?: 'small' | 'large' }) {
    return this.http.request<{ data: { id: string } }>({ method: 'POST', path: `/v1/buyer/purchases/${encodeURIComponent(purchaseId)}/return`, body: input });
  }
}

/** Buyback guarantees. Requires `buyer:orders:write`. */
export class BuyerBuybacksResource {
  constructor(private http: HttpClient) {}

  request(id: string) {
    return this.http.request<Ok>({ method: 'POST', path: `/v1/buyer/buybacks/${encodeURIComponent(id)}/request` });
  }
}

/** Shop-together rooms. `buyer:activity:read` / `buyer:activity:write`. */
export class BuyerTogetherResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.request<{ data: { code: string; name: string; endsAt: string }[] }>({ method: 'GET', path: '/v1/buyer/together' });
  }

  create(input: { name?: string } = {}) {
    return this.http.request<{ data: { code: string; id: string } }>({ method: 'POST', path: '/v1/buyer/together', body: input });
  }

  addItem(code: string, slug: string) {
    return this.http.request<Ok>({ method: 'POST', path: `/v1/buyer/together/${encodeURIComponent(code)}/items`, body: { slug } });
  }
}
