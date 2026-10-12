import type { HttpClient } from './_shared.js';

// ─── The Great Hunt in Crossly World ────────────────────────────────────────
//
// A seasonal hunt across the world's places: three keys in order (Copper,
// Jade, Crystal), each behind a riddle. A key is picked up by WALKING to it in
// the world -- the server sees you standing there -- so there is no verb here
// that takes one. Taking the third opens the Gate in the Commons and puts you
// on the Scoreboard. Prizes are pins (one per key, and a title for the first
// few through the Gate each season); nothing here moves money. Reads need
// activity:read; starting needs world:write.

export type GreatHuntKey = 'copper' | 'jade' | 'crystal';

export interface GreatHuntSeason {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  /** The title the first `titleTop` through the Gate earn (a wearable pin). */
  title: string;
  titleTop: number;
  /** False once it has ended (its Scoreboard still shows until the next). */
  live: boolean;
}

export interface GreatHuntKeyState {
  key: GreatHuntKey;
  name: string;
  colour: string;
  /** The riddle, once it is yours to read (your next key's and every key you hold); null before. */
  clue: string | null;
  /** When you picked it up, or null. */
  heldAt: string | null;
}

export interface GreatHuntProgress {
  season: GreatHuntSeason | null;
  /** You read the first clue this season. */
  started: boolean;
  /** Keys held, 0-3, always in order. */
  held: number;
  keys: GreatHuntKeyState[];
  /** Your place through the Gate this season, when you have cleared it. */
  cleared: { rank: number; at: string; titled: boolean } | null;
}

export interface GreatHuntFinisher {
  rank: number;
  /** Their name in the world, only when they chose to be seen by name; otherwise "A player". */
  name: string;
  /** The name as the Scoreboard monolith draws it: ASCII, short. */
  short: string;
  named: boolean;
  at: string;
  /** Among the first `titleTop`: wears the season's title. */
  titled: boolean;
}

export interface GreatHuntScoreboard {
  season: GreatHuntSeason | null;
  /** The first ten through the Gate, in order. */
  finishers: GreatHuntFinisher[];
  /** Everybody through the Gate this season. */
  total: number;
}

export class WorldHuntResource {
  constructor(private http: HttpClient) {}

  /** Your Great Hunt this season: keys held, riddles you can read, your place through the Gate. */
  mine() {
    return this.http.request<{ data: GreatHuntProgress }>({ method: 'GET', path: '/v1/world/hunt' });
  }

  /** The Scoreboard: the first through the Gate this season (or the last season, between seasons). */
  scoreboard() {
    return this.http.request<{ data: GreatHuntScoreboard }>({ method: 'GET', path: '/v1/world/hunt/scoreboard' });
  }

  /** Read the first riddle: the hunt starts for you this season. Idempotent; 409 between seasons. */
  start() {
    return this.http.request<{ data: GreatHuntProgress }>({ method: 'POST', path: '/v1/world/hunt/start', body: {} });
  }
}
