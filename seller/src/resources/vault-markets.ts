import type { HttpClient, IdempotencyOpts, JsonObject } from './_shared.js';
import { VaultMarketsProResource } from './vault-markets-pro.js';
import { VaultMarketsLiquidityResource } from './vault-markets-liquidity.js';
import { VaultMarketsCreditResource } from './vault-markets-credit.js';
import { VaultMarketsAnalyticsResource } from './vault-markets-analytics.js';
import { VaultMarketsOpsResource } from './vault-markets-ops.js';
import { VaultMarketsGradingResource } from './vault-markets-grading.js';
import { VaultMarketsSocialResource } from './vault-markets-social.js';
import { VaultMarketsChannelsResource } from './vault-markets-channels.js';
import { VaultMarketsSupplyResource } from './vault-markets-supply.js';
import { VaultMarketsStatsResource } from './vault-markets-stats.js';
import { VaultMarketsIndexResource } from './vault-markets-index.js';
import { VaultMarketsTitleResource } from './vault-markets-title.js';
import { VaultMarketsInstResource } from './vault-markets-inst.js';
import { VaultMarketsMmResource } from './vault-markets-mm.js';
import { VaultMarketsAdlResource } from './vault-markets-adl.js';
import { VaultMarketsCurvePoolsResource } from './vault-markets-curve-pools.js';
import { VaultMarketsBullionResource } from './vault-markets-bullion.js';
import { VaultMarketsP2pResource } from './vault-markets-p2p.js';
import { VaultMarketsPmResource } from './vault-markets-pm.js';
import { VaultMarketsReceiptTokensResource } from './vault-markets-receipt-tokens.js';
import { VaultMarketsMarksResource } from './vault-markets-marks.js';
import { VaultMarketsGradeToVaultResource } from './vault-markets-grade-to-vault.js';
import { VaultMarketsHallResource } from './vault-markets-hall.js';
import { VaultMarketsAgentResource } from './vault-markets-agent.js';
import { VaultMarketsPaperResource } from './vault-markets-paper.js';
import { VaultMarketsModeResource } from './vault-markets-mode.js';
import { VaultMarketsUnitStoryResource } from './vault-markets-unit-story.js';
import { VaultMarketsAlertsHubResource } from './vault-markets-alerts-hub.js';
import { VaultMarketsFollowsResource } from './vault-markets-follows.js';
import { VaultMarketsFloorResource } from './vault-markets-floor.js';
import { VaultMarketsSetGoalsResource } from './vault-markets-set-goals.js';
import { VaultMarketsValuationResource } from './vault-markets-valuation.js';
import { VaultMarketsJointTodResource } from './vault-markets-joint-tod.js';
import { VaultMarketsVaultSuggestResource } from './vault-markets-vault-suggest.js';
import { VaultMarketsHealthResource } from './vault-markets-health.js';
import { VaultMarketsTaxLossResource } from './vault-markets-tax-loss.js';
import { VaultMarketsHomeResource } from './vault-markets-home.js';
import { VaultMarketsPriceWidgetsResource } from './vault-markets-price-widgets.js';
import { VaultMarketsPopReportsResource } from './vault-markets-pop-reports.js';
import { VaultMarketsWidgetResource } from './vault-markets-widget.js';
import { VaultMarketsOracleDcmResource } from './vault-markets-oracle-dcm.js';
import { VaultMarketsReportsResource } from './vault-markets-reports.js';
import { VaultMarketsWorldResource } from './vault-markets-world.js';

