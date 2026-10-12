import type { HttpClient } from './_shared.js';

// ─── Grail glints in Crossly World ───────────────────────────────────────────
//
// Which of a set of ids (listings, inventory pieces, catalogue SKUs) are things
// you already want: an open bid, a watched or wishlisted listing, a market
// watch, a card your deck is missing. The world glints them and points a
// compass at the nearest. Needs activity:read; nothing is written.

export interface GrailMatch {
  listingIds: string[];
  inventoryIds: string[];
  skuIds: string[];
}

export class WorldGrailsResource {
  constructor(private http: HttpClient) {}

  /** The subset of these ids that are your grails (up to 400 of each kind). */
  match(body: Partial<GrailMatch>) {
    return this.http.request<{ data: GrailMatch }>({ method: 'POST', path: '/v1/world/grails/match', body });
  }
}
