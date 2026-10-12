import type { HttpClient } from './_shared.js';

// ─── Fireflies on the Commons lawn in Crossly World ─────────────────────────
//
// After dark, walk up to a lit firefly on the Commons lawn and catch it: each
// firefly once a day and a jar of ten a day, the day in UTC. A catch is made in
// the world (the server checks where your body is and where the firefly is on
// the shared clock), never over the API; nothing is spent or won. Thirty
// catches earn the Firefly Catcher pin. Reads need activity:read.

export interface FireflyView {
  /** Today, UTC: 'YYYY-MM-DD'. */
  day: string;
  /** Fireflies everyone has caught today. */
  today: number;
  mine: {
    /** Your catches today (the jar holds perDay). */
    today: number;
    /** All your catches (the Firefly Catcher pin comes at 30). */
    total: number;
    perDay: number;
  } | null;
}

export class WorldFirefliesResource {
  constructor(private http: HttpClient) {}

  /** The jar: everyone's catches today, and yours. */
  get() {
    return this.http.request<{ data: FireflyView }>({ method: 'GET', path: '/v1/world/fireflies' });
  }
}
