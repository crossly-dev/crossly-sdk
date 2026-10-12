import type { HttpClient } from './_shared.js';

// ─── Vault Markets tax-loss suggestions ────────────────────────────────────
//
// `client.vaultMarkets.taxLoss`. The units you hold now whose mark (from the
// Crossly order book) is below what they cost you, from the tax centre's own
// lots: when and how each was acquired, its cost, short or long term if sold
// today, the day a short lot turns long, and the estimated loss at the mark
// BEFORE selling fees. Read only: nothing here sells; `sellHref` opens the
// ordinary order ticket on the web. Not tax advice: every answer carries the
// disclosure. Money fields are integer CENTS of US dollars.

export type TaxLossTerm = 'short' | 'long';
export type TaxLossMarkQuality = 'A' | 'B' | 'C' | 'none';

export interface TaxLossLot {
  /** ISO time the lot was acquired (a gift keeps the giver's date); null when not known. */
  acquiredAt: string | null;
  /** How it came in: buy, pack, gift_in, swap_in, loan_return, grading_in, other_in. */
  how: string;
  /** Cost including grading fees, cents. */
  basisCents: number;
}

export interface TaxLossSuggestion {
  vaultItemId: string;
  title: string | null;
  imageUrl: string | null;
  bookKey: string;
  lot: TaxLossLot;
  markCents: number;
  markQuality: TaxLossMarkQuality;
  markAsOf: string | null;
  /** Mark minus cost (negative), before selling fees. */
  estLossCents: number;
  /** The loss as a share of the cost, basis points (negative). */
  lossBps: number;
  /** If sold today; null when the acquisition day is not known. */
  term: TaxLossTerm | null;
  /** First day a short lot counts as long term (YYYY-MM-DD); null when already long or not known. */
  longTermOn: string | null;
  daysToLongTerm: number | null;
  /** What has to happen before it can be sold, in plain words; null when it can be sold now. */
  blocker: string | null;
  /** The web market page with its ticket on the sell side. */
  sellHref: string;
}

export interface TaxLossTotals {
  count: number;
  shortTermLossCents: number;
  longTermLossCents: number;
  unknownTermLossCents: number;
  totalLossCents: number;
  sellableNow: number;
  /** Held units whose cost is not known (sent in from outside). */
  unknownCostCount: number;
  /** Held units with no mark yet. */
  noMarkCount: number;
}

export interface TaxLossRealised {
  shortTermGainCents: number;
  longTermGainCents: number;
  sales: number;
}

export interface TaxLossSuggestions {
  asOf: string;
  year: number;
  daysLeftInYear: number;
  suggestions: TaxLossSuggestion[];
  totals: TaxLossTotals;
  realisedThisYear: TaxLossRealised;
  disclosure: string;
  notes: string[];
}

export class VaultMarketsTaxLossResource {
  constructor(private http: HttpClient) {}

  /** Units you hold whose mark is below your cost, with lot, term and estimated loss. Never sells. Not tax advice. */
  suggestions() {
    return this.http.request<TaxLossSuggestions>({ method: 'GET', path: '/v1/vault-markets/tax/loss-suggestions' });
  }
}
