import type { HttpClient } from './_shared.js';

// ─── Provenance trails in Crossly World ──────────────────────────────────────
//
// Where in the world each of your purchases was found: "Found at The Sneaker
// Vault, Oct 2026". Yours only. Reads need activity:read.

export interface WorldProvenance {
  platformListingId: string;
  slug: string | null;
  kind: 'room' | 'window' | 'stall' | 'space' | 'drop' | 'auction' | 'worn' | 'agent';
  place: string | null;
  at: string;
  line: string;
}

export class WorldProvenanceResource {
  constructor(private http: HttpClient) {}

  /** Newest first; pass platform listing ids to ask about just those. */
  list(listingIds?: string[]) {
    return this.http.request<{ data: WorldProvenance[] }>({ method: 'GET', path: '/v1/world/provenance', query: listingIds?.length ? { listingIds: listingIds.join(',') } : undefined });
  }
}
