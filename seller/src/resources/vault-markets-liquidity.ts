import type { HttpClient, IdempotencyOpts, JsonObject } from './_shared.js';
import type { PlaceProOrderBody, ProFunding, ProOrder } from './vault-markets-pro.js';

// ─── Vault Markets liquidity: ways out of (and into) a vault position ───────
//
// `client.vaultMarkets.liquidity`. Instant Exit (sell a unit now into the best
// bid), the offers inbox on what you hold, recurring whole-unit buys, linked
// orders (brackets, OCO pairs, trailing stops, position take-profit /
// stop-loss), liquidation prices and rate history, and the dealer program
// (standing bids and Instant Exit bands). Every money field is integer CENTS
// of US dollars; rates and bands are basis points. Reads need
// `vault-markets:read`, anything that places or cancels `vault-markets:trade`.
// Dealer approval is ops-only and not on /v1.

export type VaultRecurringEvery = 'weekly' | 'biweekly' | 'monthly';
export type VaultLinkKind = 'bracket' | 'oco' | 'trailing' | 'position_exit';

export interface VaultInstantExitBody {
  vaultItemId: string;
  /** The quoted price, in cents; refused (with the new quote) if the best bid fell below it. */
  priceCents: number;
  /** Your own id; selling twice with it returns the first order. */
  clientOrderId?: string;
}

export interface VaultOfferAlertBody {
  bookKey: string;
  /** A bid at or above this always notifies you, in cents; `null` clears it. */
  alertCents: number | null;
  /** Mute (or unmute) offer notices on this key. */
  muted?: boolean;
}

interface VaultRecurringFields {
  /** Price cap per unit, in cents. */
  maxPriceCents?: number | null;
  /** Price cap as basis points over the mark (0-5000). */
  capBpsOverMark?: number | null;
  funding?: ProFunding;
  stripePaymentMethodId?: string | null;
  /** A second saved card tried when the first is declined. */
  backupPaymentMethodId?: string | null;
  /** Turn lending on for every unit bought. */
  autoLend?: boolean;
}

/** Set `maxPriceCents`, `capBpsOverMark`, or both. */
export interface CreateVaultRecurringBody extends VaultRecurringFields {
  bookKey: string;
  every: VaultRecurringEvery;
  /** ISO time of the first run (default: now). */
  startAt?: string;
}

export interface UpdateVaultRecurringBody extends VaultRecurringFields {
  every?: VaultRecurringEvery;
  /** false pauses, true resumes. */
  active?: boolean;
}

/** An entry order with a take-profit and/or stop-loss (cents) attached. */
export interface VaultBracketBody extends PlaceProOrderBody {
  takeProfitCents?: number;
  stopLossCents?: number;
}

/** Set `trailBps` or `trailCents`, not both. */
export interface VaultTrailingStopBody {
  bookKey: string;
  side: 'buy' | 'sell';
  quantity: number;
  trailBps?: number;
  trailCents?: number;
  funding?: ProFunding;
  stripePaymentMethodId?: string;
  clientOrderId?: string;
}

export interface VaultPositionExitsBody {
  /** In cents; `null` clears it. */
  takeProfitCents: number | null;
  stopLossCents: number | null;
}

export interface VaultDealerBidBody {
  bookKey: string;
  /** `gtc` (default) or `gtd` with `expiresAt`. */
  tif?: 'gtc' | 'gtd';
  quantity: number;
  /** In cents. */
  limitCents: number;
  expiresAt?: string;
  displayQuantity?: number;
  funding?: ProFunding;
  stripePaymentMethodId?: string;
  clientOrderId?: string;
}

export interface VaultDealerBandBody {
  bookKey: string;
  /** Share of the mark the standing bid is kept at, basis points (5000-10000). */
  bandBps: number;
  units: number;
  /** Never bid above this, in cents. */
  maxPriceCents: number;
  funding?: ProFunding;
  stripePaymentMethodId?: string;
  active?: boolean;
}

const id = (s: string) => encodeURIComponent(s);

export class VaultMarketsLiquidityResource {
  constructor(private http: HttpClient) {}

  /** The Instant Exit quote for one vault unit you hold: best bid, its share of the mark, depth, and whether it can be taken now. */
  instantExitQuote(vaultItemId: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/instant-exit', query: { vaultItemId } });
  }

