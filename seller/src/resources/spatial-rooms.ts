import type { HttpClient } from './_shared.js';

// ─── Arranging and sharing your Crossly World rooms ───────────────────────
//
// Invites (the code is shown once; only its hash is stored), direct grants,
// pinning items to slots, warehouse units and racks, cosmetics and the shop
// layout. Every call is checked against your ownership (or staff arrange
// rights) server-side.

/** A room read or write result, as the api returns it. */
export type SpatialRecord = Record<string, unknown>;
/** Pinning an item: a warehouse nodeId, or a collection containerKey + containerIndex. */
export interface SpatialPlaceInput {
  inventoryItemId: string; inventoryUnitId?: string | null; slotIndex: number;
  nodeId?: string; containerKey?: string; containerIndex?: number;
}
/** A warehouse unit. */
export interface SpatialNodeInput { unitKey: string; parentId?: string | null; segment?: string | null; label?: string | null; sort?: number }
/** Stocking a rack. */
export interface SpatialStockInput { nodeId: string; inventoryItemId: string; inventoryUnitId?: string | null }
/** Placing in a shop section. */
export interface SpatialShopPlaceInput {
  sectionId: string; containerKey: string; containerIndex: number; slotIndex: number; inventoryItemId: string; inventoryUnitId?: string | null;
}

/** Your street window (Wave 10.3): picks in slot order, and the listings you could put in it. */
export interface ShopWindowRead { picks: string[]; choices: Array<{ listingId: string; slug: string; title: string; priceCents: number; imageUrl: string | null }> }

export class SpatialRoomsResource {
  constructor(private readonly http: HttpClient) {}

  /** Mint an invite code to one of your rooms. The code is in this response only. */
  createInvite(sceneId: string, opts: { role?: 'visitor' | 'staff'; expiresInHours?: number | null } = {}) {
    return this.http.request<{ data: SpatialRecord }>({ method: 'POST', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/invites`, body: opts });
  }

  /** Everyone who can walk into one of your rooms, and unused invites (never codes). */
  grants(sceneId: string) {
    return this.http.request<{ data: SpatialRecord[] }>({ method: 'GET', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/grants` });
  }

  /** Let a specific user into one of your rooms. */
  grantAccess(sceneId: string, userId: string, role?: 'visitor' | 'staff') {
    return this.http.request<{ data: SpatialRecord }>({ method: 'POST', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/grants`, body: { userId, role } });
  }

  /** Take access away, or kill an unused invite. */
  revokeGrant(sceneId: string, grantId: string) {
    return this.http.request<{ data: SpatialRecord }>({ method: 'DELETE', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/grants/${encodeURIComponent(grantId)}` });
  }

  /** Redeem an invite code; returns the room it opens. */
  acceptInvite(code: string) {
    return this.http.request<{ data: SpatialRecord }>({ method: 'POST', path: `/v1/spatial/invites/accept`, body: { code } });
  }

  /** Rooms other people let you into. */
  sharedWithMe() {
    return this.http.request<{ data: SpatialRecord[] }>({ method: 'GET', path: `/v1/spatial/shared-with-me` });
  }

  /** Pin an item to a slot: by warehouse nodeId, or collection containerKey + containerIndex. */
  placeItem(sceneId: string, input: SpatialPlaceInput) {
    return this.http.request<{ data: SpatialRecord }>({ method: 'POST', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/place`, body: input });
  }

  /** Clear every pin, so the room arranges itself again. */
  unpin(sceneId: string) {
    return this.http.request<{ data: SpatialRecord }>({ method: 'POST', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/unpin`, body: {} });
  }

  /** Add a unit (rack, shelf, bin) to a warehouse room. */
  addNode(sceneId: string, input: SpatialNodeInput) {
    return this.http.request<{ data: SpatialRecord }>({ method: 'POST', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/nodes`, body: input });
  }

  /** Remove units (up to 500) from a warehouse room. */
  removeNodes(sceneId: string, nodeIds: string[]) {
    return this.http.request<{ data: SpatialRecord }>({ method: 'DELETE', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/nodes`, body: { nodeIds } });
  }

  /** Move a rack (metres). */
  moveNode(sceneId: string, nodeId: string, position: [number, number, number]) {
    return this.http.request<{ data: SpatialRecord }>({ method: 'PATCH', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/nodes/${encodeURIComponent(nodeId)}`, body: { position } });
  }

  /** Redecorate a room; unknown keys are dropped and the response is what survived. */
  setCosmetics(sceneId: string, cosmetics: SpatialRecord) {
    return this.http.request<{ data: SpatialRecord }>({ method: 'PATCH', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/cosmetics`, body: cosmetics });
  }

  /** Stock not yet on a shelf in a warehouse room you can arrange. */
  unplaced(sceneId: string) {
    return this.http.request<{ data: SpatialRecord[] }>({ method: 'GET', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/warehouse/unplaced` });
  }

  /** Put an item (or unit) on a rack. */
  stock(sceneId: string, input: SpatialStockInput) {
    return this.http.request<{ data: SpatialRecord }>({ method: 'POST', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/warehouse/stock`, body: input });
  }

  /** Take an item (or unit) off its rack. */
  unstock(sceneId: string, inventoryItemId: string, inventoryUnitId?: string) {
    return this.http.request<{ data: SpatialRecord }>({ method: 'DELETE', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/warehouse/stock`, body: { inventoryItemId, inventoryUnitId } });
  }

  /** Your street window picks in slot order (Wave 10.3), and the listings you could put in it. */
  shopWindow(sceneId: string) {
    return this.http.request<{ data: ShopWindowRead }>({ method: 'GET', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/window` });
  }

  /** Choose up to three live Crossly listings for your street window, in slot order; [] = newest first. */
  setShopWindow(sceneId: string, listingIds: string[]) {
    return this.http.request<{ data: { picks: string[] } }>({ method: 'PUT', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/window`, body: { listingIds } });
  }

  /** Save the shop room sections and displays. */
  saveShopLayout(sceneId: string, layout: SpatialRecord) {
    return this.http.request<{ data: SpatialRecord }>({ method: 'PUT', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/shop/layout`, body: { layout } });
  }

  /** Place an item in a section and display of your shop room. */
  placeInShop(sceneId: string, input: SpatialShopPlaceInput) {
    return this.http.request<{ data: SpatialRecord }>({ method: 'POST', path: `/v1/spatial/scenes/${encodeURIComponent(sceneId)}/shop/place`, body: input });
  }
}
