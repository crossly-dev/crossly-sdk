import type { HttpClient } from './_shared.js';

// ─── Neighbourhoods ─────────────────────────────────────────────────────────
//
// Crossly World's four streets by taste, beside Main Street: Sneaker Row
// (sneakers, streetwear), Card District (trading cards, comics), Vintage Alley
// (vintage clothing, accessories) and Vinyl Lane (records, music gear). A
// neighbourhood opens once it has 6 businesses (open shops + open stalls) or a
// street event is on; until then it is "Opening soon - N of 6 shops". Its
// stalls and events are the ordinary street reads (`stalls.streetStalls`,
// `stalls.streetEvents`) by slug.

export type NeighbourhoodSlug = 'sneaker-row' | 'card-district' | 'vintage-alley' | 'vinyl-lane';

export interface Neighbourhood {
  slug: NeighbourhoodSlug;
  name: string;
  tagline: string;
  who: string;
  anchor: { kind: 'authentication_desk' | 'grading_desk' | 'fitting_rooms' | 'listening_booths' | string; label: string };
  /** The street's accent colour (hex). */
  accent: string;
  open: boolean;
  /** "Open - 7 shops" / "Opening soon - 2 of 6 shops". */
  status: string;
  shops: number;
  stallsToday: number;
  openStalls: number;
  minShops: number;
  nextEvent: { id: string; kind: 'night_market' | 'swap_meet' | string; title: string; startsAt: string; endsAt: string; live: boolean } | null;
  /** Path on crossly.net, e.g. /c/sneaker-row. */
  url: string;
}

export class NeighbourhoodsResource {
  constructor(private http: HttpClient) {}

  /** Every neighbourhood: open state, shops, stalls today, next street event. */
  list() {
    return this.http.request<{ data: Neighbourhood[] }>({ method: 'GET', path: '/v1/neighbourhoods' });
  }

  /** One neighbourhood by slug. */
  get(slug: NeighbourhoodSlug) {
    return this.http.request<{ data: Neighbourhood }>({ method: 'GET', path: `/v1/neighbourhoods/${encodeURIComponent(slug)}` });
  }
}
