import type { HttpClient } from './_shared.js';

// ─── Vault Markets auto-deleveraging (ADL) ──────────────────────────────────
//
// `client.vaultMarkets.adl`. The loss waterfall: a position's own money, then
// the insurance fund (at most 25% of it for one event), then ADL: the most
// profitable, most levered opposite position on the same item closes against
// the bankrupt one at its bankruptcy price. Only then the market pool or
// Crossly operations; never Crossly money. Reads only. Money fields are
// integer CENTS of US dollars.

export type AdlSide = 'long' | 'short';
/** pending (waiting for the short's proceeds to be final) | sent | settled | refused (ops) | reversed (custodian refused; undone) | void (nothing to give) | unknown (ops). */
export type AdlEventStatus = 'pending' | 'sent' | 'settled' | 'refused' | 'reversed' | 'void' | 'unknown';

export interface AdlPublicEvent {
  bookKey: string;
  /** The side that went under water. */
  bankruptSide: AdlSide;
  priceCents: number;
  units: number;
  markCents: number;
  status: AdlEventStatus;
  createdAt: string;
}

export interface AdlFund {
  /** The insurance fund as booked. */
  insuranceFundCents: number;
  /** Free to draw now: booked, less every draw already promised. */
  insuranceFreeCents: number;
  perEventCapBps: number;
  /** The most one event may draw before ADL starts. */
  perEventCapCents: number;
  adlEvents30d: number;
  lastAdlAt: string | null;
  recentEvents: AdlPublicEvent[];
  /** The waterfall, in order, in plain words. */
  waterfall: string[];
  asOf: string;
}

export interface AdlRankView {
  positionId: string;
  bookKey: string;
  kind: AdlSide;
  status: string;
  /** 5 = first in line, 1 = last, 0 = not in the queue (only profitable positions are). */
  lights: number;
  /** 1 = first in line; null when not in the queue. */
  rank: number | null;
  /** How many positions are in this item queue on this side. */
  of: number;
  /** P&L over your own margin, in bps. */
  pnlBps: number | null;
  /** Notional over your equity at the mark, x100. */
  effLeverageX100: number | null;
  markCents: number | null;
  text: string;
}

export interface AdlRankList {
  data: AdlRankView[];
}

export interface MyAdlEvent {
  id: string;
  /** unit = a unit moved at the bankruptcy price; cash = a give-up at settlement. */
  kind?: 'unit' | 'cash';
  bookKey: string;
  /** bankrupt = your position went under water; counterparty = yours was first in line. */
  role: 'bankrupt' | 'counterparty';
  side: AdlSide;
  positionId: string;
  /** The bankruptcy price both positions closed at, per unit. */
  priceCents: number;
  units: number;
  /** What the short paid the long. */
  cents: number;
  markCents: number;
  status: AdlEventStatus;
  createdAt: string;
  settledAt: string | null;
}

export interface MyAdlEventList {
  data: MyAdlEvent[];
}

const id = (s: string) => encodeURIComponent(s);

export class VaultMarketsAdlResource {
  constructor(private http: HttpClient) {}

  /** The insurance fund, the per-event cap, the waterfall and the latest ADL events. */
  fund() {
    return this.http.request<AdlFund>({ method: 'GET', path: '/v1/vault-markets/adl' });
  }

  /** Your live positions with their ADL lights. */
  positions() {
    return this.http.request<AdlRankList>({ method: 'GET', path: '/v1/vault-markets/adl/positions' });
  }

  /** One of your positions with its ADL lights. */
  position(positionId: string) {
    return this.http.request<AdlRankView>({ method: 'GET', path: `/v1/vault-markets/adl/positions/${id(positionId)}` });
  }

  /** The ADL events your positions were part of, newest first. */
  events() {
    return this.http.request<MyAdlEventList>({ method: 'GET', path: '/v1/vault-markets/adl/events' });
  }
}
