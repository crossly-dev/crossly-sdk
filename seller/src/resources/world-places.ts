import type { HttpClient } from './_shared.js';

// ─── What a public Crossly World room shows a visitor ─────────────────────
//
// By the room's public slug: what is for sale, the shop behind it, bundle
// deals, the next drop, trades, the live sale, collection rooms, item
// interest, your have/want radar, trade tables and the Trade Floor boards.
// Read-only: nothing here changes hands.

/** A public room read (offers, deals, drops, tables...), as the api returns it. */
export type WorldPlaceRecord = Record<string, unknown>;

export class WorldPlacesResource {
  constructor(private readonly http: HttpClient) {}

  /** What is for sale in a public room (404 when no such room is shared). */
  placeOffers(slug: string) {
    return this.http.request<{ data: WorldPlaceRecord[] }>({ method: 'GET', path: `/v1/world/places/${encodeURIComponent(slug)}/offers` });
  }

  /** The shop behind a public room, or null. */
  placeSeller(slug: string) {
    return this.http.request<{ data: WorldPlaceRecord | null }>({ method: 'GET', path: `/v1/world/places/${encodeURIComponent(slug)}/seller` });
  }

  /** The room owner's bundle deals on its items (itemIds null = any N from the shop). */
  placeBundles(slug: string) {
    return this.http.request<{ data: WorldPlaceRecord[] }>({ method: 'GET', path: `/v1/world/places/${encodeURIComponent(slug)}/bundles` });
  }

  /** The room owner's next drop and how many people are waiting. */
  placeDrop(slug: string) {
    return this.http.request<{ data: WorldPlaceRecord }>({ method: 'GET', path: `/v1/world/places/${encodeURIComponent(slug)}/drop` });
  }

  /** Items in a room open to trades. */
  placeTrades(slug: string) {
    return this.http.request<{ data: WorldPlaceRecord[] }>({ method: 'GET', path: `/v1/world/places/${encodeURIComponent(slug)}/trades` });
  }

  /** The room owner's live sale, or null. */
  placeLive(slug: string) {
    return this.http.request<{ data: WorldPlaceRecord | null }>({ method: 'GET', path: `/v1/world/places/${encodeURIComponent(slug)}/live` });
  }

  /** The shop's pet kind, or null. */
  placeShopPet(slug: string) {
    return this.http.request<{ data: string | null }>({ method: 'GET', path: `/v1/world/places/${encodeURIComponent(slug)}/shop-pet` });
  }

  /** The room owner's collection rooms. */
  placeCollections(slug: string) {
    return this.http.request<{ data: WorldPlaceRecord[] }>({ method: 'GET', path: `/v1/world/places/${encodeURIComponent(slug)}/collections` });
  }

  /** One collection room: every piece, owned or missing. */
  placeCollection(slug: string, category: string, brand: string, model: string) {
    return this.http.request<{ data: WorldPlaceRecord }>({ method: 'GET', path: `/v1/world/places/${encodeURIComponent(slug)}/collections/${encodeURIComponent(category)}/${encodeURIComponent(brand)}/${encodeURIComponent(model)}` });
  }

  /** How many people looked at one item in a room today. */
  placeInterest(slug: string, itemId: string) {
    return this.http.request<{ data: WorldPlaceRecord }>({ method: 'GET', path: `/v1/world/places/${encodeURIComponent(slug)}/items/${encodeURIComponent(itemId)}/interest` });
  }

  /** What you have that someone in this room wants, and what is here that you want. */
  placeRadar(slug: string) {
    return this.http.request<{ data: WorldPlaceRecord[] }>({ method: 'GET', path: `/v1/world/places/${encodeURIComponent(slug)}/radar` });
  }

  /** The open trade tables in a place. */
  placeTradeTables(slug: string) {
    return this.http.request<{ data: WorldPlaceRecord[] }>({ method: 'GET', path: `/v1/world/places/${encodeURIComponent(slug)}/trade-tables` });
  }

  /** The Trade Floor's wall of wants and its authentication desk. */
  placeBoards(slug: string) {
    return this.http.request<{ data: WorldPlaceRecord }>({ method: 'GET', path: `/v1/world/places/${encodeURIComponent(slug)}/boards` });
  }
}
