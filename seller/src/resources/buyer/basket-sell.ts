// ── Cart optimizer + instant offers ─────────────────────────────────
//
// Composed onto `BuyerResource` as `buyer.cartOptimizer`,
// `buyer.instantOffers` and `buyer.collectionSets`.

import type { HttpClient } from '../_shared.js';

export interface CartOptimizerPick { slug: string; title: string; sellerUserId: string; sellerName: string | null; unitCents: number; shipCents: number }
export interface CartPlan {
  lines: { line: { query: string; quantity: number }; pick: CartOptimizerPick | null; alternatives: number }[];
  itemsCents: number;
  shippingCents: number;
  totalCents: number;
  sellers: number;
  unmatched: string[];
}

/** The cart optimizer. Requires `buyer:cart:read`. Prices a list; adds nothing to the cart. */
export class BuyerCartOptimizerResource {
  constructor(private http: HttpClient) {}

  /** `text`: one item per line, an optional leading quantity ("2 Charizard Base Set"). */
  plan(input: { text: string; fewestPackages?: boolean }) {
    return this.http.request<{ data: CartPlan }>({ method: 'POST', path: '/v1/buyer/cart-optimizer', body: input });
  }
}

export interface CollectionQuote {
  portfolioId: string;
  title: string | null;
  lastSaleCents: number | null;
  topBidCents: number | null;
  skuId: string | null;
  /** Crossly's instant offer in store credit, when switched on and the item qualifies. */
  offer: { id: string; cents: number; expiresAt: string } | null;
  /** An offer already accepted on this item, still going through the desk. */
  pending: { id: string; cents: number; status: string } | null;
}
export interface InstantOffer { id: string; portfolioId: string; offerCents: number; status: string; expiresAt: string; labelUrl: string | null; trackingCode: string | null; createdAt: string }

/** Instant offers on your collection. `buyer:offers:read` / `buyer:offers:write`. */
export class BuyerInstantOffersResource {
  constructor(private http: HttpClient) {}

  /** Top bid + Crossly's instant offer for one collection item. */
  quote(portfolioId: string) {
    return this.http.request<{ data: CollectionQuote }>({ method: 'GET', path: `/v1/buyer/collection/${encodeURIComponent(portfolioId)}/offer` });
  }

  list() {
    return this.http.request<{ data: InstantOffer[] }>({ method: 'GET', path: '/v1/buyer/instant-offers' });
  }

  accept(offerId: string) {
    return this.http.request<{ data: { ok: boolean } }>({ method: 'POST', path: `/v1/buyer/instant-offers/${encodeURIComponent(offerId)}/accept` });
  }
}

export interface CollectionSet { category: string; brand: string; model: string; brandSlug: string; modelSlug: string; total: number; owned: number; pct: number }
export interface CollectionSetDetail {
  group: Omit<CollectionSet, 'pct'>;
  pct: number;
  pieces: { skuId: string; title: string; imageUrl: string | null; number: number; owned: boolean; bestAskCents: number | null }[];
  missing: number;
  missingCostCents: number;
  missingUnpriced: number;
  leaderboard: { rank: number; name: string; owned: number }[];
  myRank: number | null;
  leaderboardOptIn: boolean;
}

/** Set completion + leaderboards. `buyer:orders:read`; opting in needs `buyer:activity:write`. */
export class BuyerCollectionSetsResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.request<{ data: CollectionSet[]; meta: { leaderboardOptIn: boolean } }>({ method: 'GET', path: '/v1/buyer/collection/sets' });
  }

  get(category: string, brandSlug: string, modelSlug: string) {
    return this.http.request<{ data: CollectionSetDetail }>({ method: 'GET', path: `/v1/buyer/collection/sets/${encodeURIComponent(category)}/${encodeURIComponent(brandSlug)}/${encodeURIComponent(modelSlug)}` });
  }

  setLeaderboard(optIn: boolean) {
    return this.http.request<{ data: { ok: boolean; optIn: boolean } }>({ method: 'PUT', path: '/v1/buyer/collection/sets/leaderboard', body: { optIn } });
  }
}
