import type { HttpClient } from './_shared.js';

// ─── The Trading Floor in Crossly World ─────────────────────────────────────
//
// `client.vaultMarkets.floor`. The world room where the Vault Markets tape
// streams overhead as light: the newest trades on every vault book (the
// market and the price, never who traded), the big board of the most-traded
// markets, and the Market Open bell. Every price is a trade on the Crossly
// order book. It is read-only: nothing can be traded in the room. Money
// fields are integer CENTS of US dollars. Reads need vault-markets:read.

/** Who took the liquidity: `buy` lifted an ask, `sell` hit a bid, `cross` cleared in an auction. */
export type VaultFloorSide = 'buy' | 'sell' | 'cross';

export interface VaultFloorTrade {
  id: string;
  bookKey: string;
  /** The piece, its variant and grade (ASCII). */
  name: string;
  priceCents: number;
  /** "$1,234". */
  priceText: string;
  side: VaultFloorSide;
  /** Seconds since the match. */
  ageS: number;
}

export interface VaultFloorTicker {
  bookKey: string;
  name: string;
  imageUrl: string | null;
  /** The last trade's price. */
  lastCents: number;
  priceText: string;
  /** The move from the last trade before today, or null when there was none. */
  changeBps: number | null;
  changeText: string;
  trades24h: number;
  /** The book's display mark, when its quality is A, B or C. */
  markCents: number | null;
  markQuality: 'A' | 'B' | 'C' | 'none';
  /** The market's page on crossly.net. */
  href: string;
}

export interface VaultFloorBell {
  /** A Market Open key went live in the last ten minutes. */
  ringing: boolean;
  title: string | null;
  line: string | null;
  /** When the ringing key opened (ISO). */
  liveAt: string | null;
  marketHref: string | null;
  /** The next key to open, as a board line. */
  next: string | null;
}

export interface VaultFloorView {
  /** Newest first, at most 40, from the last day. */
  trades: VaultFloorTrade[];
  tickers: VaultFloorTicker[];
  bell: VaultFloorBell;
  /** Trades on every vault book in the last 24 hours. */
  trades24h: number;
  updatedAt: string;
}

export class VaultMarketsFloorResource {
  constructor(private http: HttpClient) {}

  /** The Trading Floor now: the tape, the big board and the Market Open bell. */
  get() {
    return this.http.request<VaultFloorView>({ method: 'GET', path: '/v1/vault-markets/world/floor' });
  }
}
