import type { HttpClient, IdempotencyOpts, JsonObject } from './_shared.js';

// ─── Vault Markets index methodology and governance ─────────────────────────
//
// `client.vaultMarkets.index`. The index method with its version, the review
// calendar, index events and the expert-judgment log, levels (daily closes or
// a model engine; provisional or settlement series), members as of a day,
// committee minutes, consultations and complaints. Every level comes from the
// Crossly order book; below its data gate `data` is empty and `meta.notice`
// says "Not enough Crossly trades". Model levels are labelled estimates with
// a 95% band and an n — never a price.

export type VaultIndexEventKind = 'add' | 'delete' | 'rebalance' | 'method' | 'correction' | 'halt';
export type VaultIndexEngine = 'chain' | 'tpd' | 'repeat_sales';
export type VaultIndexSeries = 'provisional' | 'settlement';

export interface VaultIndexLevelsQuery {
  /** `provisional` (default; may be restated for 8 weeks) or `settlement` (each value as first published). */
  series?: VaultIndexSeries;
  /** `chain` (default): daily closes. `tpd` / `repeat_sales`: weekly or monthly model estimates. */
  engine?: VaultIndexEngine;
  frequency?: 'weekly' | 'monthly';
  /** YYYY-MM-DD. */
  from?: string;
  to?: string;
}

export interface VaultIndexComplaintBody {
  /** The index it is about, if any. */
  slug?: string | null;
  subject: string;
  body: string;
}

const enc = (s: string) => encodeURIComponent(s);

export class VaultMarketsIndexResource {
  constructor(private http: HttpClient) {}

  /** The method, machine-readable, with its semver version. */
  methodology() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/index-methodology' });
  }

  /** The next four quarterly reviews (reference, announcement and effective days). */
  calendar() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/index-calendar' });
  }

  /** Every index's events (or one index's with `slug`), newest first. */
  events(opts: { slug?: string; kind?: VaultIndexEventKind; limit?: number } = {}) {
    const query = { kind: opts.kind, limit: opts.limit };
    if (opts.slug) return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: `/v1/vault-markets/indexes/${enc(opts.slug)}/events`, query });
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/index-events', query });
  }

  /** The expert-judgment log: every committee action and its written reason. */
  judgments() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/index-judgments' });
  }

  /** Published levels of an index. */
  levels(slug: string, query: VaultIndexLevelsQuery = {}) {
    return this.http.request<{ data: JsonObject[]; meta: JsonObject }>({ method: 'GET', path: `/v1/vault-markets/indexes/${enc(slug)}/level-series`, query });
  }

  /** Members of an index on a day (default today), with weights, shares and stored inputs. */
  members(slug: string, asOf?: string) {
    return this.http.request<{ data: JsonObject[]; meta: JsonObject }>({ method: 'GET', path: `/v1/vault-markets/indexes/${enc(slug)}/members`, query: { asOf } });
  }

  /** Published Index Committee minutes. */
  minutes() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/index-committee/minutes' });
  }

  /** Consultations on method changes. */
  consultations(status?: 'open' | 'closed' | 'adopted' | 'withdrawn') {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/index-consultations', query: { status } });
  }

  /** One consultation with its comments. */
  consultation(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/index-consultations/${enc(id)}` });
  }

  /** Comment on an open consultation (published without your name). */
  comment(id: string, body: string, opts: IdempotencyOpts = {}) {
    return this.http.request<{ ok: boolean }>({ method: 'POST', path: `/v1/vault-markets/index-consultations/${enc(id)}/comments`, body: { body }, idempotencyKey: opts.idempotencyKey });
  }

  /** File a complaint about an index or the method. */
  complain(body: VaultIndexComplaintBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/index-complaints', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your complaints and their answers. */
  complaints() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/index-complaints' });
  }
}
