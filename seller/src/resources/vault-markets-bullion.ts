import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Vault Markets bullion keys and spot-pegged quotes ──────────────────────
//
// `client.vaultMarkets.bullion`. A key family is {metal, form, size, mint}
// (or any mint): it groups the bullion catalogue's products so you see one
// market for "an ounce of gold". Trading stays per book key. Spot is returned
// only as a reference labelled "Spot (reference, not a Crossly price)"; every
// price is a resting order or a mark built from the book. A pegged quote is
// "spot plus or minus N cents / basis points" on one book key and side; it
// rests as a pro limit order re-priced every spot tick and is pulled off the
// book while spot is stale. Money is integer CENTS of US dollars; spot is
// cents per troy ounce of pure metal.

export interface VaultSpotReference {
  /** Always "Spot (reference, not a Crossly price)". */
  label: string;
  metal: 'gold' | 'silver' | 'platinum' | 'palladium';
  priceCents: number | null;
  source: string | null;
  fetchedAt: string | null;
  /** fresh | stale | none: pegged quotes rest only on fresh spot. */
  state: 'fresh' | 'stale' | 'none';
  staleAfterSeconds: number;
}

export interface VaultBullionKey {
  slug: string;
  label: string;
  metal: 'gold' | 'silver' | 'platinum' | 'palladium';
  /** bullion_coin | bar | round */
  form: string;
  size: string;
  sizeLabel: string;
  /** Mint or refiner; null = any mint. */
  mint: string | null;
  fineMg: number;
  members: number;
  vaultUnits: number;
  bestBidCents: number | null;
  bestAskCents: number | null;
  /** One unit's metal at spot: a reference, not a price. */
  meltReferenceCents: number | null;
  spot: VaultSpotReference | null;
}

export interface VaultBullionBook {
  bookKey: string;
  variantId: string;
  condition: string;
  gradeKey: string | null;
  name: string | null;
  label: string | null;
  vaultUnits: number;
  bestBidCents: number | null;
  bestAskCents: number | null;
  /** From the book only; spot never sets a mark. */
  markCents: number | null;
  markQuality: string;
}

export interface VaultBullionProduct {
  variantId: string;
  skuId: string;
  name: string;
  label: string | null;
  imageUrl: string | null;
  brand: string | null;
  model: string | null;
}

export interface VaultBullionKeyView extends VaultBullionKey {
  products: VaultBullionProduct[];
  books: VaultBullionBook[];
  pegs: { liveBids: number; liveAsks: number; pulled: number };
}

export interface VaultBullionFamilies {
  bookKey: string;
  families: Array<{ slug: string; label: string; mint: string | null }>;
  spot: VaultSpotReference | null;
  meltReferenceCents: number | null;
}

export type VaultBullionPegKind = 'spot_plus_cents' | 'spot_plus_bps';

export interface VaultBullionPeg {
  id: string;
  bookKey: string;
  side: 'buy' | 'sell';
  quantity: number;
  filled: number;
  kind: VaultBullionPegKind;
  premiumCents: number | null;
  premiumBps: number | null;
  floorCents: number | null;
  capCents: number | null;
  /** "spot + $12.00" */
  peg: string;
  funding: string;
  orderId: string | null;
  /** active | pulled | filled | stopped */
  status: string;
  /** spot_stale, or why the book refused it. */
  pulledReason: string | null;
  lastPriceCents: number | null;
  lastSpotCents: number | null;
  pricedAt: string | null;
  /** The family-wide quote this is one leg of; null for a quote on one book. */
  familyPegId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** DS (brilliant uncirculated / sealed), VNDS (handled) or Used (circulated). */
export type VaultBullionQuoteCondition = 'DS' | 'VNDS' | 'Used';

export interface VaultBullionFamilyPeg {
  id: string;
  /** The family slug. */
  slug: string;
  condition: VaultBullionQuoteCondition;
  side: 'buy' | 'sell';
  /** Units across the whole family. */
  quantity: number;
  filled: number;
  remaining: number;
  kind: VaultBullionPegKind;
  premiumCents: number | null;
  premiumBps: number | null;
  floorCents: number | null;
  capCents: number | null;
  peg: string;
  funding: string;
  /** active | filled | stopped */
  status: string;
  stoppedReason: string | null;
  note: string;
  /** One pegged quote per book the family quote rests on. */
  legs: VaultBullionPeg[];
  resting: number;
  createdAt: string;
  updatedAt: string;
}

export interface VaultBullionFamilyPegList {
  data: VaultBullionFamilyPeg[];
}

export interface SetVaultBullionFamilyPegBody {
  slug: string;
  condition: VaultBullionQuoteCondition;
  side: 'buy' | 'sell';
  quantity: number;
  kind: VaultBullionPegKind;
  premiumCents?: number | null;
  premiumBps?: number | null;
  floorCents?: number | null;
  capCents?: number | null;
  /** A family bid pays from the custodian account. */
  funding?: 'custodian';
}

export interface VaultBullionPegPreview {
  bookKey: string;
  spot: VaultSpotReference;
  /** Null when spot is stale or missing. */
  priceCents: number | null;
  peg: string;
  note: string | null;
}

export interface SetVaultBullionPegBody {
  bookKey: string;
  side: 'buy' | 'sell';
  /** 1-50 units. */
  quantity: number;
  kind: VaultBullionPegKind;
  /** For spot_plus_cents: cents over (or under, negative) melt per unit. */
  premiumCents?: number | null;
  /** For spot_plus_bps: basis points over (or under, negative) melt. */
  premiumBps?: number | null;
  /** A seller's lowest price per unit, in cents. */
  floorCents?: number | null;
  /** A buyer's highest price per unit, in cents. */
  capCents?: number | null;
  funding?: 'card' | 'custodian';
  stripePaymentMethodId?: string | null;
}

export interface VaultBullionKeysQuery {
  metal?: 'gold' | 'silver' | 'platinum' | 'palladium';
  form?: 'bullion_coin' | 'bar' | 'round';
  /** A nominal size slug: 1oz, 1-10oz, 1kg, 10oz, 100g, ... */
  size?: string;
  /** Only the any-mint families. */
  anyMint?: boolean;
}

export interface VaultBullionPegPreviewQuery {
  bookKey: string;
  kind: VaultBullionPegKind;
  premiumCents?: number;
  premiumBps?: number;
  floorCents?: number;
  capCents?: number;
}

export interface VaultBullionKeyList {
  data: VaultBullionKey[];
}

export interface VaultBullionPegList {
  data: VaultBullionPeg[];
}

export class VaultMarketsBullionResource {
  constructor(private http: HttpClient) {}

