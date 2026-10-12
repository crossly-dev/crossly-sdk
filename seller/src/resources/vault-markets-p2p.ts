import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Vault Markets P2P loans: borrow from (and lend to) other collectors ─────
//
// `client.vaultMarkets.p2p`. Blend-style perpetual loans: a lender offers
// cents at an APR (bps a year) against an item (book key) or one unit; a
// borrower pledges a stored vault unit and the custodian pays lender →
// borrower. No oracle, no liquidation, no pool: the loan runs until the
// lender calls it (and can take the call back until a takeover), then any
// other lender can take it over in a ~30 hour refinancing auction whose rate
// climbs to the ceiling. The borrower can repay in part (interest first, then
// principal) and can open their own auction to find a cheaper lender. Repaid or refinanced,
// the lender is paid in full; neither by the end, the unit moves to the
// lender's vault. Money moves only by custodian instruction between the two
// users' own accounts. Every money field is integer CENTS of US dollars.
// Reads need `vault-markets:read`, anything that moves money `vault-markets:trade`.

export type P2pLoanStatus = 'funding' | 'active' | 'auction' | 'repaying' | 'refinancing' | 'refi_pending' | 'repaid' | 'refinanced' | 'foreclosed' | 'cancelled';
export type P2pRole = 'borrower' | 'lender' | 'any';

export interface P2pOffer {
  id: string;
  bookKey: string | null;
  vaultItemId: string | null;
  kind: 'item' | 'unit';
  principalCents: number;
  aprBps: number;
  dailyInterestCents: number;
  maxLoans: number;
  loansTaken: number;
  loansLeft: number;
  status: 'open' | 'filled' | 'cancelled' | 'expired';
  closeReason: string | null;
  note: string | null;
  expiresAt: string | null;
  createdAt: string;
  mine: boolean;
  name: string | null;
  label: string | null;
  imageUrl: string | null;
}

export interface P2pAuction {
  phase: 'running' | 'ended';
  rateBps: number | null;
  startAprBps: number | null;
  ceilingBps: number;
  calledAt: string | null;
  endsAt: string | null;
  msLeft: number | null;
  payoffNowCents: number | null;
}

export interface P2pLoanEvent { id: string; kind: 'fund' | 'repay' | 'refinance'; cents: number; interestCents: number; status: 'pending' | 'booked' | 'void'; note: string | null; createdAt: string; bookedAt: string | null }

export interface P2pLoan {
  id: string;
  role: 'lender' | 'borrower' | 'viewer';
  status: P2pLoanStatus;
  closeReason: string | null;
  bookKey: string;
  vaultItemId: string;
  principalCents: number;
  aprBps: number;
  dailyInterestCents: number;
  /** What repays it now (live loans only). */
  owed: { principalCents: number; interestCents: number; totalCents: number } | null;
  payoffCents: number | null;
  interestPaidCents: number;
  /** Principal already paid back by part payments. */
  principalRepaidCents?: number;
  /** The smallest part payment accepted now (the interest owed, or $1), in cents; null when the loan is not live. */
  minRepayCents?: number | null;
  startedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  /** The lender's call: a refinancing auction whose rate climbs to the ceiling. */
  auction: P2pAuction | null;
  /** The borrower's own search for a cheaper lender: the rate climbs to just under the loan rate. */
  refiAuction?: P2pAuction | null;
  refinancedFromLoanId: string | null;
  refinancedToLoanId: string | null;
  /** Information only: no price ever triggers anything on a P2P loan. */
  markCents: number | null;
  markQuality: string | null;
  ltvBps: number | null;
  name: string | null;
  label: string | null;
  imageUrl: string | null;
  events?: P2pLoanEvent[];
}

export interface P2pUnit {
  vaultItemId: string;
  bookKey: string | null;
  name: string | null;
  imageUrl: string | null;
  eligible: boolean;
  reason: string | null;
  offers: P2pOffer[];
  loanId: string | null;
  loanStatus: string | null;
}

export interface P2pDashboard {
  gates: Record<string, { open: boolean; missing: string[] }>;
  termsVersion: string | null;
  rules: P2pRules;
  borrowing: { loans: number; owedCents: number; dailyInterestCents: number; called: number; searching?: number };
  lending: { loans: number; owedToYouCents: number; dailyInterestCents: number; called: number };
  offers: { open: number; loansLeft: number; cashOfferedCents: number };
}

export interface P2pRules {
  refinanceAuctionHours: number;
  maxAprBps: number;
  minPrincipalCents: number;
  maxPrincipalCents: number;
  callGraceHours: number;
  minPartialRepayCents?: number;
  refiAuctionMinHours?: number;
  refiAuctionMaxHours?: number;
  refiAuctionDefaultHours?: number;
}

export interface P2pRepayBody {
  /** Your own id for this call: a retry with the same id never pays twice. */
  requestId?: string;
  /** Omit to repay in full. Below what is owed: a part payment, interest first, then principal (at least the interest owed now and at least $1). Cents. */
  amountCents?: number;
}

export interface P2pRefiAuctionBody {
  /** Where the rate a new lender gets starts, bps a year, below the loan rate (default half of it). */
  startAprBps?: number;
  /** How long it runs, 1-72 hours (default 24). */
  hours?: number;
}

