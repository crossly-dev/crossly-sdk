import type { HttpClient } from './_shared.js';

// ─── Kites on the Commons lawn of Crossly World ────────────────────────────
//
// By day, out on the Commons lawn, fly a kite that everyone in the plaza sees
// ride the wind on its line: five a day, the day in UTC.
// A kite is flown in the world (the server checks where your body is),
// never over the API; nothing is spent or won. Kites on five different days
// earn the Kite flyer pin. Reads need activity:read.

export interface KiteView {
  /** Today, UTC: 'YYYY-MM-DD'. */
  day: string;
  /** Kites everyone has flown today. */
  today: number;
  mine: {
    /** Yours today (perDay a day). */
    today: number;
    perDay: number;
    /** Days you have flown one on (the Kite flyer pin comes at 5). */
    days: number;
  } | null;
}

export class WorldKitesResource {
  constructor(private http: HttpClient) {}

  /** The lawn: everyone's kites today, and yours. */
  get() {
    return this.http.request<{ data: KiteView }>({ method: 'GET', path: '/v1/world/kites' });
  }
}
