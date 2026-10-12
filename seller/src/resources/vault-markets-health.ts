import type { HttpClient } from './_shared.js';

// ─── Vault Markets portfolio health ─────────────────────────────────────────
//
// `client.vaultMarkets.health`. What you hold in the Crossly vault, described:
// concentration by single item, category, grade and grader (shares, and the
// HHI on 0 to 10,000 with its band and "effective number" of equal holdings),
// value by liquidity tier, a stress grid (each category, and everything at
// once, down 10, 20 and 30 percent), a what-if on one held item, and value by
// the quality of the mark behind it. Values are Crossly marks from the order
// book. Information only, never advice: nothing here places an order.
// Money fields are integer CENTS of US dollars; shares and moves are basis
// points (10,000 = 100%).

export type HealthMarkQuality = 'A' | 'B' | 'C' | 'none';
export type HealthTier = 'A' | 'B' | 'C' | 'D' | 'unclassified';
export type HealthHhiBand = 'empty' | 'spread' | 'moderate' | 'concentrated';

export interface HealthGroup {
  key: string;
  valueCents: number;
  shareBps: number;
  units: number;
  /** Distinct book keys in the group. */
  items: number;
}

export interface HealthGroupConcentration {
  groups: HealthGroup[];
  hhi: number;
  band: HealthHhiBand;
  /** 10,000 / HHI: how many equal holdings the spread is worth; null when nothing is valued. */
  effectiveCount: number | null;
  largestShareBps: number;
}

export interface HealthTopItem {
  bookKey: string;
  title: string;
  imageUrl: string | null;
  units: number;
  valueCents: number;
  shareBps: number;
}

export interface HealthConcentration {
  totalCents: number;
  singleItem: { hhi: number; band: HealthHhiBand; bandText: string; effectiveCount: number | null; largestShareBps: number; top: HealthTopItem[] };
  byCategory: HealthGroupConcentration;
  byGrade: HealthGroupConcentration;
  byGrader: HealthGroupConcentration;
}

export interface HealthTierRow {
  tier: HealthTier;
  label: string;
  explainer: string;
  items: number;
  units: number;
  valueCents: number;
  shareBps: number;
}

export interface HealthLiquidity {
  totalCents: number;
  tiers: HealthTierRow[];
  continuousShareBps: number;
  auctionShareBps: number;
  /** Listings-only (tier D) plus keys not yet classified. */
  listingsOnlyShareBps: number;
}

export interface HealthStressCell {
  /** The move, basis points (-1000 = down 10%). */
  shockBps: number;
  changeCents: number;
  vaultAfterCents: number;
  vaultChangeBps: number;
}

export interface HealthStressRow {
  category: string;
  exposureCents: number;
  shareBps: number;
  cells: HealthStressCell[];
}

export interface HealthStress {
  label: string;
  shocksBps: number[];
  totalCents: number;
  rows: HealthStressRow[];
  everything: { exposureCents: number; cells: HealthStressCell[] };
}

export interface HealthQualityPart {
  quality: HealthMarkQuality;
  label: string;
  text: string;
  items: number;
  units: number;
  valueCents: number;
  shareBps: number;
}

export interface HealthMarks {
  totalCents: number;
  parts: HealthQualityPart[];
  /** Value on trade-anchored (A) or firm-book (B) marks. */
  reliableShareBps: number;
  unmarkedUnits: number;
}

export interface HealthItem {
  bookKey: string;
  title: string;
  imageUrl: string | null;
  category: string;
  grade: string;
  units: number;
  markCents: number | null;
  quality: HealthMarkQuality;
  tier: HealthTier;
  valueCents: number;
}

export interface PortfolioHealth {
  asOf: string;
  disclosure: string;
  totals: { valueCents: number; items: number; units: number; unitsOnLoan: number; unmarkedUnits: number; unlistedUnits: number };
  concentration: HealthConcentration;
  liquidity: HealthLiquidity;
  stress: HealthStress;
  marks: HealthMarks;
  /** Plain observations with numbers; never a recommendation. */
  notes: string[];
  /** The held items a what-if can run on, largest first. */
  items: HealthItem[];
}

export interface PortfolioWhatIf {
  bookKey: string;
  title: string;
  category: string;
  units: number;
  markCents: number | null;
  quality: HealthMarkQuality;
  moveBps: number;
  /** False when the item has no mark (a move then changes nothing). */
  priced: boolean;
  itemBeforeCents: number;
  itemAfterCents: number;
  changeCents: number;
  vaultBeforeCents: number;
  vaultAfterCents: number;
  vaultChangeBps: number;
  shareBeforeBps: number;
  shareAfterBps: number;
  categoryShareBeforeBps: number;
  categoryShareAfterBps: number;
  hhiBefore: number;
  hhiAfter: number;
  note: string;
}

export interface PortfolioWhatIfInput {
  /** A book key you hold, from `health().items`. */
  bookKey: string;
  /** The move on its mark, basis points (-10000 to 10000; -2000 = down 20%). */
  moveBps: number;
}

export class VaultMarketsHealthResource {
  constructor(private http: HttpClient) {}

  /** Portfolio health of your vault holdings at Crossly marks. Information only, not advice. */
  get() {
    return this.http.request<PortfolioHealth>({ method: 'GET', path: '/v1/vault-markets/health' });
  }

  /** One held item moving by `moveBps`: your vault, its share and the HHI before and after. */
  whatIf(input: PortfolioWhatIfInput) {
    return this.http.request<PortfolioWhatIf>({ method: 'GET', path: '/v1/vault-markets/health/what-if', query: { bookKey: input.bookKey, moveBps: input.moveBps } });
  }
}