// The sub-resources' types ride on this module so the package index (at its
// line cap) re-exports them through its one `export type *` of this file.
export type * from './vault-markets-liquidity.js';
export type * from './vault-markets-credit.js';
export type * from './vault-markets-analytics.js';
export type * from './vault-markets-ops.js';
export type * from './vault-markets-grading.js';
export type * from './vault-markets-social.js';
export type * from './vault-markets-channels.js';
export type * from './vault-markets-supply.js';
export type * from './vault-markets-stats.js';
export type * from './vault-markets-index.js';
export type * from './vault-markets-title.js';
export type * from './vault-markets-inst.js';
export type * from './vault-markets-reports.js';
export type * from './vault-markets-mm.js';
export type * from './vault-markets-adl.js';
export type * from './vault-markets-curve-pools.js';
export type * from './vault-markets-bullion.js';
export type * from './vault-markets-p2p.js';
export type * from './vault-markets-pm.js';
export type * from './vault-markets-receipt-tokens.js';
export type * from './vault-markets-marks.js';
export type * from './vault-markets-grade-to-vault.js';
export type * from './vault-markets-hall.js';
export type * from './vault-markets-agent.js';
export type * from './vault-markets-paper.js';
export type * from './vault-markets-mode.js';
export type * from './vault-markets-unit-story.js';
export type * from './vault-markets-alerts-hub.js';
export type * from './vault-markets-follows.js';
export type * from './vault-markets-floor.js';
export type * from './vault-markets-set-goals.js';
export type * from './vault-markets-valuation.js';
export type * from './vault-markets-joint-tod.js';
export type * from './vault-markets-vault-suggest.js';
export type * from './vault-markets-health.js';
export type * from './vault-markets-tax-loss.js';
export type * from './vault-markets-home.js';
export type * from './vault-markets-price-widgets.js';
export type * from './vault-markets-pop-reports.js';
export type * from './vault-markets-widget.js';
export type * from './vault-markets-oracle-dcm.js';
export type * from './vault-markets-world.js';

// ─── Vault Markets: invest, lend, short and lever on vault items ────────────
//
// A "book key" is one fungible market: `variantId:condition:gradeKey` (grade
// "-" when ungraded). Every money field is integer CENTS of US dollars; CBX
// stake amounts are base units as decimal strings. Reads need the
// `vault-markets:read` scope, everything that moves money `vault-markets:trade`.
//
// Lending, shorts, leverage and staking each wait on a registration. Until it
// is live the route answers 503 with `error.details = { gate, missing }`
// naming the env it waits on; `account()` reports every gate up front. A 409
// carries a human message (no units to borrow, over a limit, custodian refused).

export type VaultMarkSource = 'twap' | 'mid' | 'bid' | 'ask' | 'last' | 'none';
export type VaultGate = 'custody' | 'lending' | 'leverage' | 'staking';

export interface VaultMark {
  bookKey: string;
  markCents: number | null;
  source: VaultMarkSource;
  change24hBps: number | null;
  change7dBps: number | null;
  at: string;
}

export interface VaultMover {
  bookKey: string;
  name: string;
  label: string;
  imageUrl: string | null;
  units: number;
  markCents: number | null;
  change24hBps: number | null;
}

export interface VaultKeyMarket {
  bookKey: string;
  label: string;
  skuId: string | null;
  skuName: string | null;
  imageUrl: string | null;
  mark: VaultMark;
  history: Array<{ day: string; cents: number }>;
  lending: { stock: number; lent: number; lendable: number; room: number; utilBps: number; aprBps: number };
  openInterest: { shorts: number; longs: number };
  auctions: JsonObject[];
}

export interface VaultMarketsAccount {
  /** Which registrations are live; `missing` names the env each still waits on. */
  gates: Record<VaultGate, { open: boolean; missing: string[] }>;
  termsVersion: string;
  account: { status: string; termsVersion: string | null; termsAcceptedAt: string | null; maxOpenPositions: number | null; maxShortUnitsPerKey: number | null } | null;
  balances: { status: string; usdCents: number; cbxBaseUnits: string; cbxValueCents: number | null } | null;
}

export interface VaultPortfolio {
  holdings: JsonObject[];
  onLoan: JsonObject[];
  totals: { valueCents: number; costCents: number; pnlCents: number; units: number; unitsOnLoan: number };
}

export interface VaultLoan {
  id: string;
  bookKey: string;
  status: string;
  aprBps: number;
  markCentsAtOpen: number;
  feesAccruedCents: number | string;
  feesPaidCents: number;
  recallDueAt: string | null;
  openedAt: string;
  closedAt: string | null;
  returnedVaultItemId: string | null;
}