export interface P2pOfferList { data: P2pOffer[] }
export interface P2pLoanList { data: P2pLoan[] }
export interface P2pUnitList { data: P2pUnit[] }

export interface CreateP2pOfferBody {
  /** Lend against any unit of this item… */
  bookKey?: string;
  /** …or against this one unit. Exactly one of the two. */
  vaultItemId?: string;
  /** Per loan, in cents ($100 to $100,000). */
  principalCents: number;
  /** A year, in bps (at most the ceiling, 3600 = 36%). */
  aprBps: number;
  /** How many loans the offer funds (1-20; 1 for a unit offer). */
  maxLoans?: number;
  /** 1-90; default 90. */
  expiresInDays?: number;
  note?: string;
}

const id = (s: string) => encodeURIComponent(s);

export class VaultMarketsP2pResource {
  constructor(private http: HttpClient) {}

  /** Both sides at a glance, the gates and the rules. */
  dashboard() {
    return this.http.request<P2pDashboard>({ method: 'GET', path: '/v1/vault-markets/p2p/dashboard' });
  }

  /** The open offers book, lowest rate first (`bookKey` narrows to one item). */
  offers(params: { bookKey?: string; limit?: number } = {}) {
    return this.http.request<P2pOfferList>({ method: 'GET', path: '/v1/vault-markets/p2p/offers', query: params });
  }

  /** Your offers, newest first. */
  myOffers() {
    return this.http.request<P2pOfferList>({ method: 'GET', path: '/v1/vault-markets/p2p/offers/mine' });
  }

  /** Offer to lend. Nothing is held: the custodian pays from your account when a borrower takes it. */
  createOffer(body: CreateP2pOfferBody, opts: IdempotencyOpts = {}) {
    return this.http.request<P2pOffer>({ method: 'POST', path: '/v1/vault-markets/p2p/offers', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Withdraw an open offer (loans already taken carry on). */
  cancelOffer(offerId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<P2pOffer>({ method: 'POST', path: `/v1/vault-markets/p2p/offers/${id(offerId)}/cancel`, idempotencyKey: opts.idempotencyKey });
  }

  /** Borrow: take an offer against one of your stored units. `requestId` makes a retry safe. */
  take(offerId: string, body: { vaultItemId: string; requestId?: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<P2pLoan>({ method: 'POST', path: `/v1/vault-markets/p2p/offers/${id(offerId)}/take`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your units: pledgeable or why not, the best offers covering each, and its loan. */
  units() {
    return this.http.request<P2pUnitList>({ method: 'GET', path: '/v1/vault-markets/p2p/units' });
  }

  /** Your loans as borrower and/or lender; live by default. */
  loans(params: { role?: P2pRole; status?: 'live' | 'closed' | 'all' } = {}) {
    return this.http.request<P2pLoanList>({ method: 'GET', path: '/v1/vault-markets/p2p/loans', query: params });
  }

  /** One loan with its money log. */
  loan(loanId: string) {
    return this.http.request<P2pLoan>({ method: 'GET', path: `/v1/vault-markets/p2p/loans/${id(loanId)}` });
  }

  /** Borrower: repay in full (principal + interest to the second), or in part with `amountCents` (interest first). */
  repay(loanId: string, body: P2pRepayBody = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<P2pLoan>({ method: 'POST', path: `/v1/vault-markets/p2p/loans/${id(loanId)}/repay`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Lender: call the loan; the ~30 hour refinancing auction starts. */
  call(loanId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<P2pLoan>({ method: 'POST', path: `/v1/vault-markets/p2p/loans/${id(loanId)}/call`, idempotencyKey: opts.idempotencyKey });
  }

  /** Lender: take back your call before another lender has taken the loan over. */
  cancelCall(loanId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<P2pLoan>({ method: 'POST', path: `/v1/vault-markets/p2p/loans/${id(loanId)}/cancel-call`, idempotencyKey: opts.idempotencyKey });
  }

  /** Borrower: open your own refinancing auction to find a cheaper lender (nobody takes it, nothing changes). */
  openRefiAuction(loanId: string, body: P2pRefiAuctionBody = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<P2pLoan>({ method: 'POST', path: `/v1/vault-markets/p2p/loans/${id(loanId)}/refi-auction`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Borrower: stop looking for a cheaper lender. */
  cancelRefiAuction(loanId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<P2pLoan>({ method: 'POST', path: `/v1/vault-markets/p2p/loans/${id(loanId)}/refi-auction/cancel`, idempotencyKey: opts.idempotencyKey });
  }

  /** Running refinancing auctions (lender calls and borrower searches), soonest to end first. */
  auctions() {
    return this.http.request<P2pLoanList>({ method: 'GET', path: '/v1/vault-markets/p2p/auctions' });
  }

  /** Take over a loan in a refinancing auction by paying its lender off (refused above `maxPayoffCents`). */
  refinance(loanId: string, body: { requestId?: string; maxPayoffCents?: number } = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<P2pLoan>({ method: 'POST', path: `/v1/vault-markets/p2p/loans/${id(loanId)}/refinance`, body, idempotencyKey: opts.idempotencyKey });
  }
}
