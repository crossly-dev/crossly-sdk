import type { HttpClient } from './_shared.js';

// ─── The Wishing Fountain in Crossly World ──────────────────────────────────
//
// Stand at the Commons fountain's rim and toss a coin: one wish a day, the day
// in UTC. A wish is made in the world (the server checks where your body is),
// never over the API; the coin is a gesture, nothing is spent or won. Wishes on
// seven different days earn the Wishmaker pin. Reads need activity:read.

export interface WishView {
  /** Today, UTC: 'YYYY-MM-DD'. */
  day: string;
  /** Wishes everyone has made today. */
  today: number;
  mine: {
    madeToday: boolean;
    /** Days you have wished on (the Wishmaker pin comes at 7). */
    days: number;
    /** When tomorrow's wish opens (UTC midnight), ISO. */
    nextAt: string;
  } | null;
}

export class WorldWishesResource {
  constructor(private http: HttpClient) {}

  /** The fountain: everyone's wishes today, and yours. */
  get() {
    return this.http.request<{ data: WishView }>({ method: 'GET', path: '/v1/world/wishes' });
  }
}
