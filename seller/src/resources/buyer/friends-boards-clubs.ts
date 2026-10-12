// ── Shop with friends, outfit boards, shop the look, loyalty clubs ──
//
// Composed onto `BuyerResource` as `buyer.friends`, `buyer.boards`,
// `buyer.looks` and `buyer.clubs` (buyer parity W8b).

import type { HttpClient } from '../_shared.js';

export interface InviteLink { token: string; url: string; expiresAt: string }
export interface Person { userId: string; name: string; joinedAt: string }

/** Friends in chats and shared wishlists. Chats need `buyer:activity:*`; wishlists `buyer:wishlist:*`. */
export class BuyerFriendsResource {
  constructor(private http: HttpClient) {}
  /** A single-use link that adds a friend to a chat with a seller as a guest (the thread's buyer only). */
  inviteToChat(conversationId: string) { return this.http.request<{ data: InviteLink }>({ method: 'POST', path: `/v1/buyer/conversations/${encodeURIComponent(conversationId)}/invite` }); }
  joinChat(token: string) { return this.http.request<{ data: { conversationId: string } }>({ method: 'POST', path: `/v1/buyer/conversations/join/${encodeURIComponent(token)}` }); }
  chatGuests(conversationId: string) { return this.http.request<{ data: Person[] }>({ method: 'GET', path: `/v1/buyer/conversations/${encodeURIComponent(conversationId)}/guests` }); }
  /** Remove a guest (the buyer), or leave (your own user id). */
  removeChatGuest(conversationId: string, userId: string) { return this.http.request<{ data: { ok: boolean } }>({ method: 'DELETE', path: `/v1/buyer/conversations/${encodeURIComponent(conversationId)}/guests/${encodeURIComponent(userId)}` }); }
  /** A single-use link that makes a friend a co-editor of your wishlist. */
  inviteToWishlist(wishlistId: string) { return this.http.request<{ data: InviteLink }>({ method: 'POST', path: `/v1/buyer/wishlists/${encodeURIComponent(wishlistId)}/invite` }); }
  joinWishlist(token: string) { return this.http.request<{ data: { wishlistId: string } }>({ method: 'POST', path: `/v1/buyer/wishlists/join/${encodeURIComponent(token)}` }); }
  wishlistMembers(wishlistId: string) { return this.http.request<{ data: Person[] }>({ method: 'GET', path: `/v1/buyer/wishlists/${encodeURIComponent(wishlistId)}/members` }); }
  removeWishlistMember(wishlistId: string, userId: string) { return this.http.request<{ data: { ok: boolean } }>({ method: 'DELETE', path: `/v1/buyer/wishlists/${encodeURIComponent(wishlistId)}/members/${encodeURIComponent(userId)}` }); }
}

export interface BoardItem { platformListingId: string; slug: string | null; title: string | null; priceCents: number; imageUrl: string | null; available: boolean; x: number; y: number; w: number; z: number; note: string | null }
export interface Board { id: string; title: string; description: string | null; isPublic: boolean; shareToken: string | null; coverUrl: string | null; ownerName: string; mine: boolean; items: BoardItem[]; updatedAt: string }
export interface BoardRow { id: string; title: string; isPublic: boolean; shareToken: string; coverUrl: string | null; itemCount: number; updatedAt: string }

/** Outfit boards. Reading needs `buyer:wishlist:read`; editing `buyer:wishlist:write`. Positions are fractions of the board (0–1). */
export class BuyerBoardsResource {
  constructor(private http: HttpClient) {}
  list() { return this.http.request<{ data: BoardRow[] }>({ method: 'GET', path: '/v1/buyer/boards' }); }
  create(input: { title: string; description?: string; isPublic?: boolean }) { return this.http.request<{ data: { id: string; shareToken: string } }>({ method: 'POST', path: '/v1/buyer/boards', body: input }); }
  get(id: string) { return this.http.request<{ data: Board }>({ method: 'GET', path: `/v1/buyer/boards/${encodeURIComponent(id)}` }); }
  shared(token: string) { return this.http.request<{ data: Board }>({ method: 'GET', path: `/v1/buyer/boards/shared/${encodeURIComponent(token)}` }); }
  update(id: string, input: { title?: string; description?: string; isPublic?: boolean }) { return this.http.request<{ data: { ok: boolean } }>({ method: 'PATCH', path: `/v1/buyer/boards/${encodeURIComponent(id)}`, body: input }); }
  delete(id: string) { return this.http.request<{ data: { ok: boolean } }>({ method: 'DELETE', path: `/v1/buyer/boards/${encodeURIComponent(id)}` }); }
  saveLayout(id: string, items: Array<{ platformListingId: string; x: number; y: number; w: number; z: number; note?: string }>) { return this.http.request<{ data: Board }>({ method: 'PUT', path: `/v1/buyer/boards/${encodeURIComponent(id)}/layout`, body: { items } }); }
  add(id: string, slug: string) { return this.http.request<{ data: { ok: boolean } }>({ method: 'POST', path: `/v1/buyer/boards/${encodeURIComponent(id)}/items`, body: { slug } }); }
  remove(id: string, platformListingId: string) { return this.http.request<{ data: { ok: boolean } }>({ method: 'DELETE', path: `/v1/buyer/boards/${encodeURIComponent(id)}/items/${encodeURIComponent(platformListingId)}` }); }
}

export interface Hotspot { platformListingId: string; x: number; y: number; label: string | null; slug: string | null; title: string | null; priceCents: number; imageUrl: string | null; available: boolean }

/** Shop the look: listings tagged on story and lookbook photos. Needs `buyer:catalog:read`. */
export class BuyerLooksResource {
  constructor(private http: HttpClient) {}
  hotspots(targetType: 'story' | 'story_v1' | 'collection', targetId: string) { return this.http.request<{ data: Hotspot[] }>({ method: 'GET', path: '/v1/buyer/hotspots', query: { targetType, targetId } }); }
}

export interface Club {
  sellerUserId: string; name: string; description: string | null;
  tiers: Array<{ name: string; minSpendCents: number; discountBps: number; perks: string | null }>;
  member: null | { spendCents: number; tier: string | null; discountBps: number; next: { name: string; minSpendCents: number } | null; joinedAt: string };
}

export type MyClub = Club & { sellerName: string; sellerHandle: string | null };

/** Sellers' loyalty clubs. Reading needs `buyer:follows:read` / `buyer:catalog:read`; joining `buyer:follows:write`. */
export class BuyerClubsResource {
  constructor(private http: HttpClient) {}
  mine() { return this.http.request<{ data: MyClub[] }>({ method: 'GET', path: '/v1/buyer/clubs' }); }
  forSeller(sellerUserId: string) { return this.http.request<{ data: Club | null }>({ method: 'GET', path: `/v1/buyer/sellers/${encodeURIComponent(sellerUserId)}/club` }); }
  join(sellerUserId: string) { return this.http.request<{ data: Club }>({ method: 'POST', path: `/v1/buyer/sellers/${encodeURIComponent(sellerUserId)}/club/join` }); }
  leave(sellerUserId: string) { return this.http.request<{ data: { ok: boolean } }>({ method: 'DELETE', path: `/v1/buyer/sellers/${encodeURIComponent(sellerUserId)}/club/join` }); }
}
