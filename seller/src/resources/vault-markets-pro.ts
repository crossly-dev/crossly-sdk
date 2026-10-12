import type { HttpClient, IdempotencyOpts, JsonObject } from './_shared.js';

// ─── Vault Markets pro: the order book on vault items, for professionals ────
//
// `client.vaultMarkets.pro`. Orders of every type and time in force on a book
// key (`variantId:condition:gradeKey`), an order event log you can replay from
// any sequence number, two-sided market-maker quotes kept alive by heartbeat,
// and market data. Every money field is integer CENTS of US dollars. Reads
// need `vault-markets:read`, anything that places or cancels
// `vault-markets:trade`.
//
// A pre-trade refusal is a 400 with `error.details.code === 'order_rejected'`
// and the reason as the message. A halted key (circuit breaker, ops or kill
// switch) answers 409 with `error.details.code === 'halted'`.
//
// The live market stream (`GET /v1/vault-markets/pro/stream`) is a
// text/event-stream that stays open, so it has no method here: read it with
// `fetch` or an EventSource. `snapshot()` is its first event, on demand.

export type ProOrderSide = 'buy' | 'sell';
export type ProOrderType = 'limit' | 'market' | 'stop' | 'stop_limit';
export type ProTimeInForce = 'gtc' | 'gtd' | 'ioc' | 'fok';
export type ProAlgo = 'twap' | 'vwap';
export type ProFunding = 'card' | 'custodian';
export type ProCandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
export type ProOrderStatus = 'pending_trigger' | 'working' | 'partially_filled' | 'filled' | 'cancelled' | 'expired' | 'rejected';

export interface ProDepth {
  bids: Array<{ priceCents: number; units: number }>;
  /** `vaultUnits` = asks that are authenticated vault stock (instant settlement). */
  asks: Array<{ priceCents: number; units: number; vaultUnits: number }>;
  bestBidCents: number | null;
  bestAskCents: number | null;
  spreadCents: number | null;
  bidUnits: number;
  askUnits: number;
}

export interface ProTrade {
  id: string;
  priceCents: number;
  makerSide: string | null;
  takerSide: string | null;
  at: string;
}

export interface ProStats {
  openCents: number | null;
  lastCents: number | null;
  highCents: number | null;
  lowCents: number | null;
  volumeUnits: number;
  notionalCents: number;
  changeBps: number | null;
}

export interface ProCandle {
  /** Bucket start, epoch milliseconds. */
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  /** Units traded. */
  v: number;
}

export interface ProSnapshot {
  bookKey: string;
  depth: ProDepth;
  trades: ProTrade[];
  stats: ProStats;
  markCents: number | null;
  halt: { reason: string; until: string | null } | null;
}

export interface ProOrder {
  id: string;
  clientOrderId: string | null;
  source: string;
  bookKey: string;
  side: ProOrderSide;
  type: ProOrderType;
  tif: ProTimeInForce;
  postOnly: boolean;
  quantity: number;
  filledQuantity: number;
  avgFillCents: number | null;
  limitCents: number | null;
  stopCents: number | null;
  displayQuantity: number | null;
  algo: ProAlgo | null;
  algoEndsAt: string | null;
  funding: ProFunding | null;
  status: ProOrderStatus;
  rejectReason: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** The firm sub-account's holder account it is booked to; null = your own account. */
  holderAccountId?: string | null;
  /** On a key that trades in call auctions: the next call this open order waits for (null otherwise). */
  waitsForCall?: JsonObject | null;
}

export interface ProOrderDetail extends ProOrder {
  events: JsonObject[];
}

export interface PlaceProOrderBody {
  bookKey: string;
  side: ProOrderSide;
  /** Default `limit`. `market` is protected and IOC. */
  type?: ProOrderType;
  /** Default `gtc`. `gtd` needs `expiresAt`. */
  tif?: ProTimeInForce;
  /** Units, 1 to 50. */
  quantity: number;
  /** Price limit, in cents (limit and stop-limit). */
  limitCents?: number;
  /** Trigger price, in cents (stop and stop-limit). */
  stopCents?: number;
  /** Rest only as a maker; refused if it would take. */
  postOnly?: boolean;
  /** Iceberg: units shown on the book at a time. */
  displayQuantity?: number;
  /** ISO time a `gtd` order expires. */
  expiresAt?: string;
  /** Work the order over time: `twap` evenly, `vwap` with volume. */
  algo?: ProAlgo;
  /** ISO time the algo window ends. */
  algoEndsAt?: string;
  /** How a buy is paid: a saved `card`, or your `custodian` account. */
  funding?: ProFunding;
  /** The saved card for a card-funded buy. */
  stripePaymentMethodId?: string;
  /** Your own id; placing twice with it returns the first order. */
  clientOrderId?: string;
  /**
   * Trade for a firm sub-account you may trade (from `vaultMarkets.inst.accounts()`):
   * your role, the entity's KYB, the sub-account's limits and any firm halt are
   * checked; a buy pays from the sub-account's custodian account and lands in it.
   */
  subaccountId?: string;
}

export interface ReplaceProOrderBody {
  limitCents?: number;
  quantity?: number;
  stopCents?: number;
}