export type VaultPositionKind = 'short' | 'long';

export interface VaultPosition {
  id: string;
  kind: VaultPositionKind;
  status: string;
  bookKey: string;
  variantId: string;
  condition: string;
  gradeKey: string | null;
  units: number;
  entryCents: number | null;
  exitCents: number | null;
  limitCents: number | null;
  leverageX100: number | null;
  collateralUsdCents: number;
  collateralCbxValueCents: number;
  loanCents: number;
  proceedsCents: number | null;
  feesOwedCents: number;
  feesPaidCents: number;
  markCents: number | null;
  healthBps: number | null;
  calledAt: string | null;
  unrealisedPnlCents: number | null;
  realizedPnlCents: number | null;
  /** Borrow interest owed and paid so far, in cents. */
  interestOwedCents: number;
  interestPaidCents: number;
  /** How liquid the key's market is; sets the collateral and leverage limits. */
  tier: 'deep' | 'standard' | 'thin';
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
}

export interface VaultPositionDetail extends VaultPosition {
  loans: JsonObject[];
  auctions: JsonObject[];
  instructions: JsonObject[];
  /** A multi-unit position: each single-unit order it opened with (`side`, `status`, `priceCents`). */
  legs?: JsonObject[];
  /** One-unit rows cut off it to close (or the row it was cut from), with the custodian split's `status`. */
  splits?: JsonObject[];
}

/** What opening a short or a leveraged long returns. */
export interface VaultOpenResult {
  positionId: string;
  matched: boolean;
  /** Waiting on the custodian (the order is not on the book yet). */
  pending?: boolean;
  /** A multi-unit opening: units asked for and, once open, units filled (the rest were cancelled). */
  units?: { requested: number; filled: number | null };
}

/** One one-unit row cut off a multi-unit position to close it. */
export interface VaultCloseRow {
  positionId: string;
  /** 'placed' = its order is on the book; 'waiting' = the custodian is still moving it to its own line; 'refused' = the custodian refused, and the unit went back into the position. */
  state: 'placed' | 'waiting' | 'refused';
  matched: boolean;
}

/** What a cover or a close returns. */
export interface VaultCloseResult {
  positionId: string;
  bidId?: string | null;
  askId?: string | null;
  matched: boolean;
  /** Units being closed. */
  units: number;
  rows: VaultCloseRow[];
}

/** Idempotency, plus how many of the position's units to close (default all). */
export interface VaultCloseOpts extends IdempotencyOpts {
  units?: number;
}

export interface VaultAlert {
  id: string;
  bookKey: string;
  direction: 'above' | 'below';
  thresholdCents: number;
  firedAt: string | null;
  createdAt: string;
}

export interface VaultPool {
  baseUnits: string;
  totalShares: string;
  valueCents: number | null;
  lentCents: number;
  roomCents: number;
  capacityCents: number;
  utilBps: number;
  aprBps: number;
  insuranceFundCents: number;
  stakerShareBps: number;
  cooldownDays: number;
}

export interface VaultStake {
  id: string;
  status: string;
  stakedBaseUnits: string;
  shares: string;
  redeemsBaseUnits: string;
  redeemsCents: number | null;
  cooldownUntil: string | null;
  createdAt: string;
}

export interface OpenVaultShortBody {
  /** `variantId:condition:gradeKey`. */
  bookKey: string;
  /** Lowest sale price for the borrowed unit, in cents. */
  limitCents: number;
  /** USD collateral, in cents (50% of the mark in total). */
  collateralUsdCents: number;
  /** CBX collateral by value, in cents (counts at half, up to 30%). */
  collateralCbxValueCents?: number;
  /** A locate you hold (`vaultMarkets.title.holdLocate`): borrow exactly that unit, at its quoted terms. */
  locateId?: string;
  /** A firm sub-account to open for (`vaultMarkets.inst`); omitted = your own account. */
  subaccountId?: string;
  /** Leverage times 100: 100 (none) to 150; above 100 the pool posts part of the collateral (needs the leverage registration). */
  leverageX100?: number;
  /** Units to short (default 1; at most 25 / 10 / 3 / 1 by liquidity tier A / B / C / D). Collateral is for all of them. */
  units?: number;
  /** Borrow as many of `units` as are free instead of refusing when fewer are (never none). */
  allowPartial?: boolean;
}

