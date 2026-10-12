import type { HttpClient } from './_shared.js';

// ─── Vault Markets: collectors to follow ───────────────────────────────────
//
// `client.vaultMarkets.follows`. Private by default: every sharing switch is
// off until you turn it on, shows only what happens after that, and needs
// your public vault profile. The follow feed shows which markets the people
// you follow bought, sent in, sold or lent to the Hall, never a price.
// Leaderboards are opt-in and ranked by risk-adjusted return from the order
// book's A/B marks: percent and risk only, no dollars, no volume.
// Copy-watch ALERTS you to a collector's new resting bids and asks; it never
// places an order for you. Money is integer CENTS of US dollars; returns,
// volatility and drawdowns are basis points.

export type FollowFeedKind = 'buy' | 'deposit' | 'sale' | 'hall_loan';
export type LeaderboardPeriod = '30d' | '90d' | '365d';
export type MarkQuality = 'A' | 'B' | 'C' | 'none';

export interface FollowPerson {
  handle: string | null;
  displayName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
}

export interface FollowSharingSwitches {
  deposits: boolean;
  sales: boolean;
  hallLoans: boolean;
  orders: boolean;
  leaderboard: boolean;
}

export interface FollowSharing {
  isPublic: boolean;
  showBuys: boolean;
  handle: string | null;
  profileUrl: string | null;
  followers: number;
  copyWatchers: number;
  sharing: FollowSharingSwitches;
  /** When each switch went on (ISO), or null while off. */
  since: Record<keyof FollowSharingSwitches, string | null>;
  explain: Record<keyof FollowSharingSwitches, string>;
}

export interface FollowSharingPatch {
  isPublic?: boolean;
  showBuys?: boolean;
  deposits?: boolean;
  sales?: boolean;
  hallLoans?: boolean;
  /** Copy-watchers are alerted to your new resting bids and asks, with the price. */
  orders?: boolean;
  leaderboard?: boolean;
}

export interface FollowedCollector {
  person: FollowPerson;
  since: string | null;
  shares: { buys: boolean; deposits: boolean; sales: boolean; hallLoans: boolean; orders: boolean };
  copyWatching: boolean;
}

export interface FollowingList {
  data: FollowedCollector[];
  meta?: { notSharing: number };
}

export interface FollowPost {
  id: string;
  kind: FollowFeedKind;
  verb: string;
  at: string;
  by: FollowPerson;
  bookKey: string;
  name: string | null;
  label: string | null;
  imageUrl: string | null;
  mark: { cents: number | null; quality: MarkQuality; asOf: string | null };
  exhibition: { key: string; title: string } | null;
  buyHref: string;
}

export interface FollowFeedPage {
  data: FollowPost[];
  meta?: { nextBefore: string | null; handle?: string };
}

export interface FollowFeedOptions {
  /** ISO time: posts before it (the last post's `at`). */
  before?: string;
  limit?: number;
  kinds?: FollowFeedKind[];
}

export interface LeaderboardEntry {
  rank: number;
  person: FollowPerson;
  returnBps: number;
  volatilityBps: number;
  riskAdjusted: number;
  maxDrawdownBps: number;
  days: number;
  markets: number;
  isMe: boolean;
}

export interface LeaderboardStanding {
  optedIn: boolean;
  isPublic: boolean;
  rank: number | null;
  returnBps: number | null;
  volatilityBps: number | null;
  riskAdjusted: number | null;
  maxDrawdownBps: number | null;
  days: number | null;
  why: string | null;
}

export interface LeaderboardMeta {
  period: LeaderboardPeriod;
  category: string;
  computedOn: string | null;
  minDays: number;
  categories: Array<{ slug: string; name: string; collectors: number }>;
  me: LeaderboardStanding | null;
  method: string[];
}

export interface LeaderboardPage {
  data: LeaderboardEntry[];
  meta?: LeaderboardMeta;
}

export interface CopyWatch {
  person: FollowPerson;
  since: string;
  /** False while the collector has stopped sharing (nothing is sent). */
  active: boolean;
}