export interface ProOrdersParams {
  /** `open` (default) or `done`. */
  status?: 'open' | 'done';
  bookKey?: string;
  limit?: number;
  /** Only orders booked to this sub-account. */
  subaccountId?: string;
}

export interface ProQuoteSide {
  /** In cents. */
  priceCents: number;
  quantity: number;
}

export interface SetProQuoteBody {
  bookKey: string;
  bid?: ProQuoteSide;
  ask?: ProQuoteSide;
  /** Default true: heartbeat at least every 30 s or the quote is pulled. */
  cancelOnDisconnect?: boolean;
  funding?: ProFunding;
  stripePaymentMethodId?: string;
}

export interface ProQuoteResult {
  bookKey: string;
  bid: { orderId: string | null; error: string | null };
  ask: { orderId: string | null; error: string | null };
}

export class VaultMarketsProResource {
  constructor(private http: HttpClient) {}

  /** Depth (20 levels a side), the last 50 trades, 24 h stats, mark and any halt, in one call. */
  snapshot(bookKey: string) {
    return this.http.request<ProSnapshot>({ method: 'GET', path: '/v1/vault-markets/pro/snapshot', query: { bookKey } });
  }

  /** The L2 depth ladder, best first. */
  depth(bookKey: string) {
    return this.http.request<ProDepth>({ method: 'GET', path: '/v1/vault-markets/pro/depth', query: { bookKey } });
  }

  /** The latest trades, newest first. */
  tape(bookKey: string) {
    return this.http.request<{ data: ProTrade[] }>({ method: 'GET', path: '/v1/vault-markets/pro/tape', query: { bookKey } });
  }

  /** 24 h open, high, low, last, volume and change. */
  stats(bookKey: string) {
    return this.http.request<ProStats>({ method: 'GET', path: '/v1/vault-markets/pro/stats', query: { bookKey } });
  }

  /** OHLCV candles from the trades; `from` is epoch ms (default: the last 300 intervals). */
  candles(bookKey: string, params: { interval?: ProCandleInterval; from?: number } = {}) {
    return this.http.request<{ data: ProCandle[]; meta: { interval: ProCandleInterval } }>({ method: 'GET', path: '/v1/vault-markets/pro/candles', query: { bookKey, ...params } });
  }

  /** Place an order. Idempotent on `clientOrderId`. */
  placeOrder(body: PlaceProOrderBody, opts: IdempotencyOpts = {}) {
    return this.http.request<ProOrder>({ method: 'POST', path: '/v1/vault-markets/pro/orders', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your orders: open (default) or done, optionally on one book key. */
  orders(params: ProOrdersParams = {}) {
    return this.http.request<{ data: ProOrder[] }>({ method: 'GET', path: '/v1/vault-markets/pro/orders', query: params });
  }

  /** One order with its full event log. */
  order(id: string) {
    return this.http.request<ProOrderDetail>({ method: 'GET', path: `/v1/vault-markets/pro/orders/${encodeURIComponent(id)}` });
  }

  /** Cancel an order; what filled stays filled. */
  cancelOrder(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<ProOrder>({ method: 'POST', path: `/v1/vault-markets/pro/orders/${encodeURIComponent(id)}/cancel`, idempotencyKey: opts.idempotencyKey });
  }

  /** Amend price, stop or quantity (cancel-replace: it re-queues at its new price). */
  replaceOrder(id: string, body: ReplaceProOrderBody, opts: IdempotencyOpts = {}) {
    return this.http.request<ProOrder>({ method: 'POST', path: `/v1/vault-markets/pro/orders/${encodeURIComponent(id)}/replace`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Cancel every open order, or every one on a book key. */
  cancelAll(bookKey?: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ cancelled: number }>({ method: 'POST', path: '/v1/vault-markets/pro/orders/cancel-all', body: bookKey ? { bookKey } : {}, idempotencyKey: opts.idempotencyKey });
  }

  /** Your order event log after a sequence number: a replayable drop copy. */
  events(params: { after?: number; limit?: number } = {}) {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/pro/events', query: params });
  }

  /** Set a two-sided post-only quote on a book key (replaces the last one). */
  setQuote(body: SetProQuoteBody, opts: IdempotencyOpts = {}) {
    return this.http.request<ProQuoteResult>({ method: 'POST', path: '/v1/vault-markets/pro/quotes', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your live quotes. */
  quotes() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/pro/quotes' });
  }

  /** Pull your quote on a book key, or every quote. */
  pullQuotes(bookKey?: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ pulled: number }>({ method: 'DELETE', path: '/v1/vault-markets/pro/quotes', query: bookKey ? { bookKey } : undefined, idempotencyKey: opts.idempotencyKey });
  }

  /** Keep cancel-on-disconnect quotes alive; call at least every 30 s. */
  heartbeat() {
    return this.http.request<{ quotes: number; at: string }>({ method: 'POST', path: '/v1/vault-markets/pro/quotes/heartbeat' });
  }

  /** Your daily market-maker liquidity rewards (paid in CBX). */
  rewards() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/pro/rewards' });
  }
}