export interface VaultTopUpBody {
  /** USD to add, in cents: a short posts it as collateral, a leveraged long pays down its pool loan. */
  usdCents: number;
  /** CBX collateral by value, in cents (shorts only; counts at half). */
  cbxValueCents?: number;
}

export interface OpenVaultLongBody {
  bookKey: string;
  /** Highest price you pay for the unit, in cents. */
  maxCents: number;
  /** Leverage times 100: 101 (1.01x) to 200 (2x). */
  leverageX100: number;
  /** A firm sub-account to open for (`vaultMarkets.inst`); omitted = your own account. */
  subaccountId?: string;
  /** Units to buy (default 1; at most 25 / 10 / 3 / 1 by liquidity tier A / B / C / D). A partial fill opens with the units bought. */
  units?: number;
}

export interface CreateVaultAlertBody {
  bookKey: string;
  direction: 'above' | 'below';
  thresholdCents: number;
}

export class VaultMarketsResource {
  /** The pro market on the vault books: orders, quotes, depth, tape, candles. */
  readonly pro: VaultMarketsProResource;
  /** Instant Exit, offers, recurring buys, brackets / OCO / trailing stops, liquidation prices, dealers. */
  readonly liquidity: VaultMarketsLiquidityResource;
  /** Loans against stored vault units and advances against listed ones. */
  readonly credit: VaultMarketsCreditResource;
  /** Indexes and baskets, watchlist, compare, portfolio history, grading signal, supply. */
  readonly analytics: VaultMarketsAnalyticsResource;
  /** Gifts and donations, the tax centre, vault auctions, sell-now on one unit. */
  readonly ops: VaultMarketsOpsResource;
  /** Grade a raw vault unit in a Grading Run without taking it out. */
  readonly grading: VaultMarketsGradingResource;
  /** Verified share cards, public vault profiles + follow feed, Learn quizzes, the Vault Report, press kit, widget reads. */
  readonly social: VaultMarketsSocialResource;
  /** Telegram + digest channels, item value from a scan, collection worth, ship-to-vault deposits. */
  readonly channels: VaultMarketsChannelsResource;
  /** Send inventory to the vault, Market Open keys + waitlist, Drop-off Partners, seller round-up. */
  readonly supply: VaultMarketsSupplyResource;
  /** Crossly Estimate (a model, not a price), liquidity score, risk stats, correlations, gem rate. */
  readonly stats: VaultMarketsStatsResource;
  /** Index methodology, events, calendar, constituents as of a date, provisional / settlement levels, committee records. */
  readonly index: VaultMarketsIndexResource;
  /** Warehouse receipts, proof of reserves (Merkle root + your inclusion proof), attestations, the lending desk, the partner index feed. */
  readonly title: VaultMarketsTitleResource;
  /** Firm accounts and sub-accounts, NAV, the risk report, capacity, TCA, confirmations and statements, the audit log. */
  readonly inst: VaultMarketsInstResource;
  /** Fees by role, quote requests (RFQ), midpoint blocks, market-maker programmes and protection (MMP). */
  readonly mm: VaultMarketsMmResource;
  /** Auto-deleveraging: your positions' ADL rank, the insurance fund, ADL events. */
  readonly adl: VaultMarketsAdlResource;
  /** Dealer bonding-curve pools: open, tend and close a curve per book key. */
  readonly curvePools: VaultMarketsCurvePoolsResource;
  /** Bullion key families and quotes pegged to metals spot. */
  readonly bullion: VaultMarketsBullionResource;
  /** Peer-to-peer perpetual loans against vault units (offers, take, repay, call, refinancing auctions). */
  readonly p2p: VaultMarketsP2pResource;
  /** Portfolio margin for ECP firm sub-accounts: the scenario-grid requirement, enrol, what-if, history. */
  readonly portfolioMargin: VaultMarketsPmResource;
  /** Receipt tokens on Solana: export one unit receipt to your own wallet (you sign), redeem it back. */
  readonly receiptTokens: VaultMarketsReceiptTokensResource;
  /** One book key's mark: readMark with quality, implied-from, inputs and confidence. */
  readonly marks: VaultMarketsMarksResource;
  /** Crossly indexes published as an oracle feed, and a partner exchange's index futures and options (read-only). */
  readonly oracleDcm: VaultMarketsOracleDcmResource;
  /** Large-trader reports: file your own when you hold a large share of an item in the vault. */
  readonly reports: VaultMarketsReportsResource;
  /** Vault Markets in the world (Market Open events, the holders lounge, creator rooms) and the creator programme. */
  readonly world: VaultMarketsWorldResource;
  /** Round 11: grade-to-vault, Hall loans, agent watches/drafts, paper trading, Simple/Pro mode, unit story, alerts hub, follows, Trading Floor. */
  readonly gradeToVault: VaultMarketsGradeToVaultResource;
  readonly hall: VaultMarketsHallResource;
  readonly agent: VaultMarketsAgentResource;
  readonly paper: VaultMarketsPaperResource;
  readonly mode: VaultMarketsModeResource;
  readonly unitStory: VaultMarketsUnitStoryResource;
  readonly alertsHub: VaultMarketsAlertsHubResource;
  readonly follows: VaultMarketsFollowsResource;
  readonly floor: VaultMarketsFloorResource;
  readonly setGoals: VaultMarketsSetGoalsResource;
  readonly valuation: VaultMarketsValuationResource;
  readonly jointTod: VaultMarketsJointTodResource;
  readonly vaultSuggestions: VaultMarketsVaultSuggestResource;
  readonly health: VaultMarketsHealthResource;
  readonly taxLoss: VaultMarketsTaxLossResource;
  readonly home: VaultMarketsHomeResource;
  readonly priceWidgets: VaultMarketsPriceWidgetsResource;
  readonly popReports: VaultMarketsPopReportsResource;
  readonly homeWidget: VaultMarketsWidgetResource;

