import type { HttpClient, IdempotencyOpts, JsonObject } from './_shared.js';

// ─── Vault supply: send inventory to the vault, round-ups, Market Open, partners ──
//
// `client.vaultMarkets.supply`. Inventory items matched to a catalogue variant
// go to the vault as one box with one prepaid label; each unit shows its key's
// Instant Exit line ("Instant Exit now: $X (N% of mark)" or "No market yet").
// Money is integer CENTS of US dollars; shares are basis points (bps).

export type VaultCondition = 'DS' | 'VNDS' | 'Used';
export interface SupplyParcel { lengthIn: number; widthIn: number; heightIn: number; weightOz: number }

export interface SendToVaultBody {
  items: Array<{ inventoryItemId: string; condition?: VaultCondition; gradeKey?: string | null }>;
  /** Once stored, list in the vault book at this share of the mark (5000-30000 bps). */
  autoListBps?: number | null;
  /** Turn lending on once stored (needs the lending registration and ID). */
  lendWhenIdle?: boolean;
  parcel?: SupplyParcel | null;
}

export interface PartnerBatchBody {
  items: Array<{ variantId: string; condition: VaultCondition; gradeKey?: string | null; photos: string[] }>;
  parcel?: SupplyParcel | null;
}

export class VaultMarketsSupplyResource {
  constructor(private http: HttpClient) {}

  /** Send inventory items to the vault as one box; returns the units made, the ones skipped (and why) and the label. */
  send(body: SendToVaultBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/supply/send', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your units sent to the vault, each with its Instant Exit line; optionally for some inventory items. */
  deposits(inventoryItemIds?: string[]) {
    return this.http.request<{ data: JsonObject[]; meta?: JsonObject }>({ method: 'GET', path: '/v1/vault-markets/supply/deposits', query: inventoryItemIds?.length ? { inventoryItemIds: inventoryItemIds.join(',') } : undefined });
  }

  /** Change a deposit's toggles. */
  updateDeposit(id: string, body: { autoListBps?: number | null; lendWhenIdle?: boolean }, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'PATCH', path: `/v1/vault-markets/supply/deposits/${encodeURIComponent(id)}`, body, idempotencyKey: opts.idempotencyKey });
  }

  /** A box's label and tracking. */
  batch(id: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/supply/batches/${encodeURIComponent(id)}` });
  }

  /** Buy a box's label again after it failed. */
  retryLabel(id: string, parcel?: SupplyParcel | null, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/supply/batches/${encodeURIComponent(id)}/label`, body: { parcel: parcel ?? null }, idempotencyKey: opts.idempotencyKey });
  }

  /** Your seller round-up (null when none). */
  roundUp() {
    return this.http.request<{ roundUp: JsonObject | null }>({ method: 'GET', path: '/v1/vault-markets/supply/round-up' });
  }

  /** Set the round-up: `shareBps` of each payout funds buys of one unit of `bookKey`. */
  setRoundUp(body: { bookKey: string; shareBps: number }, opts: IdempotencyOpts = {}) {
    return this.http.request<{ roundUp: JsonObject | null }>({ method: 'PUT', path: '/v1/vault-markets/supply/round-up', body, idempotencyKey: opts.idempotencyKey });
  }

  stopRoundUp() {
    return this.http.request<{ roundUp: JsonObject | null }>({ method: 'DELETE', path: '/v1/vault-markets/supply/round-up' });
  }

  /** Market Open invites to you as a dealer. */
  invites() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/supply/invites' });
  }

  answerInvite(id: string, accept: boolean, opts: IdempotencyOpts = {}) {
    return this.http.request<{ id: string; status: string }>({ method: 'POST', path: `/v1/vault-markets/supply/invites/${encodeURIComponent(id)}`, body: { accept }, idempotencyKey: opts.idempotencyKey });
  }

  /** Keys opening soon, with your place on each waitlist. */
  openingSoon() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/opening' });
  }

  opening(slug: string) {
    return this.http.request<JsonObject>({ method: 'GET', path: `/v1/vault-markets/opening/${encodeURIComponent(slug)}` });
  }

  /** Join a waitlist (optionally with a friend's code). Inviting moves you up; nobody is paid. */
  joinWaitlist(slug: string, ref?: string | null, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: `/v1/vault-markets/opening/${encodeURIComponent(slug)}/waitlist`, body: { ref: ref ?? null }, idempotencyKey: opts.idempotencyKey });
  }

  leaveWaitlist(slug: string) {
    return this.http.request<{ left: boolean }>({ method: 'DELETE', path: `/v1/vault-markets/opening/${encodeURIComponent(slug)}/waitlist` });
  }

  /** Your Vault Drop-off Partnership (null when you never applied). */
  partnership() {
    return this.http.request<{ partnership: JsonObject | null }>({ method: 'GET', path: '/v1/vault-markets/partners/me' });
  }

  applyPartner(body: { shopName: string; address?: Record<string, string | null> | null; website?: string | null; note?: string | null }, opts: IdempotencyOpts = {}) {
    return this.http.request<{ partner: JsonObject }>({ method: 'POST', path: '/v1/vault-markets/partners/apply', body, idempotencyKey: opts.idempotencyKey });
  }

  /** An approved partner sends walk-ins in under its code. */
  partnerBatch(body: PartnerBatchBody, opts: IdempotencyOpts = {}) {
    return this.http.request<JsonObject>({ method: 'POST', path: '/v1/vault-markets/partners/batches', body, idempotencyKey: opts.idempotencyKey });
  }

  partnerAccruals() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/partners/accruals' });
  }
}
