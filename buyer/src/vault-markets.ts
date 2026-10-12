/**
 * Vault Markets, read only: "what is my vault worth".
 *
 * Built for agent wallets — an assistant holding a shopper's buyer token that
 * is asked what their vault holds and what it would fetch. Every method here
 * is a GET. Nothing places an order, takes an Instant Exit, lends or sells;
 * that happens on Crossly, with the person present.
 *
 * ── TWO NUMBERS, NEVER ONE ───────────────────────────────────────────
 * `worth()` returns the value AT THE MARKS (marks come only from trades on the
 * book) and, separately, a SELL-NOW estimate from the bids resting on the book
 * now. They answer different questions and must not be blended or rounded
 * into each other when you report them. A mark's `quality` matters too: A and
 * B are reliable, C is indicative (few recent trades), `none` means no price —
 * say "indicative" when you quote a C-marked value.
 *
 * Scopes: your own holdings, history, watchlist and Instant Exit quotes need
 * `buyer:orders:read`; indexes are market data and need `buyer:catalog:read`.
 */
import type { BuyerHttpClient } from './client.js';

/** A mark's quality: A / B reliable, C indicative, `none` = no market price yet. */
export type VaultMarkQuality = 'A' | 'B' | 'C' | 'none';

/** How much of a value rests on reliable vs indicative marks, and units with no mark. */
export interface VaultMarkSplit {
  reliableCents: number;
  indicativeCents: number;
  unmarkedUnits: number;
}

export interface VaultTodayChange {
  since: string | null;
  previousCents: number | null;
  changeCents: number | null;
  changeBps: number | null;
}

export interface VaultSellNowEstimate {
  proceedsCents: number;
  units: number;
  unplacedUnits: number;
  keys: number;
  blocked: Array<{ bookKey: string; reason: string }>;
  note: string;
}

/** `vaultMarkets.worth()` — what the vault is worth now. */
export interface VaultWorth {
  asOf: string;
  valueCents: number;
  vaultCents: number;
  onLoanCents: number;
  positionsCents: number;
  units: number;
  unitsOnLoan: number;
  marks: VaultMarkSplit;
  costCents: number;
  pnlCents: number;
  today: VaultTodayChange;
  sellNow: VaultSellNowEstimate;
  /** Plain words on how far to trust the value; repeat it rather than paraphrasing it away. */
  note: string;
}

/** One unit in the vault at its mark. */
export interface VaultHolding {
  id: string;
  status: string;
  bookKey: string | null;
  skuName: string | null;
  variantLabel: string | null;
  imageUrl: string | null;
  markCents: number | null;
  markQuality: VaultMarkQuality;
  markConfidenceBps: number | null;
  costCents: number | null;
  pnlCents: number | null;
  /** Where it really stands: stored, listed, lent, pledged, at the grader, … */
  situation: string;
  tradable: boolean;
  [k: string]: unknown;
}

export interface VaultHoldingsList {
  data: VaultHolding[];
  meta?: {
    totals?: { valueCents: number; costCents: number; pnlCents: number; units: number; unitsOnLoan: number; marks: VaultMarkSplit };
    onLoan?: Array<Record<string, unknown>>;
    [k: string]: unknown;
  };
}

export interface VaultHistoryPoint {
  day: string;
  totalCents: number;
  vaultCents: number;
  onLoanCents: number;
  positionsCents: number;
  units: number;
}

export interface VaultHistory {
  series: VaultHistoryPoint[];
  now: Record<string, unknown> & { totalCents: number; at: string; marks: VaultMarkSplit };
  today: VaultTodayChange;
}

export interface VaultWatchRow {
  bookKey: string;
  name: string | null;
  label: string | null;
  imageUrl: string | null;
  markCents: number | null;
  markQuality?: VaultMarkQuality;
  change24hBps: number | null;
  change7dBps: number | null;
  sparkline: Array<{ day: string; cents: number }>;
  addedAt: string;
}

export interface VaultWatchList {
  data: VaultWatchRow[];
}

