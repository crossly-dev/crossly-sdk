// ── Lists: saved for later, total requests, wishlists, history, follows ──
//
// Composed onto `BuyerResource` as `buyer.savedForLater`,
// `buyer.totalRequests`, `buyer.wishlists`, `buyer.history` and
// `buyer.following`. The basic wishlist reads and adds live on the buyer SDK;
// these are the management verbs.

import type { HttpClient } from '../_shared.js';

export interface SavedForLaterItem {
  id: string;
  platformListingId: string;
  slug: string;
  title: string;
  /** The listing's price now, in cents. */
  priceCents: number;
  thumbnail?: string | null;
  quantity: number;
  inStock: boolean;
  availableQuantity: number;
  sellerUserId: string;
  sellerDisplayName?: string | null;
  savedAt: string;
}

export interface TotalRequest {
  id: string;
  sellerUserId: string;
  sellerDisplayName?: string | null;
  /** requested | quoted | declined | expired */
  status: string;
  lines: { platformListingId: string; quantity: number }[];
  /** Combined shipping the seller quoted, in cents. */
  quotedShippingCents?: number | null;
  sellerMessage?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  matchesCart: boolean;
}

export interface WishlistSummary {
  id: string;
  name: string;
  shareToken?: string | null;
  isPublic: boolean;
  createdAt: string;
  shareUrl: string | null;
}

export interface FollowedSeller {
  sellerUserId: string;
  followedAt: string;
  username?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  activeListings: number;
  /** New listings since you last marked this seller seen. */
  newListings: number;
  lastSeenAt?: string | null;
}

type Ok = { data: { ok: boolean } };

/** Items parked out of the cart. Requires `buyer:cart:read` / `buyer:cart:write`. */
export class BuyerSavedForLaterResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.request<{ data: SavedForLaterItem[] }>({
      method: 'GET',
      path: '/v1/buyer/cart/saved',
    });
  }

  /** Move a cart line here. Returns the whole saved list. */
  save(cartItemId: string) {
    return this.http.request<{ data: SavedForLaterItem[] }>({
      method: 'POST',
      path: `/v1/buyer/cart/items/${encodeURIComponent(cartItemId)}/save-for-later`,
    });
  }

  /** Back into the cart at today's price. Returns what is still saved. */
  moveToCart(savedId: string) {
    return this.http.request<{ data: SavedForLaterItem[] }>({
      method: 'POST',
      path: `/v1/buyer/cart/saved/${encodeURIComponent(savedId)}/move-to-cart`,
    });
  }

  /** Drop it. Returns what is still saved. */
  remove(savedId: string) {
    return this.http.request<{ data: SavedForLaterItem[] }>({
      method: 'DELETE',
      path: `/v1/buyer/cart/saved/${encodeURIComponent(savedId)}`,
    });
  }
}

/** Combined-shipping total requests to sellers. */
export class BuyerTotalRequestsResource {
  constructor(private http: HttpClient) {}

  /** Newest request per seller. Requires `buyer:cart:read`. */
  list() {
    return this.http.request<{ data: TotalRequest[] }>({
      method: 'GET',
      path: '/v1/buyer/total-requests',
    });
  }

  /** Ask a seller for one total. Needs 2+ of their items in your cart. Requires `buyer:cart:write`. */
  request(input: { sellerUserId: string; message?: string }) {
    return this.http.request<{ data: { ok: boolean; id: string } }>({
      method: 'POST',
      path: '/v1/buyer/total-requests',
      body: input,
    });
  }

  /** Cancel a request. Requires `buyer:cart:write`. */
  cancel(id: string) {
    return this.http.request<Ok>({
      method: 'DELETE',
      path: `/v1/buyer/total-requests/${encodeURIComponent(id)}`,
    });
  }
}

/** Wishlist management. Requires `buyer:wishlist:write`. */
export class BuyerWishlistsResource {
  constructor(private http: HttpClient) {}

  /** Rename, or make public / private. */
  update(id: string, patch: { name?: string; isPublic?: boolean }) {
    return this.http.request<{ data: WishlistSummary }>({
      method: 'PATCH',
      path: `/v1/buyer/wishlists/${encodeURIComponent(id)}`,
      body: patch,
    });
  }

  /** Delete the list and everything on it. */
  delete(id: string) {
    return this.http.request<Ok>({
      method: 'DELETE',
      path: `/v1/buyer/wishlists/${encodeURIComponent(id)}`,
    });
  }

  /** Take one listing off the list. */
  removeItem(id: string, slug: string) {
    return this.http.request<{ data: { ok: boolean; removed: number } }>({
      method: 'DELETE',
      path: `/v1/buyer/wishlists/${encodeURIComponent(id)}/items/${encodeURIComponent(slug)}`,
    });
  }

  /**
   * Make the list public and get its link. `resetLink: true` replaces the
   * link and kills the old one. Stop sharing with `update(id, { isPublic: false })`.
   */
  share(id: string, opts: { resetLink?: boolean } = {}) {
    return this.http.request<{ data: { id: string; isPublic: boolean; shareToken: string | null; shareUrl: string | null } }>({
      method: 'POST',
      path: `/v1/buyer/wishlists/${encodeURIComponent(id)}/share`,
      body: opts,
    });
  }
}

/** Recently viewed. Requires `buyer:history:write`. */
export class BuyerHistoryResource {
  constructor(private http: HttpClient) {}

  /** Remove one listing. Viewing it again brings it back. */
  removeRecentlyViewed(slug: string) {
    return this.http.request<Ok>({
      method: 'DELETE',
      path: `/v1/buyer/recently-viewed/${encodeURIComponent(slug)}`,
    });
  }

  /** Clear the whole list. */
  clearRecentlyViewed() {
    return this.http.request<Ok>({
      method: 'DELETE',
      path: '/v1/buyer/recently-viewed',
    });
  }
}

/** Sellers you follow. */
export class BuyerFollowingResource {
  constructor(private http: HttpClient) {}

  /** With new-listing counts. Requires `buyer:follows:read`. */
  sellers() {
    return this.http.request<{ data: FollowedSeller[]; meta?: { newListings: number } }>({
      method: 'GET',
      path: '/v1/buyer/following/sellers',
    });
  }

  /** Clear "N new" on one seller, or all when omitted. Requires `buyer:follows:write`. */
  markSeen(sellerUserId?: string) {
    return this.http.request<{ data: { ok: boolean; updated: number } }>({
      method: 'POST',
      path: '/v1/buyer/following/sellers/seen',
      body: sellerUserId ? { sellerUserId } : {},
    });
  }
}
