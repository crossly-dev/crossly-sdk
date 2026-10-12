import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Vault Markets: the shopping agent's watches and drafted orders ─────────
//
// `client.vaultMarkets.agent`. A watch tells you once when a book key's best
// bid, lowest ask, last trade or market price crosses a price; it never
// trades. A draft is a limit order the shopping agent drafted: it places
// nothing. Place one by sending its `orderBody` to
// `client.vaultMarkets.pro.placeOrder` (POST /v1/vault-markets/pro/orders);
// its clientOrderId makes that idempotent and marks the draft placed. Money
// fields are integer CENTS of US dollars.

export type VaultWatchMetric = 'bid' | 'ask' | 'last' | 'mark';

export interface VaultAgentWatch {
  id: string;
  bookKey: string;
  /** The item and grade as named when it was set. */
  label: string | null;
  metric: VaultWatchMetric;
  direction: 'above' | 'below';
  thresholdCents: number;
  /** What the watched number was when last looked at. */
  lastCents: number | null;
  status: 'live' | 'fired' | 'cancelled' | 'expired';
  firedAt: string | null;
  firedCents: number | null;
  sessionId: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface VaultAgentWatchList {
  data: VaultAgentWatch[];
}

export interface CreateVaultAgentWatchBody {
  bookKey: string;
  metric: VaultWatchMetric;
  /** Leave out for "crosses": whichever way the number has to move to reach the price. */
  direction?: 'above' | 'below';
  thresholdCents: number;
}

export interface VaultAgentWatchCreated {
  watch: VaultAgentWatch;
  currentCents: number | null;
  /** Already past the price when set: it fires on the next crossing, not now. */
  alreadyPast: boolean;
}

export interface VaultAgentDraftOrderBody {
  bookKey: string;
  side: 'buy' | 'sell';
  type: 'limit';
  tif: 'gtc';
  quantity: number;
  limitCents: number;
  funding?: 'card' | 'custodian';
  stripePaymentMethodId?: string;
  clientOrderId: string;
}

export interface VaultAgentDraft {
  id: string;
  bookKey: string;
  title: string;
  side: 'buy' | 'sell';
  quantity: number;
  limitCents: number;
  notionalCents: number;
  funding: 'card' | 'custodian' | 'vault';
  cardLabel: string | null;
  markCents: number | null;
  bestBidCents: number | null;
  bestAskCents: number | null;
  marketable: boolean;
  status: 'drafted' | 'placing' | 'placed' | 'rejected' | 'cancelled' | 'expired';
  orderId: string | null;
  rejectReason: string | null;
  expiresAt: string;
  notes: string[];
  marketHref: string;
  /** Send this to POST /v1/vault-markets/pro/orders to place the draft. */
  orderBody: VaultAgentDraftOrderBody;
  completeWith: string;
}

export interface VaultAgentDraftList {
  data: VaultAgentDraft[];
}

export interface VaultAgentDraftCancelled {
  ok: boolean;
  draft: VaultAgentDraft | null;
}

export class VaultMarketsAgentResource {
  constructor(private http: HttpClient) {}

  /** Your price watches, live first (`live: true` for live only). */
  watches(opts: { live?: boolean } = {}) {
    return this.http.request<VaultAgentWatchList>({ method: 'GET', path: '/v1/vault-markets/agent/watches', query: opts.live ? { live: 'true' } : undefined });
  }

  /** Watch a book key's best bid, lowest ask, last trade or market price for a crossing of a price in cents. Never trades. */
  createWatch(body: CreateVaultAgentWatchBody, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultAgentWatchCreated>({ method: 'POST', path: '/v1/vault-markets/agent/watches', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Cancel a live price watch. */
  cancelWatch(watchId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultAgentWatch>({ method: 'DELETE', path: `/v1/vault-markets/agent/watches/${encodeURIComponent(watchId)}`, idempotencyKey: opts.idempotencyKey });
  }

  /** Limit orders the shopping agent drafted for you, newest first. */
  drafts() {
    return this.http.request<VaultAgentDraftList>({ method: 'GET', path: '/v1/vault-markets/agent/drafts' });
  }

  /** One drafted order, with the orderBody that places it. */
  draft(draftId: string) {
    return this.http.request<VaultAgentDraft>({ method: 'GET', path: `/v1/vault-markets/agent/drafts/${encodeURIComponent(draftId)}` });
  }

  /** Throw a drafted order away (only while it is still a draft). */
  cancelDraft(draftId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultAgentDraftCancelled>({ method: 'POST', path: `/v1/vault-markets/agent/drafts/${encodeURIComponent(draftId)}/cancel`, idempotencyKey: opts.idempotencyKey });
  }
}