/** An Instant Exit quote: the best resting bid on a key. A quote, never an order. */
export interface VaultExitQuote {
  bookKey: string;
  markCents: number | null;
  bestBidCents: number | null;
  unitsAtBest: number;
  shareOfMarkBps: number | null;
  dealerBid: boolean;
  committedDealers: number;
  levels: Array<{ priceCents: number; units: number; dealer: boolean }>;
  floorBps: number;
  available: boolean;
  reason: string | null;
  [k: string]: unknown;
}

export interface VaultHoldingExitQuote extends VaultExitQuote {
  unitsHeld: number;
  sellableUnitIds: string[];
}

export interface VaultExitQuoteList {
  data: VaultHoldingExitQuote[];
}

export interface VaultUnitExitQuote extends VaultExitQuote {
  vaultItemId: string;
}

export interface VaultIndexSummary {
  slug: string;
  name: string;
  kind: string;
  value: number | null;
  changeBps: number | null;
  /** Why there is no number (below the data gate, halted, retired); null when the level is published. */
  notice: string | null;
  [k: string]: unknown;
}

export interface VaultIndexList {
  data: VaultIndexSummary[];
}

export interface VaultIndexDetail extends VaultIndexSummary {
  history: Array<{ day: string; value: number; constituents: number; status: string }>;
  now: { day: string; value: number | null };
}

export type VaultIndexKind = 'category' | 'brand' | 'curated' | 'custom' | 'composite' | 'segment';

/** Vault Markets reads for the authenticated buyer. */
export class VaultMarketsResource {
  constructor(private http: BuyerHttpClient) {}

  /**
   * What the vault is worth now: value at the marks with its quality split,
   * cost and P&L, today's change, and a separate sell-now estimate from the
   * bids resting on the book. Requires `buyer:orders:read`.
   */
  worth() {
    return this.http.request<VaultWorth>({ method: 'GET', path: '/v1/buyer/vault-markets/worth' });
  }

  /** Each unit held, at its mark and the mark's quality; `meta.totals` sums them. Requires `buyer:orders:read`. */
  holdings() {
    return this.http.request<VaultHoldingsList>({ method: 'GET', path: '/v1/buyer/vault-markets/holdings' });
  }

  /** Value by day at the marks (oldest first, today live). `days` 1-1825, default 90. Requires `buyer:orders:read`. */
  history(params: { days?: number } = {}) {
    return this.http.request<VaultHistory>({ method: 'GET', path: '/v1/buyer/vault-markets/history', query: params });
  }

  /** Watched book keys with mark, quality, 24 h / 7 d change and a 30-day sparkline. Requires `buyer:orders:read`. */
  watchlist() {
    return this.http.request<VaultWatchList>({ method: 'GET', path: '/v1/buyer/vault-markets/watchlist' });
  }

  /** Instant Exit quotes for everything held, one per book key. Quotes only. Requires `buyer:orders:read`. */
  exitQuotes() {
    return this.http.request<VaultExitQuoteList>({ method: 'GET', path: '/v1/buyer/vault-markets/instant-exit' });
  }

  /** The Instant Exit quote for one vault unit you hold. Requires `buyer:orders:read`. */
  exitQuote(vaultItemId: string) {
    return this.http.request<VaultUnitExitQuote>({ method: 'GET', path: `/v1/buyer/vault-markets/instant-exit/${encodeURIComponent(vaultItemId)}` });
  }

  /** Crossly indexes over vault book keys with level now and change. Requires `buyer:catalog:read`. */
  indexes(params: { kind?: VaultIndexKind } = {}) {
    return this.http.request<VaultIndexList>({ method: 'GET', path: '/v1/buyer/vault-markets/indexes', query: params });
  }

  /** One index with its published daily closes. `days` 1-1825, default 365. Requires `buyer:catalog:read`. */
  index(slug: string, params: { days?: number } = {}) {
    return this.http.request<VaultIndexDetail>({ method: 'GET', path: `/v1/buyer/vault-markets/indexes/${encodeURIComponent(slug)}`, query: params });
  }
}
