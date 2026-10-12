import type { HttpClient, JsonObject } from './_shared.js';

// ─── Vault Markets social: share cards, profiles, feed, Learn, report ──────
//
// `client.vaultMarkets.social`. Verified share cards (the % is the price move
// since your real fill, computed by Crossly; amounts hidden unless you turn
// them on), opt-in public vault profiles that show weights and never dollars,
// a feed of the new vault buys of people you follow (no copy trading), the
// Learn hub's server-graded quizzes (cosmetic pins only), the quarterly Vault
// Report, the press kit, index levels and the widget reads. Money is integer
// CENTS of US dollars; moves and weights are basis points.

export type VaultShareKind = 'position' | 'unit' | 'index' | 'portfolio';

export interface CreateVaultShareCardBody {
  kind: VaultShareKind;
  /** A position id, a vault unit id or an index slug. Omit for `portfolio`. */
  refId?: string;
  /** Show dollar amounts on the card (default false: % only). */
  showAmounts?: boolean;
}

export interface VaultProfilePatch {
  isPublic?: boolean;
  showBuys?: boolean;
}

export type VaultWidgetRange = '1m' | '3m' | '6m' | '1y' | '5y';

const enc = (s: string) => encodeURIComponent(s);

export class VaultMarketsSocialResource {
  constructor(private http: HttpClient) {}

  /** Your share cards, each as the public sees it. */
  shareCards() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/share-cards' });
  }

  /** Make a verified share card. */
  createShareCard(body: CreateVaultShareCardBody) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/share-cards', body });
  }

  /** One share card as the public sees it. */
  shareCard(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/share-cards/${enc(id)}` });
  }

  /** Show or hide the dollar amounts on one of your cards. */
  setShareCardAmounts(id: string, showAmounts: boolean) {
    return this.http.request<JsonObject>({ method: 'PATCH', path: `/v1/vault-markets/share-cards/${enc(id)}`, body: { showAmounts } });
  }

  /** Take a share card down. */
  deleteShareCard(id: string) {
    return this.http.request<{ ok: boolean }>({ method: 'DELETE', path: `/v1/vault-markets/share-cards/${enc(id)}` });
  }

  /** Your public vault profile switch. */
  profile() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/profile' });
  }

  /** Turn your public vault profile on or off, and whether followers see new buys. */
  updateProfile(body: VaultProfilePatch) {
    return this.http.request<JsonObject>({ method: 'PUT', path: '/v1/vault-markets/profile', body });
  }

  /** Someone's public vault: weights by market, followers, recent buys (no prices). */
  publicProfile(handle: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/profiles/${enc(handle)}` });
  }

  /** Follow someone with a public vault. */
  follow(handle: string) {
    return this.http.request<{ following: boolean; followers: number }>({ method: 'POST', path: `/v1/vault-markets/profiles/${enc(handle)}/follow` });
  }

  /** Stop following someone. */
  unfollow(handle: string) {
    return this.http.request<{ following: boolean; followers: number }>({ method: 'DELETE', path: `/v1/vault-markets/profiles/${enc(handle)}/follow` });
  }

  /** New vault buys of the people you follow, newest first. */
  feed(opts: { before?: string; limit?: number } = {}) {
    return this.http.request<{ data: JsonObject[]; meta?: JsonObject }>({ method: 'GET', path: '/v1/vault-markets/feed', query: { before: opts.before, limit: opts.limit } });
  }

  /** The Learn hub with your passes. */
  learn() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/learn' });
  }

  /** One Learn concept with its quiz questions (no answers). */
  learnConcept(concept: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/learn/${enc(concept)}` });
  }

  /** Answer a concept's quiz: one choice index per question. */
  answerQuiz(concept: string, answers: number[]) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/learn/${enc(concept)}/quiz`, body: { answers } });
  }

  /** The quarterly Vault Report (`quarter` like '2026-q3'; default the latest). */
  report(quarter?: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/report', query: quarter ? { quarter } : undefined });
  }

  /** The press kit: indexes with level, quality, n, CSV link and "cite as". */
  pressKit() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/press' });
  }

  /** An index's daily closes, oldest first. */
  indexLevels(slug: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/indexes/${enc(slug)}/levels` });
  }

  /** What the <crossly-index> widget shows. */
  indexWidget(slug: string, range?: VaultWidgetRange) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/widgets/index/${enc(slug)}`, query: range ? { range } : undefined });
  }

  /** What the <crossly-mark> widget shows for a book key. */
  markWidget(bookKey: string, range?: VaultWidgetRange) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/widgets/mark', query: { bookKey, range } });
  }
}
