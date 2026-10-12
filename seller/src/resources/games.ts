import type { HttpClient } from './_shared.js';

// ─── Crossly World market games (read-only) ─────────────────────────────────
//
// Price Guess (guess what a real item really sold for), scavenger hunts in
// shops (find every token, unlock the seller's coupon), pack breaks on a
// shop's stage, and speed trades at trade tables. Games are played inside the
// world; over v1 you can read the record. No game takes money or pays cash:
// prizes are pins, a few capped Crossly Bucks (when the operator turns them
// on) and sellers' own coupons. A break spot is bought on crossly.net.

export type GameKind = 'price_guess' | 'price_guess_solo' | 'hunt' | 'speed_trade' | 'break_host';

export interface GameResult {
  id: string;
  game: GameKind;
  /** The round, hunt, trade (or table) or break it was. */
  refId: string;
  score: number;
  won: boolean;
  /** Crossly Bucks won, in cents, after the daily cap. 0 while prizes are pins only. */
  prizeCents: number;
  detail: Record<string, unknown>;
  createdAt: string;
}

export interface HuntUnlock { huntId: string; title: string; place: string; code: string; reward: string; unlockedAt: string }

export interface BreakHit {
  id: string;
  breakId: string;
  breakTitle: string;
  spot: string;
  title: string;
  imageUrl: string | null;
  /** The order the spot's hits ship with. */
  orderId: string | null;
  at: string;
}

export interface LiveHunt {
  id: string;
  title: string;
  /** Where to walk: the boutique, or for a hunt at a pop-up stall the street (slug) with the seller's name. */
  shop: { name: string; slug: string };
  /** Set when the tokens are hidden at the seller's pop-up stall on that street, not in their boutique. */
  stall?: { bookingId: string } | null;
  tokens: number;
  /** What finishing unlocks ("10% off"). Never the code. */
  reward: string;
  endsAt: string;
  finishers: number;
}

export interface StagedBreak {
  breakId: string;
  title: string;
  product: string | null;
  status: string;
  startsAt: string | null;
  live: boolean;
  shop: { name: string; slug: string };
  /** The break's page on crossly.net -- the only place a spot is bought. Null once sold out. */
  buyUrl: string | null;
  spotsLeft: number;
  spots: Array<{ id: string; label: string; taken: boolean; buyer: string | null }>;
  hits: Array<{ id: string; breakId: string; spotId: string; spot: string; title: string; imageUrl: string | null; buyer: string | null; at: string }>;
}

export type LeaderboardGame = 'price_guess' | 'hunt' | 'speed_trade';

export interface LeaderboardRow {
  rank: number;
  /** Their name in the world, only when they chose to be seen by name; otherwise "A player". */
  name: string;
  /** The name as Crossly World's 3D boards draw it: ASCII, at most 18 characters. */
  short: string;
  named: boolean;
  /** Wins (Price Guess), hunts finished, speed trades won. */
  value: number;
  /** Price Guess only: total points, the tie-break. */
  score?: number;
}

export interface LeaderboardBoard { game: LeaderboardGame; period: 'week' | 'all'; label: string; unit: string; rows: LeaderboardRow[] }

export interface Leaderboards { week: LeaderboardBoard[]; all: LeaderboardBoard[]; weekStartsAt: string }

export class GamesResource {
  constructor(private http: HttpClient) {}

  /** Your results, newest first; meta carries your hunt coupons and your break hits. */
  myResults() {
    return this.http.request<{ data: GameResult[]; meta?: { unlocks?: HuntUnlock[]; hits?: BreakHit[] } }>({ method: 'GET', path: '/v1/games/results/mine' });
  }

  /** Scavenger hunts running now (optionally in one shop). */
  liveHunts(params: { place?: string } = {}) {
    const query: Record<string, string> = {};
    if (params.place) query.place = params.place;
    return this.http.request<{ data: LiveHunt[] }>({ method: 'GET', path: '/v1/games/hunts', query });
  }

  /** Pack breaks staged on shop stages, live first then soonest. */
  upcomingBreaks() {
    return this.http.request<{ data: StagedBreak[] }>({ method: 'GET', path: '/v1/games/breaks/upcoming' });
  }

  /** Top ten per game, this week (Monday 00:00 UTC on) and all time. */
  leaderboards() {
    return this.http.request<{ data: Leaderboards }>({ method: 'GET', path: '/v1/games/leaderboards' });
  }
}
