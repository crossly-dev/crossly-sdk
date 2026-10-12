import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Brand drops: an approved drop partner's promoted drop-day releases ─────
//
// Not `drops` (DropsResource): those are line-and-draw drops any seller runs
// outside their shop. Brand drops are featured on the Crossly home page and
// market, limited to approved partners and governed by their terms.

export type BrandDropStatus = 'draft' | 'pending_review' | 'scheduled' | 'live' | 'sold_out' | 'ended' | 'cancelled';

export interface BrandDropPartner {
  id: string;
  brandName: string;
  kind: string;
  status: string;
  /** Null = the standard market fee applies (not zero). Basis points: 800 = 8%. */
  feeBps: number | null;
  promoFeeBps: number;
  feeWindowDays: number;
  feeUnitCap: number | null;
  promoTier: string;
  maxDropsPerMonth: number;
  maxUnitsPerDrop: number | null;
  /** True = you schedule drops yourself; false = they go through Crossly review. */
  canSelfPublish: boolean;
  canPreBid: boolean;
  canGateBuyerApi: boolean;
}

export interface BrandDropPartnerSummary {
  /** Null when you are not an approved partner. */
  partner: BrandDropPartner | null;
  usage: { usedThisMonth: number; maxDropsPerMonth: number } | null;
}

export interface BrandDropPartnerResponse {
  data: BrandDropPartnerSummary;
}

export interface BrandDrop {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  /** ISO timestamp the drop goes live. */
  dropAt: string;
  endsAt: string | null;
  status: BrandDropStatus;
  /** Crossly's note when a submitted drop was returned to draft. */
  reviewNote: string | null;
  reviewedAt: string | null;
  listingCount: number;
  buyerApiEnabled: boolean;
  perCustomerLimit: number | null;
  previewFrom: string | null;
  createdAt: string;
}

export interface BrandDropResponse {
  data: BrandDrop;
}

export interface BrandDropListResponse {
  data: BrandDrop[];
}

export interface BrandDropListing {
  platformListingId: string;
  /** The master listing id. */
  listingId: string;
  title: string | null;
  imageUrl: string | null;
  priceCents: number | null;
  status: string;
}

export interface BrandDropListingsResponse {
  data: BrandDropListing[];
}

export interface BrandDropCreate {
  name: string;
  /** ISO timestamp in the future. */
  dropAt: string;
  description?: string | null;
  coverImageUrl?: string | null;
}

export interface BrandDropUpdate {
  name?: string;
  dropAt?: string;
  description?: string | null;
  coverImageUrl?: string | null;
  buyerApiEnabled?: boolean;
  perCustomerLimit?: number | null;
  previewFrom?: string | null;
  endsAt?: string | null;
  /** draft = withdraw/unschedule · pending_review = submit · scheduled = needs canSelfPublish · cancelled. */
  status?: 'draft' | 'pending_review' | 'scheduled' | 'cancelled';
}

export class BrandDropsResource {
  constructor(private http: HttpClient) {}

  /** Your partner terms and this month's drop usage (partner null when not approved). */
  partner() {
    return this.http.request<BrandDropPartnerResponse>({ method: 'GET', path: '/v1/brand-drops/partner' });
  }

  /** Your brand drops, newest start first. */
  list(params: { status?: BrandDropStatus; limit?: number } = {}) {
    return this.http.request<BrandDropListResponse>({ method: 'GET', path: '/v1/brand-drops', query: params });
  }

  /** One brand drop. */
  get(id: string) {
    return this.http.request<BrandDropResponse>({ method: 'GET', path: `/v1/brand-drops/${encodeURIComponent(id)}` });
  }

  /** Create a draft drop (counts against your monthly allowance). */
  create(body: BrandDropCreate, opts: IdempotencyOpts = {}) {
    return this.http.request<BrandDropResponse>({ method: 'POST', path: '/v1/brand-drops', body, idempotencyKey: opts.idempotencyKey });
  }

  /** Edit a drop and/or change its status. */
  update(id: string, body: BrandDropUpdate, opts: IdempotencyOpts = {}) {
    return this.http.request<BrandDropResponse>({
      method: 'PATCH',
      path: `/v1/brand-drops/${encodeURIComponent(id)}`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  /** Submit a draft for Crossly review. */
  submit(id: string, opts: IdempotencyOpts = {}) {
    return this.update(id, { status: 'pending_review' }, opts);
  }

  /** Schedule a draft yourself (partners with canSelfPublish only). */
  schedule(id: string, opts: IdempotencyOpts = {}) {
    return this.update(id, { status: 'scheduled' }, opts);
  }

  /** Cancel a drop that isn't live yet. */
  cancel(id: string, opts: IdempotencyOpts = {}) {
    return this.update(id, { status: 'cancelled' }, opts);
  }

  /** The listings a drop releases. */
  listings(id: string) {
    return this.http.request<BrandDropListingsResponse>({ method: 'GET', path: `/v1/brand-drops/${encodeURIComponent(id)}/listings` });
  }

  /** Replace the listings a drop releases (master listing ids, each already on Crossly). */
  setListings(id: string, listingIds: string[], opts: IdempotencyOpts = {}) {
    return this.http.request<BrandDropListingsResponse>({
      method: 'PUT',
      path: `/v1/brand-drops/${encodeURIComponent(id)}/listings`,
      body: { listingIds },
      idempotencyKey: opts.idempotencyKey,
    });
  }
}
