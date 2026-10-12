import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Vault Markets fees by role, quote requests, blocks, market makers ─────
//
// `client.vaultMarkets.mm`. Fees follow the role: the resting order pays the
// maker rate, the order that fills against it the taker rate; a buyer's fee
// is added ON TOP of the price, a seller's comes out of the proceeds, and
// Crossly always keeps at least its 2% net floor. Quote requests (RFQ) are
// anonymous and all-to-all: answers are firm for 60 seconds and taking one
// fills it as a block through the normal fill path. Market-maker rebates are
// paid only out of fees Crossly already took on that key that month. Money is
// integer CENTS of US dollars; rates and shares are basis points (100 = 1%).
// A book key is `variantId:condition:gradeKey` (grade "-" when ungraded).

export type VaultFeeRole = 'maker' | 'taker';
export type VaultFeeProgram = 'retail' | 'volume' | 'lp' | 'dmm';

export interface VaultFeeSide {
  role: VaultFeeRole;
  program: VaultFeeProgram;
  rateBps: number;
  /** Crossly One trim, per unit, already taken off. */
  trimCents: number;
  perUnitCents: number;
  totalCents: number;
}

export interface VaultFeeQuote {
  bookKey: string;
  side: 'buy' | 'sell';
  priceCents: number;
  quantity: number;
  maker: VaultFeeSide;
  taker: VaultFeeSide;
  floorBps: number;
  /** True for a buyer: the fee is added to the price. */
  paidOnTop: boolean;
  programs: { lp: boolean; dmm: boolean; volumeTier: boolean; memberTier: string | null };
}

export interface VaultFeeSchedule {
  floorBps: number;
  schedule: Record<VaultFeeProgram, Record<VaultFeeRole, number>>;
  volumeTierCents: number;
  cbxDiscountBps: number;
  referralShareBps: number;
  referralDays: number;
  note: string;
}

export interface VaultRfqResponse {
  id: string;
  priceCents: number;
  quantity: number;
  /** live | accepted | filled | expired | withdrawn | failed | lost */
  status: string;
  expiresAt: string;
  createdAt: string;
  mine?: boolean;
}

export interface VaultRfq {
  id: string;
  bookKey: string;
  key: { variantId: string; condition: string; gradeKey: string | null } | null;
  side: 'buy' | 'sell';
  quantity: number;
  /** open | filling | filled | expired | cancelled | failed */
  status: string;
  expiresAt: string;
  createdAt: string;
  closedAt: string | null;
  /** The requester's own fields. */
  limitCents?: number | null;
  funding?: string | null;
  blockId?: string | null;
  failReason?: string | null;
  responses?: VaultRfqResponse[];
}

export interface VaultRfqInboxItem extends VaultRfq {
  /** dealer | dmm | lp | holder */
  invitedAs: string;
  myAnswer: VaultRfqResponse | null;
}

export interface VaultRfqAccepted {
  blockId: string | null;
  filled: number;
  tradeIds: string[];
  reason: string | null;
  rfq: VaultRfq;
}

export interface OpenVaultRfqBody {
  bookKey: string;
  side: 'buy' | 'sell';
  quantity: number;
  /** Your worst price per unit in cents; never shown to responders. */
  limitCents?: number;
  /** 30-600 seconds (default 120). */
  ttlSeconds?: number;
  /** A buy: pay by saved card or from the Vault Markets custodian account. */
  funding?: 'card' | 'custodian';
  stripePaymentMethodId?: string;
}