  // Assigned in the constructor, not as a field initialiser: under
  // `useDefineForClassFields` the initialiser would run before `http` is set.
  constructor(private http: HttpClient) {
    this.pro = new VaultMarketsProResource(http);
    this.liquidity = new VaultMarketsLiquidityResource(http);
    this.credit = new VaultMarketsCreditResource(http);
    this.analytics = new VaultMarketsAnalyticsResource(http);
    this.ops = new VaultMarketsOpsResource(http);
    this.grading = new VaultMarketsGradingResource(http);
    this.social = new VaultMarketsSocialResource(http);
    this.channels = new VaultMarketsChannelsResource(http);
    this.supply = new VaultMarketsSupplyResource(http);
    this.stats = new VaultMarketsStatsResource(http);
    this.index = new VaultMarketsIndexResource(http);
    this.title = new VaultMarketsTitleResource(http);
    this.inst = new VaultMarketsInstResource(http);
    this.mm = new VaultMarketsMmResource(http);
    this.adl = new VaultMarketsAdlResource(http);
    this.curvePools = new VaultMarketsCurvePoolsResource(http);
    this.bullion = new VaultMarketsBullionResource(http);
    this.p2p = new VaultMarketsP2pResource(http);
    this.portfolioMargin = new VaultMarketsPmResource(http);
    this.receiptTokens = new VaultMarketsReceiptTokensResource(http);
    this.marks = new VaultMarketsMarksResource(http);
    this.oracleDcm = new VaultMarketsOracleDcmResource(http);
    this.reports = new VaultMarketsReportsResource(http);
    this.world = new VaultMarketsWorldResource(http);
    this.gradeToVault = new VaultMarketsGradeToVaultResource(http);
    this.hall = new VaultMarketsHallResource(http);
    this.agent = new VaultMarketsAgentResource(http);
    this.paper = new VaultMarketsPaperResource(http);
    this.mode = new VaultMarketsModeResource(http);
    this.unitStory = new VaultMarketsUnitStoryResource(http);
    this.alertsHub = new VaultMarketsAlertsHubResource(http);
    this.follows = new VaultMarketsFollowsResource(http);
    this.floor = new VaultMarketsFloorResource(http);
    this.setGoals = new VaultMarketsSetGoalsResource(http);
    this.valuation = new VaultMarketsValuationResource(http);
    this.jointTod = new VaultMarketsJointTodResource(http);
    this.vaultSuggestions = new VaultMarketsVaultSuggestResource(http);
    this.health = new VaultMarketsHealthResource(http);
    this.taxLoss = new VaultMarketsTaxLossResource(http);
    this.home = new VaultMarketsHomeResource(http);
    this.priceWidgets = new VaultMarketsPriceWidgetsResource(http);
    this.popReports = new VaultMarketsPopReportsResource(http);
    this.homeWidget = new VaultMarketsWidgetResource(http);
  }

