// ── Seller: card breaks, group buys, policy returns ──────────────────
//
// `client.breaks`, `client.groupBuys`, `client.policyReturns`.

import type { HttpClient, IdempotencyOpts } from './_shared.js';

type Ok = { data: { ok: boolean } };
/** A JSON object. Named so request generics carry no nested `>`. */
type Row = Record<string, unknown>;

export interface CreateBreakInput {
  listingSlug: string;
  title: string;
  /** pick: buyers choose their spot; random: spots are drawn from the committed seed. */
  format: 'pick' | 'random';
  /** Spot names, or one per line. */
  spots: string[] | string;
  product?: string;
  streamId?: string;
}

/** Card breaks on your listings. `listings:read` / `listings:write`. */
export class BreaksResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.request<{ data: Row[] }>({ method: 'GET', path: '/v1/breaks' });
  }

  get(id: string) {
    return this.http.request<{ data: Row }>({ method: 'GET', path: `/v1/breaks/${encodeURIComponent(id)}` });
  }

  /** The seed is committed now and revealed at the draw. */
  create(input: CreateBreakInput, opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: { id: string } }>({ method: 'POST', path: '/v1/breaks', body: input, idempotencyKey: opts.idempotencyKey });
  }

  draw(id: string) {
    return this.http.request<{ data: { assigned: number } }>({ method: 'POST', path: `/v1/breaks/${encodeURIComponent(id)}/draw` });
  }

  setHits(id: string, spotId: string, hits: string) {
    return this.http.request<Ok>({ method: 'POST', path: `/v1/breaks/${encodeURIComponent(id)}/spots/${encodeURIComponent(spotId)}/hits`, body: { hits } });
  }

  opened(id: string) {
    return this.http.request<Ok>({ method: 'POST', path: `/v1/breaks/${encodeURIComponent(id)}/opened` });
  }

  /** Only before any spot is paid for; after that, refund those orders. */
  cancel(id: string) {
    return this.http.request<Ok>({ method: 'POST', path: `/v1/breaks/${encodeURIComponent(id)}/cancel` });
  }
}

/** Group buys on your listings. `listings:write`. */
export class GroupBuysResource {
  constructor(private http: HttpClient) {}

  create(input: { listingSlug: string; tiers: { minBuyers: number; priceCents: number }[]; minBuyers: number; days: number }, opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: { id: string } }>({ method: 'POST', path: '/v1/group-buys', body: input, idempotencyKey: opts.idempotencyKey });
  }
}

/** Returns Crossly buyers open under your policy or try at home. `orders:*`. */
export class PolicyReturnsResource {
  constructor(private http: HttpClient) {}

  list(params: { orderId?: string } = {}) {
    return this.http.request<{ data: Row[] }>({ method: 'GET', path: '/v1/policy-returns', query: params });
  }

  /** Refunds the buyer, less the restocking or try fee you keep. */
  received(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: { refundCents: number } }>({ method: 'POST', path: `/v1/policy-returns/${encodeURIComponent(id)}/received`, idempotencyKey: opts.idempotencyKey });
  }
}