export interface CopyWatchList {
  data: CopyWatch[];
  meta?: { max: number };
}

export interface CopyWatchResult {
  watching: boolean;
  handle: string;
}

export interface CopyWatchAlert {
  id: string;
  by: FollowPerson;
  side: 'buy' | 'sell';
  quantity: number;
  limitCents: number | null;
  bookKey: string;
  name: string | null;
  label: string | null;
  imageUrl: string | null;
  placedAt: string;
  at: string;
  read: boolean;
  stillResting: boolean;
  marketHref: string;
}

export interface CopyWatchAlertPage {
  data: CopyWatchAlert[];
  meta?: { unread: number; nextBefore: string | null };
}

export interface CopyWatchReadResult {
  marked: number;
}

const enc = (s: string) => encodeURIComponent(s);
const kindsQuery = (k?: FollowFeedKind[]) => (k && k.length > 0 ? k.join(',') : undefined);

export class VaultMarketsFollowsResource {
  constructor(private http: HttpClient) {}

  /** Your sharing switches (all off until you turn them on). */
  sharing() {
    return this.http.request<FollowSharing>({ method: 'GET', path: '/v1/vault-markets/follows/sharing' });
  }

  /** Turn sharing switches on or off. */
  updateSharing(body: FollowSharingPatch) {
    return this.http.request<FollowSharing>({ method: 'PUT', path: '/v1/vault-markets/follows/sharing', body });
  }

  /** The collectors you follow who have a public vault. */
  following() {
    return this.http.request<FollowingList>({ method: 'GET', path: '/v1/vault-markets/follows/following' });
  }

  /** Public vault activity of the people you follow, newest first. */
  feed(opts: FollowFeedOptions = {}) {
    return this.http.request<FollowFeedPage>({ method: 'GET', path: '/v1/vault-markets/follows/feed', query: { before: opts.before, limit: opts.limit, kinds: kindsQuery(opts.kinds) } });
  }

  /** One collector's public vault activity. */
  activity(handle: string, opts: FollowFeedOptions = {}) {
    return this.http.request<FollowFeedPage>({ method: 'GET', path: `/v1/vault-markets/follows/profiles/${enc(handle)}/activity`, query: { before: opts.before, limit: opts.limit, kinds: kindsQuery(opts.kinds) } });
  }

  /** An opt-in return leaderboard, ranked by risk-adjusted return. */
  leaderboard(opts: { period?: LeaderboardPeriod; category?: string } = {}) {
    return this.http.request<LeaderboardPage>({ method: 'GET', path: '/v1/vault-markets/follows/leaderboards', query: { period: opts.period, category: opts.category } });
  }

  /** The collectors you copy-watch. */
  copyWatches() {
    return this.http.request<CopyWatchList>({ method: 'GET', path: '/v1/vault-markets/follows/copy-watch' });
  }

  /** Copy-watch a collector who shares bids and asks: alerts only, never an order. */
  startCopyWatch(handle: string) {
    return this.http.request<CopyWatchResult>({ method: 'PUT', path: `/v1/vault-markets/follows/copy-watch/${enc(handle)}` });
  }

  /** Stop copy-watching a collector. */
  stopCopyWatch(handle: string) {
    return this.http.request<CopyWatchResult>({ method: 'DELETE', path: `/v1/vault-markets/follows/copy-watch/${enc(handle)}` });
  }

  /** Your copy-watch alerts, newest first. */
  copyWatchAlerts(opts: { before?: string; limit?: number } = {}) {
    return this.http.request<CopyWatchAlertPage>({ method: 'GET', path: '/v1/vault-markets/follows/copy-watch/alerts', query: { before: opts.before, limit: opts.limit } });
  }

  /** Mark every copy-watch alert read. */
  markCopyWatchAlertsRead() {
    return this.http.request<CopyWatchReadResult>({ method: 'POST', path: '/v1/vault-markets/follows/copy-watch/alerts/read' });
  }
}
