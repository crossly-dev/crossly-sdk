import type { HttpClient } from './_shared.js';

// ─── Crossly World Spaces: seller-hosted clubs with a venue, members and events.
// Nothing here takes money; Spaces and events are free to join.

/** A result, as the api returns it. */
export type WorldSpaceRecord = Record<string, unknown>;

export class WorldSpacesResource {
  constructor(private readonly http: HttpClient) {}

  /** The Spaces directory. */
  list(venue?: string) {
    return this.http.request<{ data: WorldSpaceRecord[] }>({ method: 'GET', path: '/v1/world/spaces', query: venue ? { venue } : undefined });
  }

  /** Live and upcoming events across Spaces. */
  whatsOn() {
    return this.http.request<{ data: WorldSpaceRecord[] }>({ method: 'GET', path: `/v1/world/spaces/whats-on` });
  }

  /** Spaces you belong to. */
  mine() {
    return this.http.request<{ data: WorldSpaceRecord[] }>({ method: 'GET', path: `/v1/world/spaces/mine` });
  }

  /** Whether you may open a Space. */
  canHost() {
    return this.http.request<{ data: WorldSpaceRecord }>({ method: 'GET', path: `/v1/world/spaces/can-host` });
  }

  /** One Space and your place in it. */
  get(slug: string) {
    return this.http.request<{ data: WorldSpaceRecord }>({ method: 'GET', path: `/v1/world/spaces/${encodeURIComponent(slug)}` });
  }

  /** Open a Space (sellers, at most two). */
  open(input: { slug: string; name: string; venue: string; membership?: string; about?: string }) {
    return this.http.request<{ data: WorldSpaceRecord }>({ method: 'POST', path: `/v1/world/spaces`, body: input });
  }

  /** As host, change name, about or membership. */
  update(slug: string, input: { name?: string; about?: string; membership?: string }) {
    return this.http.request<{ data: WorldSpaceRecord }>({ method: 'PATCH', path: `/v1/world/spaces/${encodeURIComponent(slug)}`, body: input });
  }

  /** As host, close a Space. */
  close(slug: string) {
    return this.http.request<{ data: WorldSpaceRecord }>({ method: 'DELETE', path: `/v1/world/spaces/${encodeURIComponent(slug)}` });
  }

  /** Join a Space (or ask to). */
  join(slug: string) {
    return this.http.request<{ data: WorldSpaceRecord }>({ method: 'POST', path: `/v1/world/spaces/${encodeURIComponent(slug)}/join`, body: {} });
  }

  /** Leave a Space. */
  leave(slug: string) {
    return this.http.request<{ data: WorldSpaceRecord }>({ method: 'POST', path: `/v1/world/spaces/${encodeURIComponent(slug)}/leave`, body: {} });
  }

  /** As host, who asked to join. */
  requests(slug: string) {
    return this.http.request<{ data: WorldSpaceRecord[] }>({ method: 'GET', path: `/v1/world/spaces/${encodeURIComponent(slug)}/requests` });
  }

  /** As host, accept or turn down a request. */
  answerRequest(slug: string, userId: string, accept: boolean) {
    return this.http.request<{ data: WorldSpaceRecord }>({ method: 'POST', path: `/v1/world/spaces/${encodeURIComponent(slug)}/requests/${encodeURIComponent(userId)}`, body: { accept } });
  }

  /** Invite somebody to a Space. */
  invite(slug: string, userId: string) {
    return this.http.request<{ data: WorldSpaceRecord }>({ method: 'POST', path: `/v1/world/spaces/${encodeURIComponent(slug)}/invite`, body: { userId } });
  }

  /** As host, make a member a co-host or back. */
  setRole(slug: string, userId: string, role: 'cohost' | 'member') {
    return this.http.request<{ data: WorldSpaceRecord }>({ method: 'POST', path: `/v1/world/spaces/${encodeURIComponent(slug)}/role`, body: { userId, role } });
  }

  /** As host, put an event on. */
  addEvent(slug: string, input: { title: string; kind: string; about?: string; startsAt: string; endsAt: string; clubOnly?: boolean }) {
    return this.http.request<{ data: WorldSpaceRecord }>({ method: 'POST', path: `/v1/world/spaces/${encodeURIComponent(slug)}/events`, body: input });
  }

  /** As host, cancel an event. */
  cancelEvent(slug: string, id: string) {
    return this.http.request<{ data: WorldSpaceRecord }>({ method: 'DELETE', path: `/v1/world/spaces/${encodeURIComponent(slug)}/events/${encodeURIComponent(id)}` });
  }

  /** Say whether you are going. */
  rsvp(slug: string, id: string, going: boolean) {
    return this.http.request<{ data: WorldSpaceRecord }>({ method: 'POST', path: `/v1/world/spaces/${encodeURIComponent(slug)}/events/${encodeURIComponent(id)}/rsvp`, body: { going } });
  }
}
