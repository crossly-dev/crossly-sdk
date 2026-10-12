import type { HttpClient } from './_shared.js';

// ─── Crossly World conventions ────────────────────────────────────────────
//
// A seller hosts a convention in one of their rooms; other sellers apply or
// are invited for a table. Sellers are named by shop handle. A table fee is
// settled off-platform and only RECORDED here: nothing in this resource moves
// money.

/** A convention, as the api reads it. */
export type WorldConvention = Record<string, unknown>;
/** Hosting a convention. */
export interface WorldConventionInput {
  sceneId: string; title: string; categorySlug?: string | null; startsAt: string; endsAt: string;
  entryModel: 'invite' | 'free' | 'fee' | 'revenue_share'; entryFeeCents?: number | null; revenueShareBps?: number | null; tableCount?: number;
}

export class WorldConventionsResource {
  constructor(private readonly http: HttpClient) {}

  /** Conventions open to sellers now or soon. */
  conventions() {
    return this.http.request<{ data: WorldConvention[] }>({ method: 'GET', path: '/v1/world/conventions' });
  }

  /** Conventions you host or exhibit at. */
  myConventions() {
    return this.http.request<{ data: WorldConvention[] }>({ method: 'GET', path: '/v1/world/conventions/mine' });
  }

  /** One convention. */
  convention(id: string) {
    return this.http.request<{ data: WorldConvention }>({ method: 'GET', path: `/v1/world/conventions/${encodeURIComponent(id)}` });
  }

  /** The host roster of a convention you host. */
  conventionExhibitors(id: string) {
    return this.http.request<{ data: WorldConvention[] }>({ method: 'GET', path: `/v1/world/conventions/${encodeURIComponent(id)}/exhibitors` });
  }

  /** Host a convention in one of your rooms. */
  createConvention(input: WorldConventionInput) {
    return this.http.request<{ data: WorldConvention }>({ method: 'POST', path: '/v1/world/conventions', body: input });
  }

  /** Open, start, end or cancel a convention you host. */
  setConventionStatus(id: string, status: 'open' | 'live' | 'ended' | 'cancelled') {
    return this.http.request<{ data: { status: string } }>({ method: 'PUT', path: `/v1/world/conventions/${encodeURIComponent(id)}/status`, body: { status } });
  }

  /** Invite a seller by shop handle. */
  inviteToConvention(id: string, username: string) {
    return this.http.request<{ data: { invited: string } }>({ method: 'POST', path: `/v1/world/conventions/${encodeURIComponent(id)}/invite`, body: { username } });
  }

  /** Ask for a table. */
  applyToConvention(id: string) {
    return this.http.request<{ data: { applied: boolean } }>({ method: 'POST', path: `/v1/world/conventions/${encodeURIComponent(id)}/apply`, body: {} });
  }

  /** Accept your invitation, or as host an application (username). */
  acceptConvention(id: string, username?: string) {
    return this.http.request<{ data: WorldConvention }>({ method: 'POST', path: `/v1/world/conventions/${encodeURIComponent(id)}/accept`, body: username ? { username } : {} });
  }

  /** Withdraw or decline; as host, decline someone (username). */
  leaveConvention(id: string, opts: { username?: string; status?: 'declined' | 'withdrawn' } = {}) {
    return this.http.request<{ data: { ok: boolean } }>({ method: 'POST', path: `/v1/world/conventions/${encodeURIComponent(id)}/withdraw`, body: opts });
  }

  /** As host, record a table fee paid off-platform (moves no money). */
  markConventionPaid(id: string, username: string) {
    return this.http.request<{ data: { ok: boolean } }>({ method: 'POST', path: `/v1/world/conventions/${encodeURIComponent(id)}/paid`, body: { username } });
  }
}