export interface VaultMidpointOrder {
  id: string;
  bookKey: string;
  side: 'buy' | 'sell';
  quantity: number;
  minQuantity: number;
  filledQuantity: number;
  limitCents: number | null;
  funding: string;
  /** open | filled | cancelled | expired */
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface PlaceVaultMidpointBody {
  bookKey: string;
  side: 'buy' | 'sell';
  quantity: number;
  /** The smallest block to match with (default 1). */
  minQuantity?: number;
  limitCents?: number;
  funding?: 'card' | 'custodian';
  stripePaymentMethodId?: string;
  /** 1-720 hours (default 24). */
  hours?: number;
}

export interface VaultMmProgram {
  id: string;
  program: 'lp' | 'dmm';
  bookKey: string;
  key: { variantId: string; condition: string; gradeKey: string | null } | null;
  /** applied | active | suspended | revoked | left */
  status: string;
  meeting: boolean;
  /** LP: basic | plus. */
  level: string | null;
  displayName: string | null;
  appliedAt: string;
  approvedAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
}

export interface VaultMmObligationDay {
  day: string;
  bookKey: string;
  program: 'lp' | 'dmm';
  tier: string | null;
  samples: number;
  inSpread: number;
  inHalfSpread: number;
  callsTotal: number;
  callsJoined: number;
  rfqInvited: number;
  rfqAnsweredFast: number;
  met: boolean | null;
  level: string | null;
  coverageBps: number | null;
  coveragePct: number | null;
  reasons: string[] | null;
}

export interface VaultMmRebate {
  id: string;
  /** YYYY-MM */
  period: string;
  bookKey: string;
  program: string;
  cents: number;
  /** accrued | paid | void */
  status: string;
  paidAt: string | null;
}

export interface VaultMmView {
  programs: VaultMmProgram[];
  obligations: VaultMmObligationDay[];
  rebates: VaultMmRebate[];
  rules: Record<string, unknown>;
}

export interface VaultKeyMakers {
  bookKey: string;
  dmm: { name: string; meeting: boolean } | null;
  lpCount: number;
}

export interface VaultMmpSettings {
  enabled: boolean;
  windowSeconds: number;
  maxUnits: number | null;
  maxNotionalCents: number | null;
  freezeSeconds: number;
  frozen: boolean;
  frozenUntil: string | null;
  trips: number;
  lastTripAt: string | null;
}

export interface SetVaultMmpBody {
  enabled: boolean;
  /** 1-300 seconds. */
  windowSeconds?: number;
  maxUnits?: number | null;
  maxNotionalCents?: number | null;
  /** 1-3600 seconds. */
  freezeSeconds?: number;
}

export interface VaultMassCancelResult {
  orders: number;
  legs: number;
}

export interface VaultList<T> {
  data: T[];
}

export type VaultRfqList = VaultList<VaultRfq>;
export type VaultRfqInboxList = VaultList<VaultRfqInboxItem>;
export type VaultMidpointList = VaultList<VaultMidpointOrder>;

export class VaultMarketsMmResource {
  constructor(private http: HttpClient) {}

  /* Fees */

  /** The fee schedule by role (retail, 30-day volume, LP, DMM), the CBX discount, the referral share and the 2% net floor. */
  feeSchedule() {
    return this.http.request<VaultFeeSchedule>({ method: 'GET', path: '/v1/vault-markets/fees/schedule' });
  }

  /** Your fee for an order at a price, as maker and as taker. A buyer's fee is added to the price; a seller's comes out of the proceeds. */
  feeQuote(input: { bookKey: string; side: 'buy' | 'sell'; priceCents: number; quantity?: number }) {
    return this.http.request<VaultFeeQuote>({ method: 'GET', path: '/v1/vault-markets/fees/quote', query: { bookKey: input.bookKey, side: input.side, priceCents: input.priceCents, quantity: input.quantity } });
  }

  /* Quote requests */

