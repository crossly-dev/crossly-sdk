import type { HttpClient, IdempotencyOpts, JsonObject } from './_shared.js';

/** One page of a proof-of-reserves day's leaf hashes, in tree order. */
export interface PorLeavesPage { data: Array<{ idx: number; leafHash: string }>; pagination?: JsonObject; meta?: JsonObject }

// ─── Vault title: receipts, unit list, proof of reserves, lending desk, index feed ──
//
// `client.vaultMarkets.title`. Warehouse receipts are the document of title
// for a vault unit (open on the issuer's registration); the unit list and the
// daily proof-of-reserves Merkle root are public. Your own inclusion proof
// is verified with YOUR user id: commitment = SHA-256(JSON["crossly-por-owner-v1",
// lowercase userId, salt]); leaf = SHA-256(0x00 || JSON["crossly-por-leaf-v1", unitId,
// bookKey, certNo, commitment, status, liened 1|0, loaned 1|0]); node =
// SHA-256(0x01 || left || right), an odd node carried up. The index feed is
// signed (`x-crossly-signature: t=<ms>,v1=<hex HMAC-SHA256(secret, t.body)>`):
// to check the signature read the raw body over HTTP — these methods return
// the parsed JSON. Money is integer CENTS; rates are bps.

export interface PorProofStep { side: 'L' | 'R'; hash: string }

export interface PorInclusionEntry {
  leafIndex: number;
  receiptNo: string | null;
  fields: { unitId: string; bookKey: string; certNo: string | null; status: string; liened: boolean; loaned: boolean };
  salt: string;
  ownerCommitment: string;
  leafHash: string;
  proof: PorProofStep[];
}

export interface PorMyProof {
  snapshot: JsonObject & { day: string; root: string; leafCount: number };
  treeIntact: boolean | null;
  entries: PorInclusionEntry[];
}

export interface LocateHoldBody { bookKey: string; qty: number; termDays?: 30 | 90 | null }

export interface IndexLicence { id: string; name: string; indexSlugs: string[] | null; since: string }
export interface IndexLicenceList { data: IndexLicence[] }

export class VaultMarketsTitleResource {
  constructor(private http: HttpClient) {}

  /** The published unit list: receipt no, book key, shelf location, insured value, status, hashed holder. */
  unitList(params: { bookKey?: string; page?: number; limit?: number } = {}) {
    return this.http.request<{ data: JsonObject[]; pagination?: JsonObject; meta?: JsonObject }>({ method: 'GET', path: '/v1/vault/unit-list', query: params });
  }

  /** Your warehouse receipts, live first. */
  receipts() {
    return this.http.request<{ data: JsonObject[]; meta?: JsonObject }>({ method: 'GET', path: '/v1/vault/receipts' });
  }

  /** One receipt with its hash chain, re-verified on read (`chain.ok`). */
  receipt(receiptNo: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault/receipts/${encodeURIComponent(receiptNo)}` });
  }

  /** Counts, the insurance certificate (with its warning) and SOC reports. */
  attestations() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault/attestations' });
  }

  /** The latest proof-of-reserves root, its anchor, the last `days` roots and the method. */
  proofOfReserves(days?: number) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/proof-of-reserves', query: days ? { days } : undefined });
  }

  /** One day's snapshot. */
  proofOfReservesDay(day: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/proof-of-reserves/${encodeURIComponent(day)}` });
  }

  /** One day's leaf hashes in tree order (rebuild the root yourself). */
  proofOfReservesLeaves(day: string, params: { page?: number; limit?: number } = {}) {
    return this.http.request<PorLeavesPage>({ method: 'GET', path: `/v1/vault-markets/proof-of-reserves/${encodeURIComponent(day)}/leaves`, query: params });
  }

  /** Your inclusion proofs for a day (latest by default). */
  myProof(day?: string) {
    return this.http.request<PorMyProof>({ method: 'GET', path: '/v1/vault-markets/proof-of-reserves/me', query: day ? { day } : undefined });
  }

  /** A locate quote: borrowable units of a key, indicative rate, collateral. Holds nothing. */
  locateQuote(params: { key: string; qty?: number; termDays?: 30 | 90 }) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/locates', query: params });
  }

  /** Hold lendable units for 15 minutes. */
  holdLocate(body: LocateHoldBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/locates', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your locates. */
  myLocates() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/locates/mine' });
  }

  /** Release a live locate. */
  releaseLocate(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'DELETE', path: `/v1/vault-markets/locates/${encodeURIComponent(id)}`, idempotencyKey: opts.idempotencyKey });
  }

  /** Your lender election (return in kind only; allow term loans). */
  election() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/lending/election' });
  }

  setElection(body: { returnInKind?: boolean; allowTerm?: boolean }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'PUT', path: '/v1/vault-markets/lending/election', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your collateral statement as a lender (today, or a past `day`). */
  lenderStatement(day?: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/lending/statement', query: day ? { day } : undefined });
  }

  /** The days you have stored statements for. */
  lenderStatements() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/lending/statements' });
  }

  /** Your lender programme report. */
  lenderProgramme() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/lending/programme' });
  }

  /** The licensed index feed for one built-in index (partner DCM; signed). */
  indexFeed(slug: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/index-feed/${encodeURIComponent(slug)}` });
  }

  /** The frozen 7-day TWAP settlement series. */
  indexSettlement(slug: string, days?: number) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/index-feed/${encodeURIComponent(slug)}/settlement`, query: days ? { days } : undefined });
  }

  /** Reference funding for a perpetual-style future: your premium through the shared clamp and cap. */
  indexFunding(slug: string, params: { premiumBps: number; interestBps?: number }) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/index-feed/${encodeURIComponent(slug)}/funding`, query: params });
  }

  /** Your index feed licences (no licence: the feed answers 403 not_a_licensee). */
  myLicences() {
    return this.http.request<IndexLicenceList>({ method: 'GET', path: '/v1/vault-markets/index-licence/mine' });
  }

  /** Your licensed feed reads (licence-usage report). */
  licenceUsage(days?: number) {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/vault-markets/index-licence/usage', query: days ? { days } : undefined });
  }
}
