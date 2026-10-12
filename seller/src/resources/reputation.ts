import type { HttpClient } from './_shared.js';

// ─── Reputation levels + jobs in Crossly World ─────────────────────────────
//
// Four tracks (trader, collector, seller, host) earned from real activity --
// completed trades, graded slabs, sales shipped on time, Space events run --
// weighted by recency (points halve every 180 days); a lost dispute costs
// points. Nothing buys a level. Jobs: shop-staff and grading-desk shifts
// worked in person in the world, and price checks answered by appraisers.
// While Crossly has jobs pay off (`payOn: false`), work is recorded, not paid.

export type RepTrack = 'trader' | 'collector' | 'seller' | 'host';

export interface RepLine { kind: string; label: string; count: number; points: number }
export interface RepTrackView { track: RepTrack; label: string; points: number; level: number; nextAt: number | null; lines: RepLine[] }
export interface RepUnlock { track: RepTrack; level: number; key: string; label: string }

export interface Reputation {
  tracks: Record<RepTrack, RepTrackView>;
  /** The nameplate badge: the highest level, or null below level 1 everywhere. */
  top: { track: RepTrack; level: number } | null;
  computedAt: string | null;
  unlocks: Record<RepTrack, { have: RepUnlock[]; next: RepUnlock | null }>;
}

export interface PublicReputation {
  profile: string;
  name: string;
  levels: Record<RepTrack, number>;
  top: { track: RepTrack; level: number } | null;
}

export interface JobShift {
  id: string;
  role: 'shop_staff' | 'hub_helper';
  title: string;
  place: { slug: string; name: string };
  startsAt: string;
  endsAt: string;
  payCents: number;
  rail: 'bucks' | 'cbx';
  status: 'open' | 'claimed' | 'worked' | 'paid' | 'missed' | 'cancelled';
  presentSeconds: number;
  requiredSeconds: number;
  claimedByYou: boolean;
  postedByYou: boolean;
  worker: string | null;
  paid: boolean;
}

export interface AppraisalRequest {
  id: string;
  category: string;
  title: string;
  skuId: string | null;
  note: string | null;
  bountyCents: number;
  rail: 'bucks' | 'cbx';
  status: 'open' | 'accepted' | 'closed';
  closesAt: string;
  createdAt: string;
  answers: number;
  mine: boolean;
}

export interface JobsMeta { payOn: boolean; payNote: string | null }

export class ReputationResource {
  constructor(private http: HttpClient) {}

  /** Your reputation card. */
  mine() {
    return this.http.request<Reputation>({ method: 'GET', path: '/v1/reputation/mine' });
  }

  /** Somebody's public levels by storefront handle (404 when unknown). */
  get(profile: string) {
    return this.http.request<PublicReputation>({ method: 'GET', path: `/v1/reputation/${encodeURIComponent(profile)}` });
  }

  /** Open shifts on the Jobs board, soonest first. */
  openShifts(params: { limit?: number } = {}) {
    return this.http.request<{ data: JobShift[]; meta: JobsMeta }>({ method: 'GET', path: '/v1/jobs/shifts', query: params });
  }

  /** Open price checks for appraisers, newest first. */
  openAppraisals(params: { category?: string; limit?: number } = {}) {
    return this.http.request<{ data: AppraisalRequest[]; meta: JobsMeta }>({ method: 'GET', path: '/v1/jobs/appraisals', query: params });
  }
}
