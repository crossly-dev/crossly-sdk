import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Vault Markets dealer curve pools (sudoswap-style) ─────────────────────
//
// `client.vaultMarkets.curvePools`. An approved dealer (ID checked) runs a
// bonding curve on one book key from their OWN vault units and their OWN
// custodian cash: a spot, a step and a fee. Linear: each unit the pool sells
// moves spot up by `delta` cents, each unit it buys moves it down by `delta`.
// Exponential: `delta` is basis points and spot multiplies / divides by
// (1 + delta/10000). The pool asks up(spot) plus the fee and bids spot less
// the fee, one unit a level, up to `depth` levels a side, inside its units,
// its buy budget (each bid counts the worst-case buyer venue fee), and the
// floor / ceiling. Crossly is only the venue: every leg is an ordinary resting
// order and pays the ordinary maker fee. Money is integer CENTS of US dollars.
// A book key is `variantId:condition:gradeKey` (grade "-" when ungraded).

export type VaultCurveKind = 'linear' | 'exponential';
export type VaultCurveLimit = 'no_units' | 'no_cash' | 'floor' | 'ceiling' | 'curve_end';

export interface VaultCurveLevel {
  /** 'bid' = the pool buys, 'ask' = the pool sells. */
  side: 'bid' | 'ask';
  level: number;
  priceCents: number;
  spotAfterCents: number;
}

export interface VaultCurveLadder {
  bids: VaultCurveLevel[];
  asks: VaultCurveLevel[];
  bidLimit: VaultCurveLimit | null;
  askLimit: VaultCurveLimit | null;
}

export interface VaultCurvePreview extends VaultCurveLadder {
  buyerFeeBps: number;
  valueCents: number;
}

export interface VaultCurvePoolLeg {
  orderId: string;
  side: 'bid' | 'ask';
  level: number;
  priceCents: number;
  createdAt: string;
}

export interface VaultCurveRecycle {
  /** Put back into the buy budget so far, cents (custodian-confirmed only). */
  recycledCents: number;
  /** Routed to the custodian, not yet confirmed there, cents. */
  pendingCents: number;
  /** Sales whose recycling the custodian refused or that wait for Crossly operations. */
  problems: number;
}

export interface VaultCurveOpsPause { at: string; reason: string | null }

export interface VaultCurvePool {
  id: string;
  bookKey: string;
  kind: VaultCurveKind;
  delta: number;
  feeBps: number;
  spotCents: number;
  startSpotCents: number;
  depth: number;
  units: number;
  cashCents: number;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  unitsBought: number;
  unitsSold: number;
  boughtCents: number;
  soldCents: number;
  /** Units at the curve bid plus the buy budget. */
  valueCents: number;
  /** active | paused | closed */
  status: string;
  /** quoting | one_sided | idle | paused | closed */
  state: string;
  stateReason: string | null;
  /** Opt-in: sale proceeds go back into the buy budget once the custodian confirms they landed in your account. */
  recycleProceeds?: boolean;
  recycle?: VaultCurveRecycle;
  /** Set while Crossly operations hold the pool paused (only they can lift it). */
  opsPause?: VaultCurveOpsPause | null;
  ladder: VaultCurveLadder;
  legs: VaultCurvePoolLeg[];
  checkedAt: string | null;
  createdAt: string;
  closedAt: string | null;
}

export interface VaultCurvePoolList { data: VaultCurvePool[] }

export interface VaultCurvePoolFill {
  orderId: string;
  side: 'bid' | 'ask';
  priceCents: number;
  spotAfterCents: number | null;
  at: string;
}

export interface VaultCurvePoolFillList { data: VaultCurvePoolFill[] }

export interface VaultCurveSettings {
  kind: VaultCurveKind;
  spotCents: number;
  /** linear: cents a step; exponential: basis points a step. */
  delta: number;
  feeBps?: number;
  depth?: number;
  units?: number;
  cashCents?: number;
  minPriceCents?: number | null;
  maxPriceCents?: number | null;
}

export interface CreateVaultCurvePoolBody extends VaultCurveSettings {
  bookKey: string;
  /** Opt-in proceeds recycling (default false). */
  recycleProceeds?: boolean;
}

export interface UpdateVaultCurvePoolBody {
  spotCents?: number;
  delta?: number;
  feeBps?: number;
  depth?: number;
  units?: number;
  cashCents?: number;
  minPriceCents?: number | null;
  maxPriceCents?: number | null;
  status?: 'active' | 'paused';
  recycleProceeds?: boolean;
}

export class VaultMarketsCurvePoolsResource {
  constructor(private http: HttpClient) {}

  /** Your curve pools: open (default) or all. */
  list(status: 'open' | 'all' = 'open') {
    return this.http.request<VaultCurvePoolList>({ method: 'GET', path: '/v1/vault-markets/dealer/pools', query: { status } });
  }

  /** Open a curve pool on a key; its ladder goes up at once. Approved dealers only. */
  create(body: CreateVaultCurvePoolBody, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultCurvePool>({ method: 'POST', path: '/v1/vault-markets/dealer/pools', body, idempotencyKey: opts.idempotencyKey });
  }

  /** The ladder a set of curve settings would show. Places nothing. */
  preview(body: VaultCurveSettings) {
    return this.http.request<VaultCurvePreview>({ method: 'POST', path: '/v1/vault-markets/dealer/pools/preview', body });
  }

  /** One of your pools, with its ladder and live legs. */
  get(id: string) {
    const pid = encodeURIComponent(id);
    return this.http.request<VaultCurvePool>({ method: 'GET', path: `/v1/vault-markets/dealer/pools/${pid}` });
  }

  /** Re-price, top up, pause or resume a pool. */
  update(id: string, body: UpdateVaultCurvePoolBody, opts: IdempotencyOpts = {}) {
    const pid = encodeURIComponent(id);
    return this.http.request<VaultCurvePool>({ method: 'PATCH', path: `/v1/vault-markets/dealer/pools/${pid}`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Close a pool: its legs come off the book. */
  close(id: string, opts: IdempotencyOpts = {}) {
    const pid = encodeURIComponent(id);
    return this.http.request<VaultCurvePool>({ method: 'POST', path: `/v1/vault-markets/dealer/pools/${pid}/close`, body: {}, idempotencyKey: opts.idempotencyKey });
  }

  /** A pool's fills, newest first. */
  fills(id: string, limit = 100) {
    const pid = encodeURIComponent(id);
    return this.http.request<VaultCurvePoolFillList>({ method: 'GET', path: `/v1/vault-markets/dealer/pools/${pid}/fills`, query: { limit } });
  }
}