  /** Ask dealers, the key's DMM and LPs, and holders for a firm price on a block. Anonymous; answers are firm for 60 s. */
  openRfq(body: OpenVaultRfqBody, opts: IdempotencyOpts = {}) {
    return this.http.request<{ id: string; expiresAt: string; invited: number }>({ method: 'POST', path: '/v1/vault-markets/rfq', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your quote requests, newest first. */
  listRfqs() {
    return this.http.request<VaultRfqList>({ method: 'GET', path: '/v1/vault-markets/rfq' });
  }

  /** Open quote requests you were sent (as a dealer, DMM, LP or holder), with your live answer. */
  rfqInbox() {
    return this.http.request<VaultRfqInboxList>({ method: 'GET', path: '/v1/vault-markets/rfq/inbox' });
  }

  /** Open quote requests on one key (all-to-all, anonymous). */
  openRfqsOnKey(bookKey: string) {
    return this.http.request<VaultRfqList>({ method: 'GET', path: '/v1/vault-markets/rfq/open', query: { bookKey } });
  }

  /** One quote request: the requester sees every answer; a responder sees the request and their own answer. */
  getRfq(id: string) {
    const rid = encodeURIComponent(id);
    return this.http.request<VaultRfq>({ method: 'GET', path: `/v1/vault-markets/rfq/${rid}` });
  }

  /** Answer a quote request for the full quantity at a firm price (cents per unit), good for 60 s. A new answer replaces your old one. */
  respondRfq(id: string, priceCents: number, opts: IdempotencyOpts = {}) {
    const rid = encodeURIComponent(id);
    return this.http.request<VaultRfqResponse>({ method: 'POST', path: `/v1/vault-markets/rfq/${rid}/respond`, body: { priceCents }, idempotencyKey: opts.idempotencyKey });
  }

  /** Take one answer to your request: it fills as a block (fees by role, self-trade prevention, halts, LULD). */
  acceptRfq(id: string, responseId: string, opts: IdempotencyOpts = {}) {
    const rid = encodeURIComponent(id);
    return this.http.request<VaultRfqAccepted>({ method: 'POST', path: `/v1/vault-markets/rfq/${rid}/accept`, body: { responseId }, idempotencyKey: opts.idempotencyKey });
  }

  /** Cancel your open quote request. */
  cancelRfq(id: string, opts: IdempotencyOpts = {}) {
    const rid = encodeURIComponent(id);
    return this.http.request<VaultRfq>({ method: 'POST', path: `/v1/vault-markets/rfq/${rid}/cancel`, body: {}, idempotencyKey: opts.idempotencyKey });
  }

  /** Withdraw your live answer to a quote request. */
  withdrawRfqResponse(responseId: string, opts: IdempotencyOpts = {}) {
    const rid = encodeURIComponent(responseId);
    return this.http.request<VaultRfqResponse>({ method: 'POST', path: `/v1/vault-markets/rfq/responses/${rid}/withdraw`, body: {}, idempotencyKey: opts.idempotencyKey });
  }

  /* Midpoint blocks */

  /** Your midpoint block orders. */
  listMidpoints() {
    return this.http.request<VaultMidpointList>({ method: 'GET', path: '/v1/vault-markets/midpoint' });
  }

  /** A hidden block order that trades only at the firm-book midpoint, against another of at least your minimum size. */
  placeMidpoint(body: PlaceVaultMidpointBody, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultMidpointOrder>({ method: 'POST', path: '/v1/vault-markets/midpoint', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Cancel a midpoint order. */
  cancelMidpoint(id: string, opts: IdempotencyOpts = {}) {
    const mid = encodeURIComponent(id);
    return this.http.request<VaultMidpointOrder>({ method: 'POST', path: `/v1/vault-markets/midpoint/${mid}/cancel`, body: {}, idempotencyKey: opts.idempotencyKey });
  }

  /* Market makers */

  /** Your programmes, the last 30 days of obligations, rebates (paid only from fees already taken) and the rules. */
  programs() {
    return this.http.request<VaultMmView>({ method: 'GET', path: '/v1/vault-markets/mm' });
  }

  /** Join a key as a Registered Liquidity Provider (ID needed). */
  joinLp(bookKey: string, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultMmProgram>({ method: 'POST', path: '/v1/vault-markets/mm/lp', body: { bookKey }, idempotencyKey: opts.idempotencyKey });
  }

  /** Apply to be the designated market maker on a tier B or C key. Crossly approves; one per key. */
  applyDmm(input: { bookKey: string; displayName?: string; note?: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultMmProgram>({ method: 'POST', path: '/v1/vault-markets/mm/dmm', body: input, idempotencyKey: opts.idempotencyKey });
  }

  /** Leave a market-maker programme. */
  leaveProgram(id: string, opts: IdempotencyOpts = {}) {
    const pid = encodeURIComponent(id);
    return this.http.request<VaultMmProgram>({ method: 'POST', path: `/v1/vault-markets/mm/${pid}/leave`, body: {}, idempotencyKey: opts.idempotencyKey });
  }

  /** A key's designated market maker (by its chosen name) and how many LPs quote it. */
  keyMakers(bookKey: string) {
    return this.http.request<VaultKeyMakers>({ method: 'GET', path: '/v1/vault-markets/mm/key', query: { bookKey } });
  }

  /** Your market-maker protection settings and whether you are frozen now. */
  mmp() {
    return this.http.request<VaultMmpSettings>({ method: 'GET', path: '/v1/vault-markets/mm/mmp' });
  }

  /** Set market-maker protection: N units or $X filled on your quotes within T seconds pulls every quote and freezes quoting. */
  setMmp(body: SetVaultMmpBody, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultMmpSettings>({ method: 'PUT', path: '/v1/vault-markets/mm/mmp', body, idempotencyKey: opts.idempotencyKey });
  }

  /** End a market-maker protection freeze early. */
  resetMmp(opts: IdempotencyOpts = {}) {
    return this.http.request<VaultMmpSettings>({ method: 'POST', path: '/v1/vault-markets/mm/mmp/reset', body: {}, idempotencyKey: opts.idempotencyKey });
  }

  /** Cancel every open order (optionally one key, or only quotes) and every resting leg in one statement. */
  massCancel(input: { bookKey?: string; quotesOnly?: boolean } = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultMassCancelResult>({ method: 'POST', path: '/v1/vault-markets/mm/mass-cancel', body: input, idempotencyKey: opts.idempotencyKey });
  }
}
