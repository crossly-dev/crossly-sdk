// ── AI try-on ───────────────────────────────────────────────────────
//
// Composed onto `BuyerResource` as `buyer.tryOn`. Renders a wearable listing
// on the buyer's own photo. The output is AI-generated — a preview of fit and
// look, never a claim about the item — and the buyer can delete every photo.

import type { HttpClient } from '../_shared.js';

export interface TryOn {
  id: string;
  listingId: string;
  resultUrl: string | null;
  /** rendering | done | failed */
  status: string;
  createdAt: string;
  listingTitle: string | null;
}

/** Try-on. Availability needs `buyer:catalog:read`; history `buyer:activity:read`; rendering and deleting `buyer:activity:write`. */
export class BuyerTryOnResource {
  constructor(private http: HttpClient) {}

  availability(slug: string) {
    return this.http.request<{ data: { eligible: boolean; configured: boolean } }>({ method: 'GET', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/try-on` });
  }

  /** `photo` is a base64 JPEG/PNG/WebP of the buyer (≤10 MB); or `reuseLastPhoto`. The buyer confirms it is them and they are 18+. */
  render(slug: string, input: { photo?: string; reuseLastPhoto?: boolean; confirmSelfAdult: true }) {
    return this.http.request<{ data: TryOn }>({ method: 'POST', path: `/v1/buyer/listings/${encodeURIComponent(slug)}/try-on`, body: input });
  }

  list() {
    return this.http.request<{ data: TryOn[] }>({ method: 'GET', path: '/v1/buyer/try-ons' });
  }

  /** Delete one try-on, or `'all'` to delete every photo and result. */
  delete(id: string | 'all') {
    return this.http.request<{ data: { deleted: number } }>({ method: 'DELETE', path: `/v1/buyer/try-ons/${encodeURIComponent(id)}` });
  }
}
