import type { HttpClient } from './_shared.js';
import { VaultMarketsMissionsResource } from './vault-markets-missions.js';

export type * from './vault-markets-missions.js';

// ─── Vault Markets paper trading ────────────────────────────────────────────
//
// `client.vaultMarkets.paper`. PLAY MONEY ONLY: a practice account that starts
// with $10,000 of play money, is never real and is never convertible to
// cash, credit, CBX or anything else. Paper orders are simulated against the
// REAL live order book without touching it: they take visible liquidity at
// book prices (taker fee simulated), and what is left of a GTC limit rests on
// paper with a queue-position estimate and fills as the real tape reaches it
// (maker fee simulated). Paper fills never move a mark, fee, reward or
// surveillance record. Every response carries `playMoney: true` and `label`.
// Money fields are integer CENTS of (play) US dollars.

export type PaperSide = 'buy' | 'sell';
export type PaperOrderType = 'market' | 'limit';
export type PaperTif = 'gtc' | 'ioc';
export type PaperOrderStatus = 'working' | 'filled' | 'cancelled' | 'expired';

export interface PaperOrder {
  id: string;
  bookKey: string;
  side: PaperSide;
  type: PaperOrderType;
  tif: PaperTif;
  limitCents: number | null;
  quantity: number;
  filledQuantity: number;
  status: PaperOrderStatus;
  /** Real units that were resting at this price on this side when the paper order rested. */
  queueAtPlace: number;
  /** Real units still estimated ahead of it. */
  queueAhead: number;
  clientOrderId: string | null;
  cancelReason: string | null;
  expiresAt: string | null;
  createdAt: string;
  doneAt: string | null;
  playMoney: true;
  name?: string | null;
}

export interface PaperFill {
  id: string;
  orderId: string;
  bookKey: string;
  side: PaperSide;
  quantity: number;
  priceCents: number;
  /** The fee a real fill would have paid at retail rates (simulated, never charged). */
  feeCents: number;
  liquidity: 'taker' | 'maker';
  /** book: a visible real order; tape: a real trade printed through or at the paper price. */
  source: 'book' | 'tape';
  filledAt: string;
  playMoney: true;
  name?: string | null;
}

export interface PaperPosition {
  bookKey: string;
  units: number;
  reservedUnits: number;
  avgCostCents: number | null;
  costCents: number;
  markCents: number | null;
  /** False when the key has no mark: the units are held at cost. */
  priced: boolean;
  valueCents: number;
  unrealizedCents: number;
  realizedCents: number;
  name: string | null;
  label: string | null;
  imageUrl: string | null;
}

export interface PaperWeek {
  /** Monday (UTC) of this week, YYYY-MM-DD. */
  week: string;
  startEquityCents: number;
  fills: number;
  resetInWeek: boolean;
  returnBps: number | null;
}

export interface PaperAccount {
  playMoney: true;
  label: string;
  shortLabel: string;
  startingCents: number;
  cashCents: number;
  reservedCents: number;
  buyingPowerCents: number;
  positionsValueCents: number;
  equityCents: number;
  pnlCents: number;
  returnBps: number | null;
  realizedCents: number;
  positions: PaperPosition[];
  closed: PaperPosition[];
  workingOrders: PaperOrder[];
  recentFills: PaperFill[];
  epoch: number;
  resets: number;
  lastResetAt: string | null;
  /** When the next reset is allowed (null = now). */
  nextResetAt: string | null;
  leaderboard: { optIn: boolean; displayName: string | null };
  week: PaperWeek;
}

export interface PaperOrderInput {
  bookKey: string;
  side: PaperSide;
  /** market: fills now inside the 5% protection band around the mark, the rest cancelled. Default limit. */
  type?: PaperOrderType;
  /** 1 to 50; default 1. */
  quantity?: number;
  /** Cents of (play) US dollars; required for a limit. */
  limitCents?: number;
  /** gtc (default): the rest rests for up to 30 days; ioc: the rest is cancelled. */
  tif?: PaperTif;
  clientOrderId?: string;
}

export interface PaperOrderResult {
  order: PaperOrder;
  fills: PaperFill[];
  playMoney: true;
  label: string;
}

