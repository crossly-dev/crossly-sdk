import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Vault Markets: Simple and Pro modes, and "What's it worth" ────────────
//
// `client.vaultMarkets.mode`. The mode is a display preference remembered
// for you on the web and in the app: `simple` (buy, sell and what it is
// worth) or `pro` (the full terminal). New people start in simple; people
// already trading start in pro. "What's it worth" reads the book's own
// numbers: the mark and its quality, what Instant Exit would pay for one unit
// now, and your units. Nothing here places an order or moves money. Money
// fields are integer CENTS of US dollars.

export type VaultMarketsModeName = 'simple' | 'pro';

export interface VaultMarketsModeView {
  mode: VaultMarketsModeName;
  /** `chosen` by you, or `default` (set for you once, on first read). */
  source: 'chosen' | 'default';
  /** When it was written (ISO). */
  at: string;
  signedIn: boolean;
  /** One sentence on what each mode shows. */
  explain: Record<VaultMarketsModeName, string>;
}

/** A mark's quality: A from trades, B from firm quotes, C indicative, `none` no market price yet. */
export type VaultKeyWorthQuality = 'A' | 'B' | 'C' | 'none';

export interface VaultKeyWorthMark {
  cents: number | null;
  quality: VaultKeyWorthQuality;
  confidenceBps: number | null;
  /** ± band around the mark, in cents. */
  bandCents: number | null;
  asOf: string | null;
  seasoned: boolean;
  usableForRisk: boolean;
  impliedFrom: { label: string } | null;
}

export interface VaultKeyWorthExit {
  available: boolean;
  /** The best resting bid (yours left out): what one unit sells for right now. */
  bestBidCents: number | null;
  shareOfMarkBps: number | null;
  unitsAtBest: number;
  dealerBid: boolean;
  /** The lowest share of the mark Instant Exit sells at on this key. */
  floorBps: number;
  reason: string | null;
}

export interface VaultKeyWorthSellNow {
  proceedsCents: number;
  units: number;
  lowestCents: number | null;
}

export interface VaultKeyWorthMine {
  units: number;
  sellableUnits: number;
  /** The unit Instant Exit would sell first (your oldest free one), or null. */
  sellUnitId: string | null;
  sellableUnitIds: string[];
  atMarkCents: number | null;
  sellNow: VaultKeyWorthSellNow | null;
}

export interface VaultKeyWorth {
  bookKey: string;
  mark: VaultKeyWorthMark;
  instantExit: VaultKeyWorthExit;
  mine: VaultKeyWorthMine | null;
  /** Plain words; repeat them rather than paraphrasing them away. */
  headline: string;
  lines: string[];
}

export interface VaultWholeWorthSplit {
  reliableCents: number;
  indicativeCents: number;
  unmarkedUnits: number;
}

export interface VaultWholeWorthToday {
  since: string | null;
  previousCents: number | null;
  changeCents: number | null;
  changeBps: number | null;
}

export interface VaultWholeWorthSellNow {
  proceedsCents: number;
  units: number;
  unplacedUnits: number;
  keys: number;
  blocked: Array<{ bookKey: string; reason: string }>;
  note: string;
}

export interface VaultWholeWorth {
  asOf: string;
  valueCents: number;
  vaultCents: number;
  onLoanCents: number;
  positionsCents: number;
  units: number;
  unitsOnLoan: number;
  marks: VaultWholeWorthSplit;
  costCents: number;
  pnlCents: number;
  today: VaultWholeWorthToday;
  sellNow: VaultWholeWorthSellNow;
  note: string;
}

export class VaultMarketsModeResource {
  constructor(private http: HttpClient) {}

  /** Your mode: simple or pro, and whether you chose it. */
  get() {
    return this.http.request<VaultMarketsModeView>({ method: 'GET', path: '/v1/vault-markets/mode' });
  }

  /** Choose simple or pro. Remembered on the web and in the app; a display preference only. */
  set(mode: VaultMarketsModeName, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultMarketsModeView>({ method: 'PUT', path: '/v1/vault-markets/mode', body: { mode }, idempotencyKey: opts.idempotencyKey });
  }

  /** What one book key is worth: mark and quality, Instant Exit now, and your units. */
  worth(bookKey: string) {
    return this.http.request<VaultKeyWorth>({ method: 'GET', path: '/v1/vault-markets/worth', query: { bookKey } });
  }

  /** What your whole vault is worth now, and a sell-now estimate from today's bids. */
  vaultWorth() {
    return this.http.request<VaultWholeWorth>({ method: 'GET', path: '/v1/vault-markets/worth/vault' });
  }
}
