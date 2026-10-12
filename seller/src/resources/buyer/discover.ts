// ── Browse, seller search, sold history, account badges ──────────────
//
// Composed onto `BuyerResource` as `buyer.browse` and `buyer.account`.
// Browse answers "what would the shop show me" — paged, capped at 50 pages,
// with eBay's filters. To WALK the catalogue use `buyer.search`, which pages
// by cursor and costs the same on page 500 as on page 1.

import type { HttpClient } from '../_shared.js';

export interface BrowseParams {
  q?: string;
  brand?: string;
  condition?: string;
  category?: string;
  subcategory?: string;
  size?: string;
  color?: string;
  /** auction | buy_it_now | offers (accepts offers) */
  format?: 'auction' | 'buy_it_now' | 'offers';
  /** Only listings that accept returns. */
  returns?: boolean;
  freeShipping?: boolean;
  localPickup?: boolean;
  deals?: boolean;
  /** Recent sales (last 90 days) instead of live listings. */
  sold?: boolean;
  /** Ships-from state, two letters. */
  state?: string;
  /** Ships-from ZIP; matched on its first three digits. */
  zip?: string;
  /** ISO alpha-2 destination (e.g. 'GB'): only listings whose seller ships
   *  there. Omitted or 'any' = no destination filter. */
  shipsTo?: string;
  /** Lowest price, in cents. */
  minPriceCents?: number;
  /** Highest price, in cents. */
  maxPriceCents?: number;
  sort?: 'best_match' | 'newest' | 'price_low' | 'price_high' | 'popular' | 'ending_soon';
  /** 1-50. */
  page?: number;
  /** 1-60, default 24. */
  limit?: number;
}

export interface BrowseRow {
  slug: string;
  title: string;
  priceCents: number;
  compareAtCents: number | null;
  thumbnail: string | null;
  sellerDisplayName: string | null;
  sellerAvatarUrl: string | null;
  sellerHandle: string | null;
  brand: string | null;
  condition: string | null;
  promoted: boolean;
  viewCount: number;
  watcherCount: number;
  soldCount: number;
  /** ISO alpha-2 the seller ships from (default US). */
  shipsFromCountry?: string;
  /** Present with `sold: true`: per-unit price paid, in cents. */
  soldPriceCents?: number;
  soldAt?: string;
  soldQuantity?: number;
}

export interface SellerSearchResult {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  activeListings: number;
  totalItemsSold: number;
}

export interface SoldHistorySale {
  /** Per-unit item price, in cents, excluding shipping and tax. */
  priceCents: number;
  quantity: number;
  soldAt: string;
}

export interface AccountBadges {
  unreadMessages: number;
  offersAwaitingYou: number;
  offersToPay: number;
  ordersToReview: number;
  total: number;
}

/** Booleans travel as 'true' / 'false', which is what the route's schema accepts. */
export function browseQuery(params: BrowseParams): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = typeof v === 'boolean' ? String(v) : (v as string | number);
  }
  return out;
}

/** Browse, find a seller, read what a listing sold for. Requires `buyer:catalog:read`. */
export class BuyerBrowseResource {
  constructor(private http: HttpClient) {}

  listings(params: BrowseParams = {}) {
    return this.http.request<{
      data: BrowseRow[];
      pagination?: { page: number; limit: number; total?: number; totalPages?: number };
      meta?: { sort: string; sold: boolean; totalMatches: number };
    }>({
      method: 'GET',
      path: '/v1/buyer/catalog/browse',
      query: browseQuery(params),
    });
  }

  /** Shops whose handle or name contains `q` (2+ characters). */
  sellers(q: string, limit?: number) {
    return this.http.request<{ data: SellerSearchResult[] }>({
      method: 'GET',
      path: '/v1/buyer/catalog/sellers',
      query: limit === undefined ? { q } : { q, limit },
    });
  }

  /** What this listing has sold for, newest first, with the median. */
  soldHistory(slug: string) {
    return this.http.request<{ data: SoldHistorySale[]; meta?: { medianCents: number | null; count: number } }>({
      method: 'GET',
      path: `/v1/buyer/catalog/listings/${encodeURIComponent(slug)}/sold-history`,
    });
  }
}

/** Account-level counts. */
export class BuyerAccountResource {
  constructor(private http: HttpClient) {}

  /** The counts behind the account badge. Requires `buyer:profile:read`. */
  badges() {
    return this.http.request<{ data: AccountBadges }>({
      method: 'GET',
      path: '/v1/buyer/badges',
    });
  }
}