  /** Instant Exit quotes for everything you hold, one per book key. */
  instantExitHoldings() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/instant-exit/holdings' });
  }

  /** Sell a unit now at the quoted price (a sell IOC through the pro engine). Crossly never buys or funds it. */
  instantExit(body: VaultInstantExitBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/instant-exit', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your Instant Exits, newest first. */
  instantExitHistory() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/instant-exit/history' });
  }

  /** For each book key you hold: the best bid from someone else, the top levels, the mark and your alert. */
  offers() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/offers' });
  }

  /** Set (or clear) the bid price that always notifies you on a key you hold; mute or unmute it. */
  setOfferAlert(body: VaultOfferAlertBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'PUT', path: '/v1/vault-markets/offers/alert', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your recurring buys. */
  recurring() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/recurring' });
  }

  /** Start a recurring buy: one whole unit every week, two weeks or month, under a price cap. */
  createRecurring(body: CreateVaultRecurringBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/recurring', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Change a recurring buy, or pause / resume it with `active`. */
  updateRecurring(recurringId: string, body: UpdateVaultRecurringBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'PATCH', path: `/v1/vault-markets/recurring/${id(recurringId)}`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Stop a recurring buy for good; its history stays. */
  cancelRecurring(recurringId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'DELETE', path: `/v1/vault-markets/recurring/${id(recurringId)}`, idempotencyKey: opts.idempotencyKey });
  }

  /** One recurring buy's runs (filled, skipped with the reason, or failed). */
  recurringRuns(recurringId: string, limit?: number) {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: `/v1/vault-markets/recurring/${id(recurringId)}/runs`, query: limit ? { limit } : undefined });
  }

  /** Every run of all your recurring buys, newest first. */
  allRecurringRuns(limit?: number) {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/recurring-runs', query: limit ? { limit } : undefined });
  }

  /** A buy with a take-profit and/or stop-loss attached; the exits arm as an OCO pair for what fills. */
  placeBracket(body: VaultBracketBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/pro/brackets', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Two orders on one key; when one fills or triggers, the other is cancelled. */
  placeOco(body: { a: PlaceProOrderBody; b: PlaceProOrderBody }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/pro/oco', body, idempotencyKey: opts.idempotencyKey });
  }

  /** A trailing stop that follows the best price since it was placed. */
  placeTrailingStop(body: VaultTrailingStopBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/pro/trailing-stops', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your linked orders: live (default) or done, optionally of one kind. */
  links(params: { status?: 'live' | 'done'; kind?: VaultLinkKind } = {}) {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/pro/links', query: params });
  }

  /** Cancel a linked order: its open child orders come off; a bracket's entry stays. */
  cancelLink(linkId: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/pro/links/${id(linkId)}/cancel`, idempotencyKey: opts.idempotencyKey });
  }

  /** A position's take-profit / stop-loss, if set. */
  positionExits(positionId: string) {
    return this.http.request<{ exits: JsonObject | null }>({ method: 'GET', path: `/v1/vault-markets/positions/${id(positionId)}/exits` });
  }

  /** Set a position's take-profit / stop-loss; both null clears them. */
  setPositionExits(positionId: string, body: VaultPositionExitsBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'PUT', path: `/v1/vault-markets/positions/${id(positionId)}/exits`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** Every live position's call and liquidation marks and the distance to them. */
  positionsRisk() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/positions-risk' });
  }

  /** One position's call and liquidation marks. */
  positionRisk(positionId: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/positions/${id(positionId)}/risk` });
  }

  /** Daily borrow APR and pool APR on a book key, oldest first (default 90 days). */
  rates(bookKey: string, days?: number) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/rates', query: { bookKey, days } });
  }

  /** Your dealer status and Instant Exit bands. */
  dealer() {
    return this.http.request<{ dealer: JsonObject | null; bands: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/dealer' });
  }

  /** Apply to be a dealer (ID check first); ops review it. */
  applyDealer(body: { businessName?: string; note?: string } = {}, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/dealer/apply', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your standing dealer bids: open (default) or all. */
  dealerBids(status?: 'open' | 'all') {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/dealer/bids', query: status ? { status } : undefined });
  }

  /** Place a standing dealer bid (approved dealers only). */
  placeDealerBid(body: VaultDealerBidBody, opts: IdempotencyOpts = {}) {
    return this.http.request<ProOrder>({ method: 'POST', path: '/v1/vault-markets/dealer/bids', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your Instant Exit bands and whether each is being kept now. */
  bands() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/dealer/bands' });
  }

  /** Commit to an Instant Exit band on a key, re-quoted as the mark moves. */
  setBand(body: VaultDealerBandBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'PUT', path: '/v1/vault-markets/dealer/bands', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Stop a band on a key; its standing bid comes off. */
  stopBand(bookKey: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'DELETE', path: '/v1/vault-markets/dealer/bands', query: { bookKey }, idempotencyKey: opts.idempotencyKey });
  }
}
