import type { HttpClient } from './_shared.js';

// ─── Skill contests on Crossly World games ────────────────────────────────
//
// Contests on a game placed in the world: entry free, sponsored or paid
// (paid runs only where the operator allows it, adults only), prizes by place
// in CBX, COSM, design editions, store items or pins. The outcome is decided by
// the scores the game's server-side logic reports. Reads need inventory:read;
// entering needs world:write; setting one up needs world:create.

export type ContestRecord = Record<string, unknown>;

/** One row of the standings: a player's public name, best score, place, when they got there, and whether it is you. */
export interface ContestStanding { name: string; best: number; place: number; at: string; isYou: boolean }

export interface ContestInput {
  title: string;
  /** The game: a placed interactive object's instance id. */
  game: string;
  entry: { mode: 'free' | 'sponsored' | 'paid'; feeCents?: number };
  prizes: Array<{ from: number; to: number; kind: 'cbx' | 'cosm' | 'cosm_design' | 'item' | 'pin'; amount: number; ref?: string }>;
  funder: 'crossly_events' | 'creator' | 'sponsor' | 'entry_fees';
  sponsorName?: string;
  startsAt: string;
  endsAt: string;
  attempts: number;
  maxEntrants?: number;
  minAge?: number;
}

export class WorldContestsResource {
  constructor(private readonly http: HttpClient) {}

  /** Open contests, soonest ending first. */
  list() {
    return this.http.request<{ data: ContestRecord[] }>({ method: 'GET', path: '/v1/world/contests' });
  }

  /** Your entries and prizes. */
  mine() {
    return this.http.request<{ data: { entries: ContestRecord[]; prizes: ContestRecord[] } }>({ method: 'GET', path: '/v1/world/contests/mine' });
  }

  /** A contest's standings now. */
  standings(id: string) {
    return this.http.request<{ data: ContestStanding[] }>({ method: 'GET', path: `/v1/world/contests/${encodeURIComponent(id)}/standings` });
  }

  /** Set up a contest on a game placed in your place. */
  create(input: ContestInput) {
    return this.http.request<{ data: ContestRecord }>({ method: 'POST', path: '/v1/world/contests', body: input });
  }

  /** Enter a contest; a paid one answers a client secret to pay the fee. */
  join(id: string) {
    return this.http.request<{ data: { entryId: string; payment: { clientSecret: string | null } | null } }>({ method: 'POST', path: `/v1/world/contests/${encodeURIComponent(id)}/join`, body: {} });
  }

  /** Settle a paid entry's fee (safe to repeat). */
  settlePayment(entryId: string) {
    return this.http.request<{ data: { paymentState: string } }>({ method: 'POST', path: `/v1/world/contests/entries/${encodeURIComponent(entryId)}/settle-payment`, body: {} });
  }
}
