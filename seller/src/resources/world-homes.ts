import type { HttpClient } from './_shared.js';

// ─── Your Crossly World home and other people's: privacy and theme, layout,
// co-building, guestbooks, and asking whether an owner would sell a piece.

/** A result, as the api returns it. */
export type WorldHomeRecord = Record<string, unknown>;

export class WorldHomesResource {
  constructor(private readonly http: HttpClient) {}

  /** Your home: privacy, theme, wall/floor/mood. */
  update(input: { privacy?: string; theme?: string; decor?: { wall?: string | null; floor?: string | null; mood?: string | null } | null }) {
    return this.http.request<{ data: WorldHomeRecord }>({ method: 'PATCH', path: `/v1/world/home`, body: input });
  }

  /** Arrange your home. */
  saveLayout(layout: unknown[]) {
    return this.http.request<{ data: WorldHomeRecord }>({ method: 'PUT', path: `/v1/world/home/layout`, body: { layout } });
  }

  /** What you can place in your home. */
  placeable() {
    return this.http.request<{ data: WorldHomeRecord }>({ method: 'GET', path: `/v1/world/home/placeable` });
  }

  /** Homes you co-build. */
  building() {
    return this.http.request<{ data: WorldHomeRecord[] }>({ method: 'GET', path: `/v1/world/home/building` });
  }

  /** Rearrange a home you co-build. */
  saveLayoutAsBuilder(slug: string, layout: unknown[]) {
    return this.http.request<{ data: WorldHomeRecord }>({ method: 'PUT', path: `/v1/world/homes/${encodeURIComponent(slug)}/layout`, body: { layout } });
  }

  /** Sign a home guestbook. */
  signGuestbook(slug: string, body: string) {
    return this.http.request<{ data: WorldHomeRecord }>({ method: 'POST', path: `/v1/world/homes/${encodeURIComponent(slug)}/guestbook`, body: { body } });
  }

  /** As owner, hide a guestbook entry. */
  hideGuestbookEntry(slug: string, id: string) {
    return this.http.request<{ data: WorldHomeRecord }>({ method: 'DELETE', path: `/v1/world/homes/${encodeURIComponent(slug)}/guestbook/${encodeURIComponent(id)}` });
  }

  /** Report a guestbook entry. */
  reportGuestbookEntry(slug: string, id: string, reason: string, detail?: string) {
    return this.http.request<{ data: WorldHomeRecord }>({ method: 'POST', path: `/v1/world/homes/${encodeURIComponent(slug)}/guestbook/${encodeURIComponent(id)}/report`, body: { reason, detail } });
  }

  /** Ask the owner if they would sell a piece. */
  askIfTheydSell(slug: string, ref: { kind: string; id: string }) {
    return this.http.request<{ data: WorldHomeRecord }>({ method: 'POST', path: `/v1/world/homes/${encodeURIComponent(slug)}/ask`, body: { ref } });
  }
}