export interface PaperCancelResult {
  order: PaperOrder;
  playMoney: true;
  label: string;
}

export interface PaperOrderList {
  data: PaperOrder[];
}

export interface PaperFillList {
  data: PaperFill[];
}

export interface PaperQuoteInput {
  bookKey: string;
  side: PaperSide;
  quantity?: number;
  /** Omit for a market order (the 5% band around the mark). */
  limitCents?: number;
}

export interface PaperQuote {
  bookKey: string;
  side: PaperSide;
  quantity: number;
  limitCents: number | null;
  markCents: number | null;
  fillableUnits: number;
  avgPriceCents: number | null;
  notionalCents: number;
  feeCents: number;
  takes: Array<{ priceCents: number; units: number }>;
  restingUnits: number;
  queueAhead: number | null;
  halted: boolean;
  playMoney: true;
  label: string;
}

export interface PaperResetResult {
  epoch: number;
  resets: number;
  cashCents: number;
  nextResetAt: string;
  playMoney: true;
  label: string;
}

export interface PaperBoardEntry {
  rank: number;
  displayName: string;
  returnBps: number;
  fills: number;
  resetInWeek: boolean;
  you: boolean;
}

export interface PaperLeaderboardMeta {
  week: string;
  live: boolean;
  players: number;
  you: PaperBoardEntry | null;
  rules: string;
  playMoney: true;
  label: string;
}

export interface PaperLeaderboard {
  data: PaperBoardEntry[];
  meta: PaperLeaderboardMeta;
}

export interface PaperLeaderboardSetting {
  optIn: boolean;
  displayName: string | null;
  playMoney: true;
  label: string;
}

export class VaultMarketsPaperResource {
  /** Paper-trading missions: guided practice that earns world pins, never money. */
  readonly missions: VaultMarketsMissionsResource;

  constructor(private http: HttpClient) {
    this.missions = new VaultMarketsMissionsResource(http);
  }

  /** Your paper account (play money only; opened at $10,000 the first time). */
  account() {
    return this.http.request<PaperAccount>({ method: 'GET', path: '/v1/vault-markets/paper' });
  }

  /** Your paper orders since your last reset. */
  orders(params?: { status?: 'working' | 'done' | 'all'; limit?: number }) {
    return this.http.request<PaperOrderList>({ method: 'GET', path: '/v1/vault-markets/paper/orders', query: params });
  }

  /** Your paper fills since your last reset. */
  fills(params?: { limit?: number }) {
    return this.http.request<PaperFillList>({ method: 'GET', path: '/v1/vault-markets/paper/fills', query: params });
  }

  /** What a paper order would fill against the real book now (nothing placed). */
  quote(input: PaperQuoteInput) {
    return this.http.request<PaperQuote>({ method: 'GET', path: '/v1/vault-markets/paper/quote', query: { ...input } });
  }

  /** Place a paper order (play money; simulated against the real book without touching it). */
  placeOrder(input: PaperOrderInput) {
    return this.http.request<PaperOrderResult>({ method: 'POST', path: '/v1/vault-markets/paper/orders', body: input });
  }

  /** Cancel a working paper order. */
  cancelOrder(orderId: string) {
    return this.http.request<PaperCancelResult>({ method: 'POST', path: `/v1/vault-markets/paper/orders/${encodeURIComponent(orderId)}/cancel` });
  }

  /** Reset to $10,000 of play money (once a day). */
  reset() {
    return this.http.request<PaperResetResult>({ method: 'POST', path: '/v1/vault-markets/paper/reset' });
  }

  /** The weekly leaderboard (opt-in display names); `week` is a Monday as YYYY-MM-DD. */
  leaderboard(week?: string) {
    return this.http.request<PaperLeaderboard>({ method: 'GET', path: '/v1/vault-markets/paper/leaderboard', query: week ? { week } : undefined });
  }

  /** Join or leave the weekly leaderboard under a display name you pick. */
  setLeaderboard(input: { optIn: boolean; displayName?: string }) {
    return this.http.request<PaperLeaderboardSetting>({ method: 'PUT', path: '/v1/vault-markets/paper/leaderboard', body: input });
  }
}
