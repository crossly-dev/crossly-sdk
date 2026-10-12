import type { HttpClient } from './_shared.js';

// ─── Vault Markets per-item analytics: estimate, liquidity, risk, gem rate ──
//
// `client.vaultMarkets.stats`. Everything here is DERIVED from Crossly trades
// and the firm book: labelled, with a band and an n, and never a price —
// none of it feeds margin, loans or settlement. Under a data threshold an
// answer has `available: false` (estimate) or `insufficient: true` (the
// rest), the reason "Not enough Crossly trades", and no number. Money is
// integer CENTS of US dollars; volatility, drawdown, rates and spreads are
// basis points. A book key is `variantId:condition:gradeKey` (grade "-"
// when ungraded).

export type VaultEstimateMethod = 'own_trades' | 'index_adjusted' | 'grade_ratio';
export type VaultLiquidityBucket = 'high' | 'mid' | 'low';

export interface VaultEstimate {
  /** Always "Crossly Estimate — a model, not a price". */
  label: string;
  derived: true;
  available: boolean;
  /** "Not enough Crossly trades" when not available. */
  reason: string | null;
  why: string | null;
  method: VaultEstimateMethod | null;
  cents: number | null;
  band68: { lowCents: number; highCents: number } | null;
  band95: { lowCents: number; highCents: number } | null;
  confidence: 'High' | 'Medium' | 'Low' | null;
  /** Forecast standard deviation of ln(actual / estimate) in the walk-forward backtest. */
  fsd: number | null;
  backtestN: number;
  n: number;
  asOf: string;
  methodVersion: number;
  detail: Record<string, unknown> | null;
  bookKey: string;
  categorySlug: string | null;
  liquidityBucket: VaultLiquidityBucket;
}

export interface VaultEstimateAccuracyCell {
  method: VaultEstimateMethod;
  categorySlug: string;
  liquidityBucket: VaultLiquidityBucket;
  n: number;
  fsd: number | null;
  bias: number | null;
  shown: boolean;
  computedAt: string;
}

export interface VaultLiquidityScore {
  label: string;
  derived: true;
  insufficient: boolean;
  reason: string | null;
  score: number | null;
  bucket: VaultLiquidityBucket | null;
  peerGroup: 'category' | 'all';
  peers: number;
  components: Array<{ name: string; value: number | null; percentile: number | null; weight: number; better: 'high' | 'low' }>;
  twoSidedHours: number;
  methodVersion: number;
  bookKey: string;
  categorySlug: string | null;
  asOf: string;
}

export interface VaultRiskStats {
  label: string;
  derived: true;
  insufficient: boolean;
  reason: string | null;
  /** Weekly returns behind the numbers. */
  n: number;
  source: 'a_marks' | 'index_levels';
  annualisedVolBps: number | null;
  /** Geltner-desmoothed (AR(1)). */
  desmoothedVolBps: number | null;
  desmoothingPhi: number | null;
  maxDrawdownBps: number | null;
  beta: { to: string; beta: number | null; n: number } | null;
  firstWeek: string | null;
  lastWeek: string | null;
  methodVersion: number;
  target: string;
  kind: 'key' | 'index';
}

export interface VaultCorrelations {
  label: string;
  derived: true;
  weeks: number;
  minPairWeeks: number;
  insufficient: boolean;
  reason: string | null;
  indexes: Array<{ slug: string; name: string }>;
  /** rho[i][j] for indexes[i] × indexes[j]; null under `minPairWeeks` shared weeks. */
  rho: Array<Array<number | null>>;
  n: number[][];
  asOf: string;
}

export interface VaultGemRateView {
  label: string;
  derived: true;
  graders: Array<{ graderSlug: string; gemFloor: number; n: number; gems: number; insufficient: boolean; rateBps: number | null; band95Bps: { low: number; high: number } | null }>;
  n: number;
  methodVersion: number;
}

export interface VaultGemRate {
  bookKey: string;
  categorySlug: string | null;
  item: VaultGemRateView;
  category: VaultGemRateView | null;
  gemFloors: Record<string, number>;
}

export interface VaultKeyStats {
  bookKey: string;
  estimate: VaultEstimate | { error: string };
  liquidity: VaultLiquidityScore | { error: string };
  risk: VaultRiskStats | { error: string };
  gemRate: VaultGemRate | { error: string };
}

const k = (s: string) => encodeURIComponent(s);

/** How a key trades (tier, live call with indicative price/volume, next call, LULD band, pause/halt). */
export type VaultMarketModel = Record<string, unknown>;
/** Recent call-auction uncrosses on a key. */
export interface VaultCallsPage { data: VaultCallRow[] }
export type VaultCallRow = Record<string, unknown>;

export class VaultMarketsStatsResource {
  constructor(private http: HttpClient) {}

  /** Estimate, liquidity score, risk statistics and gem rate for one book key in one read. */
  keyStats(bookKey: string) {
    return this.http.request<VaultKeyStats>({ method: 'GET', path: `/v1/vault-markets/key-stats/${k(bookKey)}` });
  }

  /** The Crossly Estimate — a model, not a price — with its 68% / 95% bands, or why there is none. */
  estimate(bookKey: string) {
    return this.http.request<VaultEstimate>({ method: 'GET', path: `/v1/vault-markets/estimates/${k(bookKey)}` });
  }

  /** The estimate's walk-forward backtest: n, FSD and bias per method, category and liquidity bucket. */
  estimateAccuracy() {
    return this.http.request<{ data: VaultEstimateAccuracyCell[] }>({ method: 'GET', path: '/v1/vault-markets/estimates-accuracy' });
  }

  /** The liquidity score (0-100) and its components. */
  liquidity(bookKey: string) {
    return this.http.request<VaultLiquidityScore>({ method: 'GET', path: `/v1/vault-markets/liquidity/${k(bookKey)}` });
  }

  /** Volatility (raw and desmoothed), max drawdown and beta, for a book key or an index slug. */
  riskStats(bookKeyOrIndexSlug: string) {
    return this.http.request<VaultRiskStats>({ method: 'GET', path: `/v1/vault-markets/risk-stats/${k(bookKeyOrIndexSlug)}` });
  }

  /** The sector indexes' correlation matrix over `weeks` (26-156, default 52), with n per pair. */
  correlations(weeks?: number) {
    return this.http.request<VaultCorrelations>({ method: 'GET', path: '/v1/vault-markets/correlations', query: weeks ? { weeks } : undefined });
  }

  /** The Crossly gem rate per grader, for the item and its category. */
  gemRate(bookKey: string) {
    return this.http.request<VaultGemRate>({ method: 'GET', path: `/v1/vault-markets/gem-rate/${k(bookKey)}` });
  }

  /** How a key trades: liquidity tier, the call collecting now (indicative price/volume), the next call, the LULD band, any pause or halt. */
  marketModel(bookKey: string) {
    return this.http.request<VaultMarketModel>({ method: 'GET', path: `/v1/vault-markets/market-model/${k(bookKey)}` });
  }

  /** Recent call-auction uncrosses on a key: kind, clearing price in cents, units. */
  calls(bookKey: string) {
    return this.http.request<VaultCallsPage>({ method: 'GET', path: `/v1/vault-markets/calls/${k(bookKey)}` });
  }
}
