import type { HttpClient } from './_shared.js';

// ─── Crossly World parties: start, invite, lead, a shared wishlist and chat.
// Reads of your party are spatialParty.

/** A result, as the api returns it. */
export type WorldPartyRecord = Record<string, unknown>;

export class WorldPartiesResource {
  constructor(private readonly http: HttpClient) {}

  /** Start a party (you lead). */
  start() {
    return this.http.request<{ data: WorldPartyRecord }>({ method: 'POST', path: `/v1/world/parties`, body: {} });
  }

  /** Invite a friend to your party. */
  invite(id: string, userId: string) {
    return this.http.request<{ data: WorldPartyRecord }>({ method: 'POST', path: `/v1/world/parties/${encodeURIComponent(id)}/invite`, body: { userId } });
  }

  /** Accept a party invite. */
  acceptInvite(inviteId: string) {
    return this.http.request<{ data: WorldPartyRecord }>({ method: 'POST', path: `/v1/world/parties/invites/${encodeURIComponent(inviteId)}/accept`, body: {} });
  }

  /** Decline a party invite. */
  declineInvite(inviteId: string) {
    return this.http.request<{ data: WorldPartyRecord }>({ method: 'POST', path: `/v1/world/parties/invites/${encodeURIComponent(inviteId)}/decline`, body: {} });
  }

  /** Leave your party. */
  leave(id: string) {
    return this.http.request<{ data: WorldPartyRecord }>({ method: 'POST', path: `/v1/world/parties/${encodeURIComponent(id)}/leave`, body: {} });
  }

  /** As leader, remove a member. */
  kick(id: string, userId: string) {
    return this.http.request<{ data: WorldPartyRecord }>({ method: 'POST', path: `/v1/world/parties/${encodeURIComponent(id)}/kick`, body: { userId } });
  }

  /** As leader, pass the lead. */
  passLeader(id: string, userId: string) {
    return this.http.request<{ data: WorldPartyRecord }>({ method: 'POST', path: `/v1/world/parties/${encodeURIComponent(id)}/leader`, body: { userId } });
  }

  /** Add a listing to the party wishlist. */
  wish(id: string, listing: { listingId: string } | { slug: string }) {
    return this.http.request<{ data: WorldPartyRecord[] }>({ method: 'POST', path: `/v1/world/parties/${encodeURIComponent(id)}/wishlist`, body: listing });
  }

  /** Take a listing off the wishlist. */
  unwish(id: string, listingId: string) {
    return this.http.request<{ data: WorldPartyRecord[] }>({ method: 'DELETE', path: `/v1/world/parties/${encodeURIComponent(id)}/wishlist/${encodeURIComponent(listingId)}` });
  }

  /** Thumb a wishlist listing up or down. */
  vote(id: string, listingId: string, vote: 'up' | 'down' | null) {
    return this.http.request<{ data: WorldPartyRecord[] }>({ method: 'POST', path: `/v1/world/parties/${encodeURIComponent(id)}/wishlist/${encodeURIComponent(listingId)}/vote`, body: { vote } });
  }

  /** Your party chat. */
  chat(id: string) {
    return this.http.request<{ data: WorldPartyRecord }>({ method: 'GET', path: `/v1/world/parties/${encodeURIComponent(id)}/chat` });
  }

  /** Say something in your party chat. */
  say(id: string, text: string) {
    return this.http.request<{ data: WorldPartyRecord }>({ method: 'POST', path: `/v1/world/parties/${encodeURIComponent(id)}/chat`, body: { text } });
  }
}
