import type { HttpClient } from './_shared.js';

// ─── You in Crossly World: blocks, jobs, bans, identity and a few reads ───
//
// Unblock, cancel / claim / release job shifts, answer price checks, lift a
// ban from your place, choose named or anonymous, keep your look on the account,
// share your fit value, and
// read what you can show off, which friends are here and your trades. Posting
// a shift is not here: it commits pay at settle, and an app token never moves
// money.

/** A world read or write result, as the api returns it. */
export type WorldAccountRecord = Record<string, unknown>;

export class WorldAccountResource {
  constructor(private readonly http: HttpClient) {}

  /** Unblock somebody (by the block id from world.blocks()). */
  unblock(blockId: string) {
    return this.http.request<{ data: WorldAccountRecord }>({ method: 'DELETE', path: `/v1/world/blocks/${encodeURIComponent(blockId)}` });
  }

  /** Cancel a shift you posted that nobody has worked yet. */
  cancelShift(shiftId: string) {
    return this.http.request<{ data: WorldAccountRecord }>({ method: 'DELETE', path: `/v1/world/jobs/shifts/${encodeURIComponent(shiftId)}` });
  }

  /** Claim an open shift. */
  claimShift(shiftId: string) {
    return this.http.request<{ data: WorldAccountRecord }>({ method: 'POST', path: `/v1/world/jobs/shifts/${encodeURIComponent(shiftId)}/claim`, body: {} });
  }

  /** Give a claimed shift back. */
  releaseShift(shiftId: string) {
    return this.http.request<{ data: WorldAccountRecord }>({ method: 'POST', path: `/v1/world/jobs/shifts/${encodeURIComponent(shiftId)}/release`, body: {} });
  }

  /** Answer a price check with your estimate in cents. */
  answerPriceCheck(requestId: string, valueCents: number, note?: string | null) {
    return this.http.request<{ data: WorldAccountRecord }>({ method: 'POST', path: `/v1/world/jobs/appraisals/${encodeURIComponent(requestId)}/answers`, body: { valueCents, note } });
  }

  /** Who is banned from a place you own. */
  bans(slug: string) {
    return this.http.request<{ data: WorldAccountRecord[] }>({ method: 'GET', path: `/v1/world/places/${encodeURIComponent(slug)}/bans` });
  }

  /** Lift a ban from a place you own. */
  unban(slug: string, userId: string) {
    return this.http.request<{ data: WorldAccountRecord }>({ method: 'DELETE', path: `/v1/world/places/${encodeURIComponent(slug)}/bans/${encodeURIComponent(userId)}` });
  }

  /** Named or anonymous in the world; null if never chosen. */
  identity() {
    return this.http.request<{ data: WorldAccountRecord }>({ method: 'GET', path: '/v1/world/avatar/identity' });
  }

  /** Choose named or anonymous (applies when you next join a room). */
  setIdentity(choice: 'named' | 'anonymous') {
    return this.http.request<{ data: WorldAccountRecord }>({ method: 'PUT', path: '/v1/world/avatar/identity', body: { choice } });
  }

  /** Your world look on the account (handle or null for anonymous, and appearance); null if never made. */
  look() {
    return this.http.request<{ data: WorldAccountRecord }>({ method: 'GET', path: '/v1/world/avatar/look' });
  }

  /** Save your world look to the account so every device starts from it. */
  setLook(look: { tone: number; role: number } | null, appearance: Record<string, unknown>) {
    return this.http.request<{ data: WorldAccountRecord }>({ method: 'PUT', path: '/v1/world/avatar/look', body: { look, appearance } });
  }

  /** Whether people in a room can see what your outfit is worth. */
  shareFitValue(share: boolean) {
    return this.http.request<{ data: WorldAccountRecord }>({ method: 'PUT', path: '/v1/world/fit-value/share', body: { share } });
  }

  /** What a show-off emote can hold up. */
  showable() {
    return this.http.request<{ data: WorldAccountRecord }>({ method: 'GET', path: '/v1/world/emotes/showable' });
  }

  /** Your friends in the world right now. */
  friendsHere() {
    return this.http.request<{ data: WorldAccountRecord[] }>({ method: 'GET', path: '/v1/world/friends/here' });
  }

  /** Your trades and each item through the authentication gate. */
  myTrades() {
    return this.http.request<{ data: WorldAccountRecord[] }>({ method: 'GET', path: '/v1/world/trades/mine' });
  }
}
