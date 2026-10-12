import type { HttpClient } from './_shared.js';

// ─── Crossly World parties (read-only) ──────────────────────────────────────
//
// A party is up to 8 friends moving through Crossly World together: they land
// in the same copy of a room, talk on a private party channel, and keep a
// shared wishlist with thumbs up/down. Parties are formed and used inside the
// world; over v1 you can read the record. The party never pays: each member
// checks out on their own.

export type PartyRole = 'leader' | 'member';
export type PartyVote = 'up' | 'down';

export interface PartyMember {
  userId: string;
  name: string;
  role: PartyRole;
  joinedAt: string;
  /** The place they are in right now (its slug), or null when not in the world. */
  place: string | null;
  placeName: string | null;
  /** Which copy of that place (1 = the place itself). */
  copy: number | null;
}

export interface PartyInvite {
  id: string;
  partyId: string;
  inviteeUserId: string;
  inviteeName: string;
  inviterUserId: string;
  inviterName: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  expiresAt: string;
}

export interface Party {
  id: string;
  leaderUserId: string;
  createdAt: string;
  members: PartyMember[];
  /** Pending invites this party has out. */
  invites: PartyInvite[];
}

export interface MyParty {
  party: Party | null;
  /** Invites waiting for you. */
  invites: PartyInvite[];
}

export interface PartyWish {
  listingId: string;
  /** Shop slug while the listing is live, else null. */
  slug: string | null;
  title: string;
  priceCents: number | null;
  imageUrl: string | null;
  addedBy: string;
  addedByName: string;
  createdAt: string;
  /** userId -> vote. */
  votes: Record<string, PartyVote>;
  up: number;
  down: number;
}

export class SpatialPartyResource {
  constructor(private http: HttpClient) {}

  /** Your party (null when you are in none) and the invites waiting for you. */
  get() {
    return this.http.request<MyParty>({ method: 'GET', path: '/v1/spatial/party' });
  }

  /** Your party's shared wishlist with every member's thumb. Empty when you are in no party. */
  wishlist() {
    return this.http.request<{ data: PartyWish[] }>({ method: 'GET', path: '/v1/spatial/party/wishlist' });
  }
}
