import type { HttpClient } from './_shared.js';

// ─── Crossly World emotes (read-only) ───────────────────────────────────────
//
// Emotes are PLAYED in a room over the presence socket, where the server
// verifies and broadcasts them. Over v1 you can read the record: which emote
// packs a person's quests unlocked (earned, never bought), their 8-slot wheel,
// and the moment emotes they earned -- unbox (a Crossly purchase delivered),
// slab_flip (a card graded through Crossly Grading), handshake (a trade-table
// shake settled) -- each playable once.

export type MomentKind = 'unbox' | 'slab_flip' | 'handshake';

export interface MomentPayload {
  title: string;
  imageUrl: string | null;
  /** slab_flip: the grade as printed ("PSA 10"). */
  grade?: string;
}

export interface Moment {
  id: string;
  kind: MomentKind;
  payload: MomentPayload;
  earnedAt: string;
  /** Null until it is played in a room. */
  playedAt: string | null;
}

export interface EmotePack {
  key: string;
  label: string;
  unlocked: boolean;
  quest: { key: string; pin: string; goal: string } | null;
  emotes: Array<{ id: string; label: string }>;
}

export interface WheelEntry {
  slot: string;
  label: string;
  locked: boolean;
  unlockHint?: string;
  ready: boolean;
  readyCount: number;
}

export interface MyEmotes {
  packs: EmotePack[];
  /** Eight slots: an emote id, 'showoff', 'moment:<kind>', or null. */
  wheel: Array<string | null>;
  view: Array<WheelEntry | null>;
  /** Earned and not yet played. */
  moments: Array<Omit<Moment, 'playedAt'>>;
}

export class SpatialEmotesResource {
  constructor(private http: HttpClient) {}

  /** Your packs, your wheel (stored and as it shows) and your ready moments. */
  get() {
    return this.http.request<MyEmotes>({ method: 'GET', path: '/v1/spatial/emotes' });
  }

  /** Your moments, newest first. `ready: true` lists only the unplayed ones. */
  moments(params: { limit?: number; ready?: boolean } = {}) {
    const query: Record<string, string> = {};
    if (params.limit != null) query.limit = String(params.limit);
    if (params.ready != null) query.ready = String(params.ready);
    return this.http.request<{ data: Moment[] }>({ method: 'GET', path: '/v1/spatial/moments', query });
  }
}