  /** Bullion key families with vault units, best bid and ask across their books, and spot as a labelled reference. */
  keys(query: VaultBullionKeysQuery = {}) {
    return this.http.request<VaultBullionKeyList>({ method: 'GET', path: '/v1/vault-markets/bullion/keys', query: { metal: query.metal, form: query.form, size: query.size, anyMint: query.anyMint === undefined ? undefined : String(query.anyMint) } });
  }

  /** One family: products, live book keys with marks (book only), pegged quote counts, spot reference. */
  key(slug: string) {
    const s = encodeURIComponent(slug);
    return this.http.request<VaultBullionKeyView>({ method: 'GET', path: `/v1/vault-markets/bullion/keys/${s}` });
  }

  /** The families a book key belongs to, with spot for its metal as a reference. */
  familiesFor(bookKey: string) {
    return this.http.request<VaultBullionFamilies>({ method: 'GET', path: '/v1/vault-markets/bullion/for', query: { bookKey } });
  }

  /** The price a pegged quote would rest at now; null while spot is stale. */
  previewPeg(query: VaultBullionPegPreviewQuery) {
    return this.http.request<VaultBullionPegPreview>({ method: 'GET', path: '/v1/vault-markets/bullion/pegs/preview', query: { bookKey: query.bookKey, kind: query.kind, premiumCents: query.premiumCents, premiumBps: query.premiumBps, floorCents: query.floorCents, capCents: query.capCents } });
  }

  /** Your pegged quotes: live (default) or all. */
  pegs(status: 'live' | 'all' = 'live') {
    return this.http.request<VaultBullionPegList>({ method: 'GET', path: '/v1/vault-markets/bullion/pegs', query: { status } });
  }

  /** Set a spot-pegged quote (replaces your live one on the same key and side). ID required. */
  setPeg(body: SetVaultBullionPegBody, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultBullionPeg>({ method: 'POST', path: '/v1/vault-markets/bullion/pegs', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Your family-wide quotes, each with its legs: live (default) or all. */
  familyPegs(status: 'live' | 'all' = 'live') {
    return this.http.request<VaultBullionFamilyPegList>({ method: 'GET', path: '/v1/vault-markets/bullion/family-pegs', query: { status } });
  }

  /** Set a family-wide quote: one quote across a family's books at one condition, pulled from the rest when one fills. ID required. */
  setFamilyPeg(body: SetVaultBullionFamilyPegBody, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultBullionFamilyPeg>({ method: 'POST', path: '/v1/vault-markets/bullion/family-pegs', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Stop a family-wide quote; every leg comes off the book. */
  stopFamilyPeg(id: string) {
    const fid = encodeURIComponent(id);
    return this.http.request<VaultBullionFamilyPeg>({ method: 'DELETE', path: `/v1/vault-markets/bullion/family-pegs/${fid}` });
  }

  /** Stop a pegged quote; its resting order comes off the book. */
  stopPeg(id: string) {
    const pid = encodeURIComponent(id);
    return this.http.request<VaultBullionPeg>({ method: 'DELETE', path: `/v1/vault-markets/bullion/pegs/${pid}` });
  }
}
