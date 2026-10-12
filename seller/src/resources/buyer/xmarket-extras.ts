// ── Cross-marketplace buyer features: the rest of the surface ────────
//
// Composed onto `BuyerResource` as `buyer.purchaseExtras`, `buyer.fit`,
// `buyer.breaks`, `buyer.room`, `buyer.discoverMore` and `buyer.market`.

import type { HttpClient, IdempotencyOpts } from '../_shared.js';

type Ok = { data: { ok: boolean } };
/** A JSON object. Named so request generics carry no nested `>`. */
type Row = Record<string, unknown>;

export interface SubscribeOffer { discountBps: number; intervals: number[]; priceCents: number; subscribePriceCents: number }
export interface ReturnQuote { terms: Record<string, unknown>; reasons: { reason: string; eligible: boolean; why: string | null; deadline: string | null }[]; existing: Record<string, unknown> | null }

/** Your purchases' extras: buybacks, footprint, splits, return quotes, owner stories, downloads. */
export class BuyerPurchaseExtrasResource {
  constructor(private http: HttpClient) {}

  subscribeOffer(slug: string) {
    return this.http.request<{ data: SubscribeOffer | null }>({ method: 'GET', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/subscribe-offer` });
  }

  impact() {
    return this.http.request<{ data: Row | null }>({ method: 'GET', path: '/v1/buyer/impact' });
  }

  buybacks() {
    return this.http.request<{ data: Row[] }>({ method: 'GET', path: '/v1/buyer/buybacks' });
  }

  splits() {
    return this.http.request<{ data: Row[] }>({ method: 'GET', path: '/v1/buyer/splits' });
  }

  cancelSplit(id: string) {
    return this.http.request<Ok>({ method: 'POST', path: `/v1/buyer/splits/${encodeURIComponent(id)}/cancel` });
  }

  returnQuote(purchaseId: string) {
    return this.http.request<{ data: ReturnQuote }>({ method: 'GET', path: `/v1/buyer/purchases/${encodeURIComponent(purchaseId)}/return` });
  }

  returnTracking(returnId: string, input: { carrier: string; trackingCode: string }) {
    return this.http.request<Ok>({ method: 'POST', path: `/v1/buyer/returns/${encodeURIComponent(returnId)}/tracking`, body: input });
  }

  cancelReturn(returnId: string) {
    return this.http.request<Ok>({ method: 'POST', path: `/v1/buyer/returns/${encodeURIComponent(returnId)}/cancel` });
  }

  story(purchaseId: string) {
    return this.http.request<{ data: { id: string; story: string | null } | null }>({ method: 'GET', path: `/v1/buyer/purchases/${encodeURIComponent(purchaseId)}/story` });
  }

  setStory(purchaseId: string, story: string) {
    return this.http.request<Ok>({ method: 'PUT', path: `/v1/buyer/purchases/${encodeURIComponent(purchaseId)}/story`, body: { story } });
  }

  /** A ten-minute link; each call uses one of the purchase's downloads. */
  download(purchaseId: string) {
    return this.http.request<{ data: { url: string; name: string; remaining: number } }>({ method: 'POST', path: `/v1/buyer/purchases/${encodeURIComponent(purchaseId)}/download` });
  }
}

/** Saved reference garments for fit comparison. */
export class BuyerFitResource {
  constructor(private http: HttpClient) {}

  vocabulary() {
    return this.http.request<{ data: Row }>({ method: 'GET', path: '/v1/buyer/fit/vocabulary' });
  }

  refs() {
    return this.http.request<{ data: Row[] }>({ method: 'GET', path: '/v1/buyer/fit/refs' });
  }

  addRef(input: { label: string; measurements: Record<string, unknown> }) {
    return this.http.request<{ data: { id: string } }>({ method: 'POST', path: '/v1/buyer/fit/refs', body: input });
  }

  removeRef(id: string) {
    return this.http.request<Ok>({ method: 'DELETE', path: `/v1/buyer/fit/refs/${encodeURIComponent(id)}` });
  }
}

/** Card breaks you are in. */
export class BuyerBreaksResource {
  constructor(private http: HttpClient) {}

  mine() {
    return this.http.request<{ data: Row[] }>({ method: 'GET', path: '/v1/buyer/breaks' });
  }

  get(id: string) {
    return this.http.request<{ data: Row | null }>({ method: 'GET', path: `/v1/buyer/breaks/${encodeURIComponent(id)}` });
  }

  /** Hold a pick-your-spot spot; buy it through checkout before `heldUntil`. */
  hold(id: string, spotId: string) {
    return this.http.request<{ data: { heldUntil: string; slug: string | null } }>({ method: 'POST', path: `/v1/buyer/breaks/${encodeURIComponent(id)}/spots/${encodeURIComponent(spotId)}/hold` });
  }

  release(id: string, spotId: string) {
    return this.http.request<Ok>({ method: 'DELETE', path: `/v1/buyer/breaks/${encodeURIComponent(id)}/spots/${encodeURIComponent(spotId)}/hold` });
  }
}

/** A shop-together room's board, members and chat. */
export class BuyerRoomResource {
  constructor(private http: HttpClient) {}

  get(code: string) {
    return this.http.request<{ data: Row | null }>({ method: 'GET', path: `/v1/buyer/together/${encodeURIComponent(code)}` });
  }

  join(code: string) {
    return this.http.request<{ data: Row }>({ method: 'POST', path: `/v1/buyer/together/${encodeURIComponent(code)}/join` });
  }

  leave(code: string) {
    return this.http.request<Ok>({ method: 'POST', path: `/v1/buyer/together/${encodeURIComponent(code)}/leave` });
  }

  removeItem(code: string, itemId: string) {
    return this.http.request<Ok>({ method: 'DELETE', path: `/v1/buyer/together/${encodeURIComponent(code)}/items/${encodeURIComponent(itemId)}` });
  }

  vote(code: string, itemId: string, vote: -1 | 0 | 1) {
    return this.http.request<Ok>({ method: 'POST', path: `/v1/buyer/together/${encodeURIComponent(code)}/items/${encodeURIComponent(itemId)}/vote`, body: { vote } });
  }

  say(code: string, body: string) {
    return this.http.request<Ok>({ method: 'POST', path: `/v1/buyer/together/${encodeURIComponent(code)}/messages`, body: { body } });
  }
}

/** Parties, the price guide and creator storefronts. Requires `buyer:catalog:read`. */
export class BuyerDiscoverMoreResource {
  constructor(private http: HttpClient) {}

  parties() {
    return this.http.request<{ data: Row[] }>({ method: 'GET', path: '/v1/buyer/parties' });
  }

  party(slug: string) {
    return this.http.request<{ data: Row }>({ method: 'GET', path: `/v1/buyer/parties/${encodeURIComponent(slug)}` });
  }

  partyListings(slug: string, limit?: number) {
    return this.http.request<{ data: Row[] }>({ method: 'GET', path: `/v1/buyer/parties/${encodeURIComponent(slug)}/listings`, query: { limit } });
  }

  /** The shop's browse filters (q, brand, category, condition, size, …); at least one. */
  priceGuide(filters: Record<string, string>) {
    return this.http.request<{ data: Row }>({ method: 'GET', path: '/v1/buyer/price-guide', query: filters });
  }

  creator(handle: string) {
    return this.http.request<{ data: Row }>({ method: 'GET', path: `/v1/buyer/creators/${encodeURIComponent(handle)}` });
  }

  /** A live stream's current auction; bid on it by slug with `buyer.auctions.bid`. */
  streamAuction(streamId: string) {
    return this.http.request<{ data: { id: string; slug: string | null; minNextBidCents: number } | null }>({ method: 'GET', path: `/v1/buyer/live-streams/${encodeURIComponent(streamId)}/auction` });
  }
}

export interface MarketBidInput {
  variantId: string;
  priceCents: number;
  paymentMethodId: string;
  condition?: string;
  expiresInDays?: number;
  /** Where it goes once it clears: home (default) or your Crossly vault. */
  deliverTo?: 'home' | 'vault';
  /** Expedited shipping from vault stock, for the premium in `vault.purchaseOptions`. */
  fastShip?: boolean;
  /** A raw card goes from the authenticator into this Grading run first. */
  gradeWith?: { runId: string; returnMode?: 'return' | 'vault' };
}

/** Market watches and fixed-price bids. A bid SPENDS MONEY when it fills. */
export class BuyerMarketResource {
  constructor(private http: HttpClient) {}

  watches() {
    return this.http.request<{ data: Row[] }>({ method: 'GET', path: '/v1/buyer/market/watches' });
  }

  watch(input: { variantId: string; condition?: string; gradeKey?: string | null; thresholdCents?: number | null }) {
    return this.http.request<Ok>({ method: 'POST', path: '/v1/buyer/market/watches', body: input });
  }

  unwatch(id: string) {
    return this.http.request<Ok>({ method: 'DELETE', path: `/v1/buyer/market/watches/${encodeURIComponent(id)}` });
  }

  bids() {
    return this.http.request<{ data: Row[] }>({ method: 'GET', path: '/v1/buyer/market/bids' });
  }

  /** Checked against this key's spending controls; pass an idempotencyKey. */
  bid(input: MarketBidInput, opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: Row }>({ method: 'POST', path: '/v1/buyer/market/bids', body: input, idempotencyKey: opts.idempotencyKey });
  }

  cancelBid(id: string) {
    return this.http.request<Ok>({ method: 'DELETE', path: `/v1/buyer/market/bids/${encodeURIComponent(id)}` });
  }
}