  /** Vault items with the biggest 24 h moves in their market price, with units in the vault. */
  movers(limit?: number) {
    return this.http.request<{ data: VaultMover[] }>({ method: 'GET', path: '/v1/vault-markets/movers', query: limit ? { limit } : undefined });
  }

  /** One book key: mark and history, lending depth and borrow rate, open interest, live auctions. */
  market(bookKey: string) {
    return this.http.request<VaultKeyMarket>({ method: 'GET', path: '/v1/vault-markets/market', query: { bookKey } });
  }

  /** Which registrations are live, your custodian account, limits and balances. */
  account() {
    return this.http.request<VaultMarketsAccount>({ method: 'GET', path: '/v1/vault-markets/account' });
  }

  /** Open your account at the custodian partner (once); it is verified before it is active. */
  openAccount(opts: IdempotencyOpts = {}) {
    return this.http.request<{ status: string }>({ method: 'POST', path: '/v1/vault-markets/account', idempotencyKey: opts.idempotencyKey });
  }

  /** Start (or resume) the one-time ID check the money features need: open `url`, or `alreadyVerified` is true. */
  startIdentity(opts: IdempotencyOpts = {}) {
    return this.http.request<{ url?: string; clientSecret?: string; alreadyVerified?: boolean }>({ method: 'POST', path: '/v1/vault-markets/identity/start', idempotencyKey: opts.idempotencyKey });
  }

  /** Accept the current lending terms (needed to lend or short). */
  acceptTerms(opts: IdempotencyOpts = {}) {
    return this.http.request<{ termsVersion: string }>({ method: 'POST', path: '/v1/vault-markets/terms', idempotencyKey: opts.idempotencyKey });
  }

  /** Your vault holdings at the market price, with cost and P&L, and units out on loan. */
  portfolio() {
    return this.http.request<VaultPortfolio>({ method: 'GET', path: '/v1/vault-markets/portfolio' });
  }

