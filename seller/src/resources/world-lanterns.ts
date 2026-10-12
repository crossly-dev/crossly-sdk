import type { HttpClient } from './_shared.js';

// ─── Sky lanterns in the Commons of Crossly World ────────────────────────────
//
// At the lantern stand by the Commons walk-in, release a paper lantern that
// everyone in the plaza sees rise and drift away: three a day, the day in UTC.
// A lantern is released in the world (the server checks where your body is),
// never over the API; nothing is spent or won. Lanterns on five different days
// earn the Lantern lighter pin. Reads need activity:read.

export interface LanternView {
  /** Today, UTC: 'YYYY-MM-DD'. */
  day: string;
  /** Lanterns everyone has released today. */
  today: number;
  mine: {
    /** Yours today (perDay a day). */
    today: number;
    perDay: number;
    /** Days you have released one on (the Lantern lighter pin comes at 5). */
    days: number;
  } | null;
}

export class WorldLanternsResource {
  constructor(private http: HttpClient) {}

  /** The stand: everyone's lanterns today, and yours. */
  get() {
    return this.http.request<{ data: LanternView }>({ method: 'GET', path: '/v1/world/lanterns' });
  }
}