  /**
   * Turn lending on or off for a unit you own in the vault. `minAprBps` is the
   * lowest borrow rate you accept (APR in basis points); `null` clears it.
   */
  setLend(vaultItemId: string, on: boolean, opts: IdempotencyOpts & { minAprBps?: number | null } = {}) {
    const body = opts.minAprBps === undefined ? { on } : { on, minAprBps: opts.minAprBps };
    return this.http.request<{ lendEnabled: boolean; minAprBps: number | null }>({ method: 'POST', path: `/v1/vault/${encodeURIComponent(vaultItemId)}/lend`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Units you lent: rate, fees earned, recall due. */
  loans() {
    return this.http.request<{ data: VaultLoan[] }>({ method: 'GET', path: '/v1/vault-markets/loans' });
  }

  /** Recall a lent unit: the short has 3 days to return one. */
  recallLoan(loanId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ recallDueAt: string }>({ method: 'POST', path: `/v1/vault-markets/loans/${encodeURIComponent(loanId)}/recall`, idempotencyKey: opts.idempotencyKey });
  }

  /** Your positions, live (default) or closed. */
  positions(status?: 'live' | 'closed') {
    return this.http.request<{ data: VaultPosition[] }>({ method: 'GET', path: '/v1/vault-markets/positions', query: status ? { status } : undefined });
  }

  /** One position with its loans, auctions and custodian instruction log. */
  position(id: string) {
    return this.http.request<VaultPositionDetail>({ method: 'GET', path: `/v1/vault-markets/positions/${encodeURIComponent(id)}` });
  }

  /** Short a book key: borrow `units` lent units (default 1) and sell each at `limitCents` or better, posting collateral for all of them. */
  openShort(body: OpenVaultShortBody, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultOpenResult>({ method: 'POST', path: '/v1/vault-markets/shorts', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Buy `units` units (default 1) into your vault with leverage (up to 2x) from the staking pool, paying up to `maxCents` each. */
  openLong(body: OpenVaultLongBody, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultOpenResult>({ method: 'POST', path: '/v1/vault-markets/longs', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Cover a short: all its units (or `opts.units` of them), each buying any unit of the key for up to `maxCents` cents; each goes back to its lender. */
  cover(positionId: string, maxCents: number, opts: VaultCloseOpts = {}) {
    const body = opts.units ? { maxCents, units: opts.units } : { maxCents };
    return this.http.request<VaultCloseResult>({ method: 'POST', path: `/v1/vault-markets/positions/${encodeURIComponent(positionId)}/cover`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Close a leveraged long: all its units (or `opts.units` of them), each sold for at least `minCents` cents; each sale repays the pool first. */
  close(positionId: string, minCents: number, opts: VaultCloseOpts = {}) {
    const body = opts.units ? { minCents, units: opts.units } : { minCents };
    return this.http.request<VaultCloseResult>({ method: 'POST', path: `/v1/vault-markets/positions/${encodeURIComponent(positionId)}/close`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Answer a margin call: a short posts more collateral; a leveraged long pays down its pool loan. */
  addCollateral(positionId: string, body: VaultTopUpBody, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultPosition>({ method: 'POST', path: `/v1/vault-markets/positions/${encodeURIComponent(positionId)}/collateral`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Cancel the working order: an unfilled opening cancels the position; an unfilled cover or close leaves it open. */
  cancel(positionId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ ok: boolean }>({ method: 'POST', path: `/v1/vault-markets/positions/${encodeURIComponent(positionId)}/cancel`, idempotencyKey: opts.idempotencyKey });
  }

  /** Your price alerts on book keys. */
  alerts() {
    return this.http.request<{ data: VaultAlert[] }>({ method: 'GET', path: '/v1/vault-markets/alerts' });
  }

  /** Alert when a key's market price goes above or below a price, in cents (fires once). */
  createAlert(body: CreateVaultAlertBody, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultAlert>({ method: 'POST', path: '/v1/vault-markets/alerts', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Delete a price alert. */
  deleteAlert(alertId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ ok: boolean }>({ method: 'DELETE', path: `/v1/vault-markets/alerts/${encodeURIComponent(alertId)}`, idempotencyKey: opts.idempotencyKey });
  }

  /** The CBX market staking pool: size, value, what it lends, utilisation, rate, insurance fund. */
  pool() {
    return this.http.request<VaultPool>({ method: 'GET', path: '/v1/vault-markets/pool' });
  }

  /** Your stakes in the market pool and what each redeems for now. */
  stakes() {
    return this.http.request<{ data: VaultStake[] }>({ method: 'GET', path: '/v1/vault-markets/pool/stakes' });
  }

  /** Stake CBX you hold at the custodian into the pool (base units, as a whole-number string). */
  stake(baseUnits: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ stakeId: string; shares: string }>({ method: 'POST', path: '/v1/vault-markets/pool/stakes', body: { baseUnits }, idempotencyKey: opts.idempotencyKey });
  }

  /** Unstake: paid out after the 7-day cooldown. */
  unstake(stakeId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ cooldownUntil: string }>({ method: 'POST', path: `/v1/vault-markets/pool/stakes/${encodeURIComponent(stakeId)}/unstake`, idempotencyKey: opts.idempotencyKey });
  }
}
